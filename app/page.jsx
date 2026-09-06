'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { 
  INITIAL_STAFF, 
  INITIAL_OCTOBER_ROSTER, 
  DC_SETTINGS_DEFAULT,
  SHIFT_TYPES 
} from '../data/initialData';
import { 
  getDaysInMonth, 
  calculateDailyCoverage, 
  checkComplianceViolations, 
  generateAutoSchedule 
} from '../utils/schedulerEngine';

import { Header } from '../components/Header';
import { TopMetricsBar } from '../components/TopMetricsBar';
import { ShiftLegend } from '../components/ShiftLegend';
import { ShiftTable } from '../components/ShiftTable';
import { ShiftPickerModal } from '../components/ShiftPickerModal';
import { ShiftSwapModal } from '../components/ShiftSwapModal';
import { AnalyticsModal } from '../components/AnalyticsModal';
import { AutoScheduleModal } from '../components/AutoScheduleModal';
import { StaffModal } from '../components/StaffModal';
import { fetchMonthFromSheet, fetchStaffFromSheet } from '../utils/sheetSync';

/** ดึงจากชีตซ้ำทุก 1 นาที (Google แคชไฟล์ที่เผยแพร่ราว 5 นาที ถี่กว่านี้ไม่ได้ข้อมูลใหม่) */
const SHEET_POLL_MS = 60 * 1000;
const EDITED_MONTHS_KEY = 'dc_sheet_edited_months';
const STAFF_EDITED_KEY = 'dc_sheet_staff_edited';

const monthKey = (yr, mo) => `${yr}-${mo}`;

