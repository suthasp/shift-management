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
  const [hoveredShiftInfo, setHoveredShiftInfo] = useState(null);
  const wrapperRef = useRef(null);
  const monthNameEng = new Date(year, month - 1, 1).toLocaleString('en-US', { month: 'long' });

  const handleHoverShift = (code, e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setHoveredShiftInfo({ code, rect });
  };

  const handleLeaveShift = () => {
    setHoveredShiftInfo(null);
  };

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

      {/* Floating Shift Info Tooltip on Hover */}
      {hoveredShiftInfo && SHIFT_TYPES[hoveredShiftInfo.code] && (
        <div
          className="shift-info-tooltip"
          style={{
            position: 'fixed',
            left: Math.max(10, Math.min(typeof window !== 'undefined' ? window.innerWidth - 300 : 200, (hoveredShiftInfo.rect?.right || 200) + 12)),
            top: Math.max(10, Math.min(typeof window !== 'undefined' ? window.innerHeight - 200 : 200, (hoveredShiftInfo.rect?.top || 100) - 20)),
            zIndex: 99999
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span className={`shift-tag tag-${hoveredShiftInfo.code.toLowerCase()}`} style={{ width: 22, height: 22, fontSize: '0.8rem' }}>
              {hoveredShiftInfo.code}
            </span>
            <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>
              {SHIFT_TYPES[hoveredShiftInfo.code].name}
            </strong>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)', fontWeight: 600, marginBottom: 4 }}>
            ⏰ เวลา: {SHIFT_TYPES[hoveredShiftInfo.code].timeRange} น. ({SHIFT_TYPES[hoveredShiftInfo.code].durationHours} ชม.)
          </div>
          {hoveredShiftInfo.code === 'A' && (
            <div style={{ fontSize: '0.78rem', color: 'var(--shift-a-bg)', marginBottom: 4 }}>
              👤 เจ้าหน้าที่: ธีระกิจ พรมตุ้ม (จันทร์ - ศุกร์)
            </div>
          )}
          {hoveredShiftInfo.code === '1' && (
            <div style={{ fontSize: '0.78rem', color: 'var(--accent-amber)', marginBottom: 4 }}>
              👤 วรพงษ์ ริมสกุล ยืนประจำ (จันทร์ - ศุกร์) + หมุนเวียนอีกอย่างน้อย 1 คน
            </div>
          )}
          {['1', '2', '3'].includes(hoveredShiftInfo.code) && (
            <div style={{ fontSize: '0.78rem', color: 'var(--accent-emerald)', marginBottom: 4 }}>
              🎯 เป้าหมาย 7x24: {hoveredShiftInfo.code === '1' ? 'อย่างน้อย 1 คน' : 'อย่างน้อย 2 คน'} ต่อกะ
            </div>
          )}
          {['HT1', 'HT2', 'HT3'].includes(hoveredShiftInfo.code) && (
            <div style={{ fontSize: '0.78rem', color: '#00e676', marginBottom: 4 }}>
              💰 งานล่วงเวลา (OT): มาทำแทนในวันหยุด (เบิก 1.5 / 1 / 3 แรง)
            </div>
          )}
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4, borderTop: '1px solid var(--border-color)', paddingTop: 6, marginTop: 4 }}>
            {SHIFT_TYPES[hoveredShiftInfo.code].description}
          </div>
        </div>
      )}

      <div 
        key={`roster-wrapper-${year}-${month}`}
        ref={wrapperRef}
        onScroll={handleScroll}
        className="roster-table-wrapper"
      >
        <table 
          className="roster-table" 
          style={{ 
            tableLayout: 'fixed', 
            width: 44 + 150 + (daysCount * 38) + 320, 
            minWidth: 44 + 150 + (daysCount * 38) + 320 
          }}
        >
          {/* Explicit column widths to prevent sticky columns from overlapping day 1 */}
          <colgroup>
            <col style={{ width: 44 }} /> {/* # */}
            <col style={{ width: 150 }} /> {/* ชื่อเจ้าหน้าที่ */}
            {Array.from({ length: daysCount }, (_, i) => (
              <col key={`col-day-${i}`} style={{ width: 38 }} />
            ))}
            <col style={{ width: 52 }} /> {/* สรุป 1 */}
            <col style={{ width: 52 }} /> {/* สรุป 2 */}
            <col style={{ width: 52 }} /> {/* สรุป 3 */}
            <col style={{ width: 52 }} /> {/* สรุป OT */}
            <col style={{ width: 52 }} /> {/* สรุป H */}
            <col style={{ width: 60 }} /> {/* สรุป ชม. */}
          </colgroup>
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
              <th className="col-summary-header" colSpan={6}>
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
              <th className="col-summary-header" title="งานล่วงเวลาในวันหยุด (HT1, HT2, HT3)">OT (กะ)</th>
              <th className="col-summary-header" title="วันหยุด">H (หยุด)</th>
              <th className="col-summary-header" title="ชั่วโมงทำงานทั้งหมด">รวม (ชม.)</th>
            </tr>

            {/* Row 3: Day Numbers (1, 2, ..., 31) */}
            <tr>
              <th className="day-num-cell col-sticky-num">#</th>
              <th className="day-num-cell col-sticky-name">
                รายชื่อเจ้าหน้าที่ CNO
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
              <th className="col-summary-header">OT</th>
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
              let count1 = 0, count2 = 0, count3 = 0, countH = 0, countOT = 0, countA = 0;
              for (let d = 0; d < daysCount; d++) {
                const c = staffShifts[d] || 'H';
                if (c === '1') count1++;
                else if (c === '2') count2++;
                else if (c === '3') count3++;
                else if (['HT1', 'HT2', 'HT3'].includes(c)) countOT++;
                else if (c === 'A') countA++;
                else if (c === 'H') countH++;
              }
              const totalHours = (count1 + count2 + count3 + countA + countOT) * 8;

              return (
                <tr key={staff.id} className="tr-staff-row">
                  {/* Sticky Col 1: Number */}
                  <td className="col-sticky-num">{sIdx + 1}</td>

                  {/* Sticky Col 2: Staff Name */}
                  <td 
                    className="col-sticky-name" 
                    title={`${staff.name} (${staff.position})`}
                  >
                    {staff.name}
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
                  <td className="col-summary-cell" style={{ color: countOT > 0 ? '#00e676' : 'var(--text-muted)', fontWeight: countOT > 0 ? 700 : 400 }}>
                    {countOT}
                  </td>
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
              <td 
                className="col-sticky-name coverage-label-cell"
                title={`กะปกติ (Shift A)\n⏰ เวลา: 08:00 - 17:00 น. (8 ชม.)\n👤 เจ้าหน้าที่: ธีระกิจ พรมตุ้ม (จันทร์ - ศุกร์)\n📝 หน้าที่: ${SHIFT_TYPES['A']?.description || ''}`}
                onMouseEnter={(e) => handleHoverShift('A', e)}
                onMouseLeave={handleLeaveShift}
              >
                <span className="shift-tag tag-a" style={{ width: 20, height: 20, fontSize: '0.75rem', marginRight: 6 }}>A</span>
                <span>กะปกติ (08:00 - 17:00)</span>
              </td>
              {dailyCoverage.map((dayCov, d) => {
                const count = dayCov.counts['A'];
                const dow = getDayOfWeek(year, month, d + 1);
                const isWknd = dow === 0 || dow === 6;
                const isTargetMet = isWknd ? count === 0 : count >= 1;
                return (
                  <td
                    key={`cov-a-${d}`}
                    className={`coverage-cell ${!isWknd && count < 1 ? 'coverage-warning' : 'coverage-ok'}`}
                    style={{ color: 'var(--shift-a-bg)' }}
                    title={`วันที่ ${d + 1}: กะ A มี ${count} คน (ธีระกิจ)`}
                  >
                    {count}
                  </td>
                );
              })}
              <td colSpan={6} className="col-summary-cell" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                ธีระกิจ (จ.-ศ.)
              </td>
            </tr>

            {/* Row for Shift 1 */}
            <tr className="tr-coverage-row">
              <td className="col-sticky-num"></td>
              <td 
                className="col-sticky-name coverage-label-cell"
                title={`กะเช้า (Shift 1)\n⏰ เวลา: 07:00 - 16:00 น. (8 ชม. / มี Overlap ส่งมอบกะ 1 ชม.)\n🎯 เป้าหมาย 7x24: อย่างน้อย 1 คนต่อกะ\n📝 หน้าที่: ${SHIFT_TYPES['1']?.description || ''}`}
                onMouseEnter={(e) => handleHoverShift('1', e)}
                onMouseLeave={handleLeaveShift}
              >
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
              <td colSpan={6} className="col-summary-cell" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                เป้าหมาย 7x24: 1 คน
              </td>
            </tr>

            {/* Row for Shift 2 */}
            <tr className="tr-coverage-row">
              <td className="col-sticky-num"></td>
              <td 
                className="col-sticky-name coverage-label-cell"
                title={`กะบ่าย (Shift 2)\n⏰ เวลา: 15:00 - 24:00 น. (8 ชม. / มี Overlap ส่งมอบกะ 1 ชม.)\n🎯 เป้าหมาย 7x24: อย่างน้อย 2 คนต่อกะ\n📝 หน้าที่: ${SHIFT_TYPES['2']?.description || ''}`}
                onMouseEnter={(e) => handleHoverShift('2', e)}
                onMouseLeave={handleLeaveShift}
              >
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
              <td colSpan={6} className="col-summary-cell" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                เป้าหมาย 7x24: 2 คน
              </td>
            </tr>

            {/* Row for Shift 3 */}
            <tr className="tr-coverage-row">
              <td className="col-sticky-num"></td>
              <td 
                className="col-sticky-name coverage-label-cell"
                title={`กะดึก (Shift 3)\n⏰ เวลา: 23:00 - 08:00 น. (8 ชม. / มี Overlap ส่งมอบกะ 1 ชม.)\n🎯 เป้าหมาย 7x24: อย่างน้อย 2 คนต่อกะ (มีเบี้ยเลี้ยงกะดึก)\n📝 หน้าที่: ${SHIFT_TYPES['3']?.description || ''}`}
                onMouseEnter={(e) => handleHoverShift('3', e)}
                onMouseLeave={handleLeaveShift}
              >
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
              <td colSpan={6} className="col-summary-cell" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                เป้าหมาย 7x24: 2 คน
              </td>
            </tr>

            {/* Row for Overtime OT (HT1, HT2, HT3) */}
            <tr className="tr-coverage-row">
              <td className="col-sticky-num"></td>
              <td 
                className="col-sticky-name coverage-label-cell"
                title={`งานล่วงเวลาในวันหยุด (HT1, HT2, HT3)\n⏰ เวลา: 8 ชม. ตามกะที่มาทำแทน\n💰 ค่าตอบแทน: 1.5 แรง / 1 แรง / 3 แรง ตามเงื่อนไข`}
                onMouseEnter={(e) => handleHoverShift('HT1', e)}
                onMouseLeave={handleLeaveShift}
              >
                <span className="shift-tag tag-ht1" style={{ width: 20, height: 20, fontSize: '0.7rem', marginRight: 6, background: 'var(--shift-ht-bg)', color: '#fff' }}>OT</span>
                <span>OT วันหยุด (HT1,2,3)</span>
              </td>
              {dailyCoverage.map((dayCov, d) => {
                const count = (dayCov.counts['HT1'] || 0) + (dayCov.counts['HT2'] || 0) + (dayCov.counts['HT3'] || 0);
                return (
                  <td 
                    key={`cov-ot-${d}`} 
                    className="coverage-cell"
                    style={{ color: count > 0 ? '#00e676' : 'var(--text-muted)' }}
                    title={`วันที่ ${d + 1}: มีผู้ทำ OT ทั้งหมด ${count} คน`}
                  >
                    {count}
                  </td>
                );
              })}
              <td colSpan={6} className="col-summary-cell" style={{ fontSize: '0.75rem', color: '#00e676' }}>
                เบิก OT (1.5 / 1 / 3 แรง)
              </td>
            </tr>

            {/* Row for Day Off H */}
            <tr className="tr-coverage-row">
              <td className="col-sticky-num"></td>
              <td 
                className="col-sticky-name coverage-label-cell"
                title={`วันหยุด (Shift H)\n⏰ เวลา: พักผ่อน (Day Off)\n📝 รายละเอียด: ${SHIFT_TYPES['H']?.description || 'วันหยุดประจำสัปดาห์ / วันหยุดชดเชย'}`}
                onMouseEnter={(e) => handleHoverShift('H', e)}
                onMouseLeave={handleLeaveShift}
              >
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
              <td colSpan={6} className="col-summary-cell"></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
