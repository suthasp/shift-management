'use client';
import React, { useState, useEffect, useRef } from 'react';
import { 
  THAI_MONTHS, 
  THAI_DAYS_SHORT, 
  SHIFT_TYPES 
} from '../data/initialData';
import { getDayOfWeek, isWeekend } from '../utils/schedulerEngine';
import { AlertCircle, Plus, Trash2, ArrowLeft } from 'lucide-react';

export function ShiftTable({
  year,
  month,
  daysCount,
  staffList,
  schedule,
  dailyCoverage,
  violationsMap,
  activeBrush,
  onCellChange,
  onOpenShiftPicker,
  onOpenStaffModal
}) {
  const [selectedCell, setSelectedCell] = useState(null); // { staffId, dayIndex }
  const [isScrolled, setIsScrolled] = useState(false);
  const wrapperRef = useRef(null);
  const monthNameEng = new Date(year, month - 1, 1).toLocaleString('en-US', { month: 'long' });

  // Force scroll to Day 1 on mount AND whenever month/year changes
  // Uses triple-layer reset: immediate, rAF, and timeout to defeat browser scroll restoration
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    // Layer 1: Immediate
    el.scrollLeft = 0;
    setIsScrolled(false);

    // Layer 2: requestAnimationFrame (after browser paint)
    const rafId = requestAnimationFrame(() => {
      if (wrapperRef.current) {
        wrapperRef.current.scrollLeft = 0;
      }
    });

    // Layer 3: setTimeout (after browser scroll restoration)
    const timerId = setTimeout(() => {
      if (wrapperRef.current) {
        wrapperRef.current.scrollLeft = 0;
      }
    }, 150);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timerId);
    };
  }, [year, month]);

  const scrollToDay1 = () => {
    if (wrapperRef.current) {
      wrapperRef.current.scrollTo({ left: 0, behavior: 'smooth' });
      setIsScrolled(false);
    }
  };

  const handleScroll = (e) => {
    setIsScrolled(e.target.scrollLeft > 15);
  };

  // Keyboard navigation & quick edit handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!selectedCell) return;
      const { staffId, dayIndex } = selectedCell;
      const staffIdx = staffList.findIndex(s => s.id === staffId);
      if (staffIdx === -1) return;

      const key = e.key.toUpperCase();

      // Quick shift change
      if (['1', '2', '3', 'A', 'H', 'L', 'V'].includes(key)) {
        e.preventDefault();
        onCellChange(staffId, dayIndex, key);
        // Move to next day automatically for fast data entry
        if (dayIndex < daysCount - 1) {
          setSelectedCell({ staffId, dayIndex: dayIndex + 1 });
        }
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        onCellChange(staffId, dayIndex, 'H'); // Default to Day Off
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (dayIndex < daysCount - 1) {
          setSelectedCell({ staffId, dayIndex: dayIndex + 1 });
        }
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (dayIndex > 0) {
          setSelectedCell({ staffId, dayIndex: dayIndex - 1 });
        }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (staffIdx < staffList.length - 1) {
          setSelectedCell({ staffId: staffList[staffIdx + 1].id, dayIndex });
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (staffIdx > 0) {
          setSelectedCell({ staffId: staffList[staffIdx - 1].id, dayIndex });
        }
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onOpenShiftPicker(staffId, dayIndex);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCell, staffList, daysCount, onCellChange, onOpenShiftPicker]);

  const handleCellClick = (staffId, dayIndex, currentShift) => {
    setSelectedCell({ staffId, dayIndex });

    if (activeBrush) {
      onCellChange(staffId, dayIndex, activeBrush);
    } else {
      onOpenShiftPicker(staffId, dayIndex);
    }
  };

  // Helper for Day of Week header styling (matching the image)
  const getDowBadgeClass = (dow) => {
    if (dow === 6) return 'dow-sat'; // Saturday = Purple
    if (dow === 0) return 'dow-sun'; // Sunday = Red
    return '';
  };

  return (
    <div className="roster-card" style={{ position: 'relative' }}>
      {/* Floating Button to jump back to Day 1 when scrolled */}
      {isScrolled && (
        <button 
          className="btn-jump-day1" 
          onClick={scrollToDay1}
          title="เลื่อนตารางกลับไปแสดงตั้งแต่วันที่ 1"
        >
          <ArrowLeft size={14} />
          <span>กลับไปวันที่ 1</span>
        </button>
      )}

      <div 
        key={`roster-wrapper-${year}-${month}`}
        ref={wrapperRef}
        onScroll={handleScroll}
        className="roster-table-wrapper"
      >
        <table className="roster-table">
          <thead>
            {/* Row 1: 8Hrs./Shift & Month Name Banner */}
            <tr>
              <th className="th-header-info col-sticky-num" style={{ zIndex: 30 }}>
                #
              </th>
              <th className="th-header-info col-sticky-name" style={{ zIndex: 30, color: 'var(--accent-cyan)' }}>
                8Hrs./Shift
              </th>
              <th 
                className="th-month-banner" 
                colSpan={daysCount}
              >
                {monthNameEng} ({THAI_MONTHS[month - 1]} {year + 543})
              </th>
              {/* Summary Header Spans */}
              <th className="col-summary-header" colSpan={5}>
                สรุปรวมรายบุคคล
              </th>
            </tr>

            {/* Row 2: Day of Week in Thai */}
            <tr>
              <th className="th-header-info col-sticky-num"></th>
              <th className="th-header-info col-sticky-name">วันในสัปดาห์</th>
              {Array.from({ length: daysCount }, (_, i) => {
                const dayNum = i + 1;
                const dow = getDayOfWeek(year, month, dayNum);
                const badgeClass = getDowBadgeClass(dow);
                return (
                  <th 
                    key={`dow-${dayNum}`} 
                    className={`dow-header-cell ${badgeClass}`}
                    title={`${THAI_DAYS_SHORT[dow]} ที่ ${dayNum}`}
                  >
                    {THAI_DAYS_SHORT[dow]}
                  </th>
                );
              })}
              {/* Summary columns */}
              <th className="col-summary-header" title="กะเช้า (07:00-16:00)">1 (เช้า)</th>
              <th className="col-summary-header" title="กะบ่าย (15:00-24:00)">2 (บ่าย)</th>
              <th className="col-summary-header" title="กะดึก (23:00-08:00)">3 (ดึก)</th>
              <th className="col-summary-header" title="วันหยุด">H (หยุด)</th>
              <th className="col-summary-header" title="ชั่วโมงทำงานทั้งหมด">รวม (ชม.)</th>
            </tr>

            {/* Row 3: Day Numbers (1, 2, ..., 31) */}
            <tr>
              <th className="day-num-cell col-sticky-num">#</th>
              <th className="day-num-cell col-sticky-name" style={{ textAlign: 'left', paddingLeft: '0.85rem' }}>
                รายชื่อเจ้าหน้าที่ DC
              </th>
              {Array.from({ length: daysCount }, (_, i) => {
                const dayNum = i + 1;
                const isWknd = isWeekend(year, month, dayNum);
                return (
                  <th 
                    key={`day-${dayNum}`} 
                    className={`day-num-cell ${isWknd ? 'day-num-weekend' : ''}`}
                  >
                    {dayNum}
                  </th>
                );
              })}
              {/* Summary headers */}
              <th className="col-summary-header">เช้า</th>
              <th className="col-summary-header">บ่าย</th>
              <th className="col-summary-header">ดึก</th>
              <th className="col-summary-header">วัน</th>
              <th className="col-summary-header">ชม.</th>
            </tr>
          </thead>

          <tbody>
            {/* Employee Rows */}
            {staffList.map((staff, sIdx) => {
              const staffShifts = schedule[staff.id] || [];
              const staffViolations = violationsMap[staff.id] || {};

              // Calculate personal stats
              let count1 = 0, count2 = 0, count3 = 0, countH = 0;
              for (let d = 0; d < daysCount; d++) {
                const c = staffShifts[d] || 'H';
                if (c === '1') count1++;
                else if (c === '2') count2++;
                else if (c === '3') count3++;
                else if (c === 'H') countH++;
              }
              const totalHours = (count1 + count2 + count3) * 8;

              return (
                <tr key={staff.id} className="tr-staff-row">
                  {/* Sticky Col 1: Number */}
                  <td className="col-sticky-num">{sIdx + 1}</td>

                  {/* Sticky Col 2: Staff Name */}
                  <td 
                    className="col-sticky-name" 
                    title={`${staff.name} (${staff.position})`}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 600 }}>{staff.name}</span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {staff.position}
                      </span>
                    </div>
                  </td>

                  {/* Shift Cells for Days 1..N */}
                  {Array.from({ length: daysCount }, (_, d) => {
                    const shiftCode = staffShifts[d] || 'H';
                    const isSelected = selectedCell?.staffId === staff.id && selectedCell?.dayIndex === d;
                    const violations = staffViolations[d];
                    const hasViolation = violations && violations.length > 0;
                    const shiftInfo = SHIFT_TYPES[shiftCode] || SHIFT_TYPES['H'];

                    return (
                      <td
                        key={`cell-${staff.id}-${d}`}
                        className={`shift-cell cell-shift-${shiftCode.toLowerCase()} ${isSelected ? 'selected' : ''}`}
                        onClick={() => handleCellClick(staff.id, d, shiftCode)}
                        title={`วันที่ ${d + 1}: ${staff.name} - ${shiftInfo.name} (${shiftInfo.timeRange})${
                          hasViolation ? `\n⚠️ เตือน: ${violations.map(v => v.message).join(', ')}` : ''
                        }`}
                      >
                        <div className="shift-cell-inner">
                          <span>{shiftCode}</span>
                          {hasViolation && <span className="violation-flag" />}
                        </div>
                      </td>
                    );
                  })}

                  {/* Personal Summary Counts */}
                  <td className="col-summary-cell">{count1}</td>
                  <td className="col-summary-cell">{count2}</td>
                  <td className="col-summary-cell">{count3}</td>
                  <td className="col-summary-cell" style={{ color: '#eab308' }}>{countH}</td>
                  <td className="col-summary-cell" style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>
                    {totalHours}
                  </td>
                </tr>
              );
            })}
          </tbody>

          {/* Bottom Coverage Summary */}
          <tfoot>
            {/* Row for Shift A */}
            <tr className="tr-coverage-row">
              <td className="col-sticky-num"></td>
              <td className="col-sticky-name coverage-label-cell">
                <span className="shift-tag tag-a" style={{ width: 20, height: 20, fontSize: '0.75rem', marginRight: 6 }}>A</span>
                <span>กะปกติ (08:00 - 17:00)</span>
              </td>
              {dailyCoverage.map((dayCov, d) => {
                const count = dayCov.counts['A'];
                const dow = getDayOfWeek(year, month, d + 1);
                const isWknd = dow === 0 || dow === 6;
                const isTargetMet = isWknd ? count === 0 : count >= 2;
                return (
                  <td 
                    key={`cov-a-${d}`} 
                    className={`coverage-cell ${!isWknd && count < 2 ? 'coverage-warning' : 'coverage-ok'}`}
                    style={{ color: '#ffb74d' }}
                    title={`วันที่ ${d + 1}: กะ A มี ${count} คน (ธีระกิจ & วรพงษ์)`}
                  >
                    {count}
                  </td>
                );
              })}
              <td colSpan={5} className="col-summary-cell" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                ธีระกิจ & วรพงษ์ (จ.-ศ.)
              </td>
            </tr>

            {/* Row for Shift 1 */}
            <tr className="tr-coverage-row">
              <td className="col-sticky-num"></td>
              <td className="col-sticky-name coverage-label-cell">
                <span className="shift-tag tag-1" style={{ width: 20, height: 20, fontSize: '0.75rem', marginRight: 6 }}>1</span>
                <span>กะเช้า (07:00 - 16:00)</span>
              </td>
              {dailyCoverage.map((dayCov, d) => {
                const count = dayCov.counts['1'];
                const isZero = count === 0;
                return (
                  <td 
                    key={`cov-1-${d}`} 
                    className={`coverage-cell ${isZero ? 'coverage-danger' : 'coverage-ok'}`}
                    title={`วันที่ ${d + 1}: กะเช้ามี ${count} คน (เป้าหมาย 1 คน)`}
                  >
                    {count}
                  </td>
                );
              })}
              <td colSpan={5} className="col-summary-cell" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                เป้าหมาย 7x24: 1 คน
              </td>
            </tr>

            {/* Row for Shift 2 */}
            <tr className="tr-coverage-row">
              <td className="col-sticky-num"></td>
              <td className="col-sticky-name coverage-label-cell">
                <span className="shift-tag tag-2" style={{ width: 20, height: 20, fontSize: '0.75rem', marginRight: 6 }}>2</span>
                <span>กะบ่าย (15:00 - 24:00)</span>
              </td>
              {dailyCoverage.map((dayCov, d) => {
                const count = dayCov.counts['2'];
                const isZero = count === 0;
                const isLow = count < 2;
                return (
                  <td 
                    key={`cov-2-${d}`} 
                    className={`coverage-cell ${isZero ? 'coverage-danger' : isLow ? 'coverage-warning' : 'coverage-ok'}`}
                    title={`วันที่ ${d + 1}: กะบ่ายมี ${count} คน (เป้าหมาย 2 คน)`}
                  >
                    {count}
                  </td>
                );
              })}
              <td colSpan={5} className="col-summary-cell" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                เป้าหมาย 7x24: 2 คน
              </td>
            </tr>

            {/* Row for Shift 3 */}
            <tr className="tr-coverage-row">
              <td className="col-sticky-num"></td>
              <td className="col-sticky-name coverage-label-cell">
                <span className="shift-tag tag-3" style={{ width: 20, height: 20, fontSize: '0.75rem', marginRight: 6 }}>3</span>
                <span>กะดึก (23:00 - 08:00)</span>
              </td>
              {dailyCoverage.map((dayCov, d) => {
                const count = dayCov.counts['3'];
                const isZero = count === 0;
                const isLow = count < 2;
                return (
                  <td 
                    key={`cov-3-${d}`} 
                    className={`coverage-cell ${isZero ? 'coverage-danger' : isLow ? 'coverage-warning' : 'coverage-ok'}`}
                    title={`วันที่ ${d + 1}: กะดึกมี ${count} คน (เป้าหมาย 2 คน)`}
                  >
                    {count}
                  </td>
                );
              })}
              <td colSpan={5} className="col-summary-cell" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                เป้าหมาย 7x24: 2 คน
              </td>
            </tr>

            {/* Row for Day Off H */}
            <tr className="tr-coverage-row">
              <td className="col-sticky-num"></td>
              <td className="col-sticky-name coverage-label-cell">
                <span className="shift-tag tag-h" style={{ width: 20, height: 20, fontSize: '0.75rem', marginRight: 6 }}>H</span>
                <span>วันหยุด (Day Off)</span>
              </td>
              {dailyCoverage.map((dayCov, d) => {
                const count = dayCov.counts['H'];
                return (
                  <td 
                    key={`cov-h-${d}`} 
                    className="coverage-cell"
                    style={{ color: '#eab308' }}
                  >
                    {count}
                  </td>
                );
              })}
              <td colSpan={5} className="col-summary-cell"></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