function loadEditedMonths() {
  try {
    const raw = localStorage.getItem(EDITED_MONTHS_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

// Helper to safely get roster for any month
function getInitialRoster(yr, mo, staff = INITIAL_STAFF, setts = DC_SETTINGS_DEFAULT) {
  const days = getDaysInMonth(yr, mo);
  if (yr === 2026 && mo === 10) {
    return INITIAL_OCTOBER_ROSTER;
  }
  try {
    return generateAutoSchedule({
      staffList: staff,
      daysCount: days,
      year: yr,
      month: mo,
      minPerShift: setts.minStaffPerShift,
      fixStaffA: true
    });
  } catch {
    const fresh = {};
    staff.forEach(s => {
      fresh[s.id] = new Array(days).fill('H');
    });
    return fresh;
  }
}

function isValidSchedule(sch, expectedDays) {
  if (!sch || typeof sch !== 'object') return false;
  const entries = Object.entries(sch);
  if (entries.length === 0) return false;
  return entries.every(([_, arr]) => Array.isArray(arr) && arr.length === expectedDays);
}

export default function Home() {
  const [mounted, setMounted] = useState(false);

  // Theme state
  const [theme, setTheme] = useState('dark');

  // Month & Year state (Defaults to current month/year)
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [month, setMonth] = useState(() => new Date().getMonth() + 1); // 1-12

  const daysCount = useMemo(() => getDaysInMonth(year, month), [year, month]);

  // Staff list state (persisted in localStorage or default)
  const [staffList, setStaffList] = useState(INITIAL_STAFF);

  // Settings
  const [settings, setSettings] = useState(DC_SETTINGS_DEFAULT);

  // Schedule state (Key: staffId -> Array of shifts length = daysCount)
  const [schedule, setSchedule] = useState(() => {
    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = now.getMonth() + 1;
    return getInitialRoster(curYear, curMonth, INITIAL_STAFF, DC_SETTINGS_DEFAULT);
  });

  // Active paint brush for quick stamp
  const [activeBrush, setActiveBrush] = useState(null);

  // Modals state
  const [isAutoScheduleOpen, setIsAutoScheduleOpen] = useState(false);
  const [isSwapOpen, setIsSwapOpen] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [isStaffOpen, setIsStaffOpen] = useState(false);
  const [pickerTarget, setPickerTarget] = useState(null); // { staffId, dayIndex }

  // --- ซิงก์กับ Google Sheet ---------------------------------------------
  // โหมดผสม: ดึงอัตโนมัติ จนกว่าผู้ใช้จะแก้กะของเดือนนั้นเอง แล้วจึงหยุดจนกดดึงใหม่
  const [sheetStatus, setSheetStatus] = useState({ status: 'idle' });
  const [editedMonths, setEditedMonths] = useState(() => new Set());
  const staffListRef = useRef(staffList);
  const applyingSheetRef = useRef(false);

  // รายชื่อเจ้าหน้าที่มาจากแท็บ "พนักงาน" ของชีตเดียวกัน ใช้กติกาเดียวกับตารางกะ
  const [staffSheetStatus, setStaffSheetStatus] = useState({ status: 'idle' });
  const [staffEdited, setStaffEdited] = useState(false);
  const applyingStaffRef = useRef(false);

  useEffect(() => { staffListRef.current = staffList; }, [staffList]);

  const isMonthLocked = editedMonths.has(monthKey(year, month));

  /** เรียกเมื่อผู้ใช้แก้ตารางเอง เพื่อหยุด auto-sync ของเดือนนั้น */
  const markMonthEdited = useCallback(() => {
    if (applyingSheetRef.current) return; // การเขียนจากชีตไม่นับเป็นการแก้เอง
    const key = monthKey(year, month);
    setEditedMonths(prev => {
      if (prev.has(key)) return prev;
      const next = new Set(prev);
      next.add(key);
      try {
        localStorage.setItem(EDITED_MONTHS_KEY, JSON.stringify([...next]));
      } catch (e) {
        console.warn('LocalStorage error:', e);
      }
      return next;
    });
  }, [year, month]);

  /** เรียกเมื่อผู้ใช้แก้ข้อมูลพนักงานเอง เพื่อหยุด auto-sync รายชื่อ */
  const markStaffEdited = useCallback(() => {
    if (applyingStaffRef.current) return;
    setStaffEdited(true);
    try {
      localStorage.setItem(STAFF_EDITED_KEY, '1');
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }, []);

  // Load from localStorage after mount to prevent SSR hydration mismatch
  useEffect(() => {
    setMounted(true);
    // Prevent browser from auto-restoring scroll positions
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    try {
      const savedTheme = localStorage.getItem('dc_shift_theme');
      if (savedTheme) {
        setTheme(savedTheme);
        document.documentElement.setAttribute('data-theme', savedTheme);
      }
      setEditedMonths(loadEditedMonths());
      setStaffEdited(localStorage.getItem(STAFF_EDITED_KEY) === '1');
      let currentStaff = INITIAL_STAFF;
      const savedStaff = localStorage.getItem('dc_shift_staff_list');
      if (savedStaff) {
        currentStaff = JSON.parse(savedStaff);
        setStaffList(currentStaff);
      }
      const savedSchedule = localStorage.getItem(`dc_shift_schedule_${year}_${month}`);
      if (savedSchedule) {
        const parsed = JSON.parse(savedSchedule);
        if (isValidSchedule(parsed, daysCount)) {
          setSchedule(parsed);
        } else {
          localStorage.removeItem(`dc_shift_schedule_${year}_${month}`);
          setSchedule(getInitialRoster(year, month, currentStaff, settings));
        }
      } else {
        setSchedule(getInitialRoster(year, month, currentStaff, settings));
      }
    } catch (e) {
      console.warn('LocalStorage load error:', e);
    }
  }, []);

  // Sync to localStorage
  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem('dc_shift_staff_list', JSON.stringify(staffList));
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }, [staffList, mounted]);

  useEffect(() => {
    if (!mounted) return;
    if (!isValidSchedule(schedule, daysCount)) return;
    try {
      localStorage.setItem(`dc_shift_schedule_${year}_${month}`, JSON.stringify(schedule));
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }, [schedule, year, month, daysCount, mounted]);

  // Handle month / year change
  useEffect(() => {
    if (!mounted) return;
    try {
      const saved = localStorage.getItem(`dc_shift_schedule_${year}_${month}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (isValidSchedule(parsed, daysCount)) {
          setSchedule(parsed);
          return;
        } else {
          localStorage.removeItem(`dc_shift_schedule_${year}_${month}`);
        }
      }
    } catch (e) {
      // ignore
    }

    setSchedule(getInitialRoster(year, month, staffList, settings));
  }, [year, month, daysCount, mounted, settings]);

  /**
   * ดึงรายชื่อเจ้าหน้าที่จากแท็บ "พนักงาน" ของชีตมาทับ
   * force = true คือผู้ใช้กดเอง จะปลดล็อกให้กลับมาซิงก์อัตโนมัติด้วย
   */
  const syncStaffFromSheet = useCallback(async ({ force = false } = {}) => {
    setStaffSheetStatus(s => ({ ...s, status: 'loading' }));
    try {
      const result = await fetchStaffFromSheet({ existingStaff: staffListRef.current });

      applyingStaffRef.current = true;
      setStaffList(result.staff);
      staffListRef.current = result.staff;
      setTimeout(() => { applyingStaffRef.current = false; }, 0);

      if (force) {
        setStaffEdited(false);
        try {
          localStorage.removeItem(STAFF_EDITED_KEY);
        } catch (e) {
          console.warn('LocalStorage error:', e);
        }
      }

      setStaffSheetStatus({
        status: 'synced',
        tabName: result.tabName,
        fetchedAt: result.fetchedAt,
        count: result.staff.length
      });
      return result.staff;
    } catch (err) {
      setStaffSheetStatus({ status: 'error', error: err.message, fetchedAt: Date.now() });
      return null;
    }
  }, []);

  /**
   * ดึงตารางกะของเดือนที่เลือกจาก Google Sheet มาทับ
   * force = true คือผู้ใช้กดเอง จะปลดล็อกเดือนนั้นให้กลับมาซิงก์อัตโนมัติด้วย
   */
  const syncFromSheet = useCallback(async ({ force = false } = {}) => {
    const key = monthKey(year, month);
    setSheetStatus(s => ({ ...s, status: 'loading' }));
    try {
      const result = await fetchMonthFromSheet({
        year,
        month,
        staffList: staffListRef.current,
        daysCount
      });

      if (result.status === 'no-tab') {
        // เดือนนี้ยังไม่มีในชีต -> คงตารางที่แอปสร้างเองไว้
        setSheetStatus({
          status: 'no-tab',
          fetchedAt: result.fetchedAt,
          availableTabs: result.availableTabs
        });
        return;
      }

      applyingSheetRef.current = true;
      setSchedule(result.schedule);
      // ปลดธงหลัง React เขียน state เสร็จ ไม่งั้นการแก้ครั้งถัดไปจะไม่ถูกนับ
      setTimeout(() => { applyingSheetRef.current = false; }, 0);

      if (force) {
        setEditedMonths(prev => {
          if (!prev.has(key)) return prev;
          const next = new Set(prev);
          next.delete(key);
          try {
            localStorage.setItem(EDITED_MONTHS_KEY, JSON.stringify([...next]));
          } catch (e) {
            console.warn('LocalStorage error:', e);
          }
          return next;
        });
      }

      setSheetStatus({
        status: 'synced',
        tabName: result.tabName,
        fetchedAt: result.fetchedAt,
        unmatchedRows: result.unmatchedRows,
        missingStaff: result.missingStaff,
        unknownCodes: result.unknownCodes
      });
    } catch (err) {
      setSheetStatus({ status: 'error', error: err.message, fetchedAt: Date.now() });
    }
  }, [year, month, daysCount]);

  // ดึงรายชื่อเจ้าหน้าที่อัตโนมัติ ข้ามไปถ้าผู้ใช้แก้รายชื่อเองแล้ว
  useEffect(() => {
    if (!mounted) return;
    if (staffEdited) return;

    syncStaffFromSheet();
    const id = setInterval(() => syncStaffFromSheet(), SHEET_POLL_MS);
    return () => clearInterval(id);
  }, [mounted, staffEdited, syncStaffFromSheet]);

  // ดึงอัตโนมัติเมื่อเปิดแอป / เปลี่ยนเดือน แล้ววนซ้ำตามรอบ
  // ข้ามไปถ้าเดือนนี้ถูกแก้ในแอปแล้ว (ผู้ใช้ต้องกดปุ่มเองเพื่อดึงทับ)
  // ผูกกับ staffList ด้วย เพราะตารางกะจับคู่แถวตามรายชื่อ ถ้ารายชื่อเปลี่ยนต้องแมปใหม่
  useEffect(() => {
    if (!mounted) return;
    if (isMonthLocked) return;

    syncFromSheet();
    const id = setInterval(() => syncFromSheet(), SHEET_POLL_MS);
    return () => clearInterval(id);
  }, [mounted, isMonthLocked, syncFromSheet, staffList]);

  // Calculations
  const dailyCoverage = useMemo(() => {
    return calculateDailyCoverage(schedule, staffList, daysCount, settings);
  }, [schedule, staffList, daysCount, settings]);

  const violationsMap = useMemo(() => {
    return checkComplianceViolations(schedule, staffList, daysCount);
  }, [schedule, staffList, daysCount]);

  const totalShiftsCount = useMemo(() => {
    let count = 0;
    Object.values(schedule).forEach(shifts => {
      shifts?.forEach(c => {
        if (c === '1' || c === '2' || c === '3' || c === 'A') count++;
      });
    });
    return count;
  }, [schedule]);

  // Cell Change Handler
  const handleCellChange = (staffId, dayIndex, newShift) => {
    markMonthEdited();
    setSchedule(prev => {
      const currentStaffShifts = prev[staffId] ? [...prev[staffId]] : new Array(daysCount).fill('H');
      while (currentStaffShifts.length < daysCount) {
        currentStaffShifts.push('H');
      }
      currentStaffShifts[dayIndex] = newShift;
      return {
        ...prev,
        [staffId]: currentStaffShifts
      };
    });
  };

  // Batch Fill
  const handleBatchApply = (staffId, startDay, endDay, shiftCode) => {
    markMonthEdited();
    setSchedule(prev => {
      const current = prev[staffId] ? [...prev[staffId]] : new Array(daysCount).fill('H');
      for (let d = startDay; d <= endDay; d++) {
        current[d] = shiftCode;
      }
      return {
        ...prev,
        [staffId]: current
      };
    });
  };

  // Shift Swap Handler
  const handleConfirmSwap = ({ staffAId, dayA, shiftA, staffBId, dayB, shiftB }) => {
    markMonthEdited();
    setSchedule(prev => {
      const nextA = prev[staffAId] ? [...prev[staffAId]] : new Array(daysCount).fill('H');
      const nextB = prev[staffBId] ? [...prev[staffBId]] : new Array(daysCount).fill('H');

      nextA[dayA] = shiftB;
      nextB[dayB] = shiftA;

      return {
        ...prev,
        [staffAId]: nextA,
        [staffBId]: nextB
      };
    });
  };

  // Auto Schedule Generator
  const handleAutoSchedule = ({ minPerShift, fixStaffA }) => {
    try {
      const generated = generateAutoSchedule({
        staffList,
        daysCount,
        year,
        month,
        minPerShift,
        fixStaffA
      });
      markMonthEdited();
      setSchedule(generated);
    } catch (err) {
      alert(err.message || 'ไม่สามารถจัดกะอัตโนมัติได้');
    }
  };

  // Export to Excel (dynamically loaded on demand to prevent SSR bundling issue)
  const handleExportExcel = async () => {
    try {
      const { exportRosterToExcel } = await import('../utils/excelExport.js');
      await exportRosterToExcel({
        schedule,
        staffList,
        year,
        month,
        daysCount
      });
    } catch (err) {
      console.error('Export error:', err);
      alert('เกิดข้อผิดพลาดในการดาวน์โหลด Excel: ' + err.message);
    }
  };

  // Staff CRUD
  const handleAddStaff = (newStaffData) => {
    markStaffEdited();
    const newId = Date.now();
    const created = {
      id: newId,
      empCode: `CNO-0${staffList.length + 1}`,
      name: newStaffData.name,
      position: newStaffData.position,
      phone: newStaffData.phone
    };
    setStaffList(prev => [...prev, created]);
    setSchedule(prev => ({
      ...prev,
      [newId]: new Array(daysCount).fill('H')
    }));
  };

  const handleUpdateStaff = (id, updatedData) => {
    markStaffEdited();
    setStaffList(prev => prev.map(s => s.id === id ? { ...s, ...updatedData } : s));
  };

  const handleDeleteStaff = (id) => {
    if (staffList.length <= 3) {
      alert('ศูนย์ข้อมูลจำเป็นต้องมีเจ้าหน้าที่อย่างน้อย 3 คน');
      return;
    }
    markStaffEdited();
    setStaffList(prev => prev.filter(s => s.id !== id));
    setSchedule(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  return (
    <div className="app-container">
      {/* Top Header Navigation */}
      <Header
        year={year}
        setYear={setYear}
        month={month}
        setMonth={setMonth}
        theme={theme}
        setTheme={setTheme}
        onOpenAutoSchedule={() => setIsAutoScheduleOpen(true)}
        onOpenSwap={() => setIsSwapOpen(true)}
        onOpenAnalytics={() => setIsAnalyticsOpen(true)}
        onOpenStaff={() => setIsStaffOpen(true)}
        onExportExcel={handleExportExcel}
        onPrint={() => window.print()}
        sheetSync={{ ...sheetStatus, locked: isMonthLocked }}
        onSheetSync={() => syncFromSheet({ force: true })}
      />

      {/* Real-time Status / KPI Bar */}
      <TopMetricsBar
        staffList={staffList}
        dailyCoverage={dailyCoverage}
        violationsMap={violationsMap}
        totalShiftsCount={totalShiftsCount}
        daysCount={daysCount}
      />

      {/* Main Workspace */}
      <main className="main-content">
        {/* Shift Legend & Brush Tool */}
        <ShiftLegend
          activeBrush={activeBrush}
          setActiveBrush={setActiveBrush}
        />

        {/* Interactive Shift Roster Grid */}
        <ShiftTable
          year={year}
          month={month}
          daysCount={daysCount}
          staffList={staffList}
          schedule={schedule}
          dailyCoverage={dailyCoverage}
          violationsMap={violationsMap}
          activeBrush={activeBrush}
          onCellChange={handleCellChange}
          onOpenShiftPicker={(staffId, dayIndex) => setPickerTarget({ staffId, dayIndex })}
          onOpenStaffModal={() => setIsStaffOpen(true)}
        />
      </main>

      {/* Modals */}
      <ShiftPickerModal
        isOpen={!!pickerTarget}
        onClose={() => setPickerTarget(null)}
        target={pickerTarget}
        staffList={staffList}
        schedule={schedule}
        year={year}
        month={month}
        daysCount={daysCount}
        onSelectShift={handleCellChange}
        onBatchApply={handleBatchApply}
      />

      <ShiftSwapModal
        isOpen={isSwapOpen}
        onClose={() => setIsSwapOpen(false)}
        staffList={staffList}
        schedule={schedule}
        daysCount={daysCount}
        month={month}
        year={year}
        onConfirmSwap={handleConfirmSwap}
      />

      <AnalyticsModal
        isOpen={isAnalyticsOpen}
        onClose={() => setIsAnalyticsOpen(false)}
        staffList={staffList}
        schedule={schedule}
        daysCount={daysCount}
        year={year}
        month={month}
        settings={settings}
      />

      <AutoScheduleModal
        isOpen={isAutoScheduleOpen}
        onClose={() => setIsAutoScheduleOpen(false)}
        onGenerateSchedule={handleAutoSchedule}
        defaultMinStaff={settings.minStaffPerShift}
      />

      <StaffModal
        isOpen={isStaffOpen}
        onClose={() => setIsStaffOpen(false)}
        staffList={staffList}
        onAddStaff={handleAddStaff}
        onUpdateStaff={handleUpdateStaff}
        onDeleteStaff={handleDeleteStaff}
        sheetSync={{ ...staffSheetStatus, locked: staffEdited }}
        onSheetSync={() => syncStaffFromSheet({ force: true })}
      />
    </div>
  );
}
