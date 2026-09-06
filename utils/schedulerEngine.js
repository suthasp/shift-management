import { SHIFT_TYPES, DC_SETTINGS_DEFAULT } from '../data/initialData.js';

/**
 * Get days in a given month and year
 */
export function getDaysInMonth(year, month) {
  // month is 1-12
  return new Date(year, month, 0).getDate();
}

/**
 * Get day of week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
 */
export function getDayOfWeek(year, month, day) {
  return new Date(year, month - 1, day).getDay();
}

/**
 * Check if a date is weekend (Saturday = 6 or Sunday = 0)
 */
export function isWeekend(year, month, day) {
  const dow = getDayOfWeek(year, month, day);
  return dow === 0 || dow === 6;
}

/**
 * Calculate coverage for each day in the month
 */
/**
 * Calculate coverage for each day in the month
 */
export function calculateDailyCoverage(schedule, staffList, daysCount, settings = DC_SETTINGS_DEFAULT) {
  const coverage = [];
  const minStaff = settings.minStaffPerShift || { '1': 1, '2': 2, '3': 2 };

  for (let d = 0; d < daysCount; d++) {
    const counts = {
      '1': 0,
      '2': 0,
      '3': 0,
      'A': 0,
      'H': 0,
      'L': 0,
      'V': 0,
      'HT1': 0,
      'HT2': 0,
      'HT3': 0,
      'OT': 0,
      other: 0,
      totalWorking: 0
    };

    staffList.forEach(staff => {
      const staffShifts = schedule[staff.id] || [];
      const code = staffShifts[d] || 'H';
      if (counts[code] !== undefined) {
        counts[code]++;
      } else {
        counts.other++;
      }

      // HT1, HT2, HT3 count toward their respective shift coverage & OT total
      if (code === 'HT1') {
        counts['1']++;
        counts['OT']++;
        counts.totalWorking++;
      } else if (code === 'HT2') {
        counts['2']++;
        counts['OT']++;
        counts.totalWorking++;
      } else if (code === 'HT3') {
        counts['3']++;
        counts['OT']++;
        counts.totalWorking++;
      } else if (code === '1' || code === '2' || code === '3' || code === 'A') {
        counts.totalWorking++;
      }
    });

    // Check deficits against minimum requirements
    const alerts = [];
    ['1', '2', '3'].forEach(shiftCode => {
      const required = minStaff[shiftCode] || 1;
      const actual = counts[shiftCode];
      if (actual === 0) {
        alerts.push({
          level: 'danger',
          shiftCode,
          message: `กะ ${shiftCode} ไม่มีคนปฏิบัติงาน (0/${required})!`
        });
      } else if (actual < required) {
        alerts.push({
          level: 'warning',
          shiftCode,
          message: `กะ ${shiftCode} มีเจ้าหน้าที่น้อยกว่าเกณฑ์ (${actual}/${required})`
        });
      }
    });

    coverage.push({
      dayIndex: d,
      dayNumber: d + 1,
      counts,
      alerts,
      isFullyStaffed: alerts.length === 0
    });
  }

  return coverage;
}

/**
 * Calculate working metrics, hours, OT and allowances per staff
 */
export function calculateStaffSummary(schedule, staffList, daysCount, year, month, settings = DC_SETTINGS_DEFAULT) {
  const rates = settings.allowanceRates || { nightShiftRate: 300, weekendBonusRate: 150 };

  return staffList.map(staff => {
    const shifts = schedule[staff.id] || [];
    const counts = { 
      '1': 0, '2': 0, '3': 0, 'A': 0, 'H': 0, 'L': 0, 'V': 0,
      'HT1': 0, 'HT2': 0, 'HT3': 0 
    };
    let totalWorkDays = 0;
    let weekendShifts = 0;
    let totalOTShifts = 0;

    for (let d = 0; d < daysCount; d++) {
      const code = shifts[d] || 'H';
      if (counts[code] !== undefined) {
        counts[code]++;
      }
      if (code === 'HT1' || code === 'HT2' || code === 'HT3') {
        totalOTShifts++;
        totalWorkDays++;
        if (isWeekend(year, month, d + 1)) {
          weekendShifts++;
        }
      } else if (code === '1' || code === '2' || code === '3' || code === 'A') {
        totalWorkDays++;
        if (isWeekend(year, month, d + 1)) {
          weekendShifts++;
        }
      }
    }

    const totalHours = totalWorkDays * 8;
    const totalOTHours = totalOTShifts * 8;
    // Night shift count includes normal 3 and OT HT3
    const nightShiftCount = counts['3'] + counts['HT3'];
    const nightShiftAllowance = nightShiftCount * rates.nightShiftRate;
    const weekendAllowance = weekendShifts * rates.weekendBonusRate;
    // Estimated OT Allowance (default 1 แรง = 500 บาท/กะ)
    const baseDailyWage = 500;
    const estimatedOTAllowance = totalOTShifts * baseDailyWage;
    const totalEstimatedAllowance = nightShiftAllowance + weekendAllowance + estimatedOTAllowance;

    return {
      staffId: staff.id,
      empCode: staff.empCode,
      name: staff.name,
      position: staff.position,
      counts,
      totalWorkDays,
      totalOffDays: counts['H'] + counts['L'] + counts['V'],
      totalOTShifts,
      totalOTHours,
      totalHours,
      weekendShifts,
      nightShiftCount,
      nightShiftAllowance,
      weekendAllowance,
      estimatedOTAllowance,
      totalEstimatedAllowance
    };
  });
}

/**
 * Check Labor & Safety Compliance:
 * 1. Night shift (3, HT3) directly followed by morning shift (1, HT1)
 * 2. Consecutive working days > 6
 * 3. Consecutive night shifts > 3
 */
export function checkComplianceViolations(schedule, staffList, daysCount) {
  const violationsMap = {};

  staffList.forEach(staff => {
    const shifts = schedule[staff.id] || [];
    const staffViolations = {};

    let consecutiveWorkDays = 0;
    let consecutiveNights = 0;

    for (let d = 0; d < daysCount; d++) {
      const current = shifts[d] || 'H';
      const isWork = ['1', '2', '3', 'A', 'HT1', 'HT2', 'HT3'].includes(current);
      const isNight = current === '3' || current === 'HT3';

      // 1. Check Night -> Morning transition
      if (d < daysCount - 1) {
        const next = shifts[d + 1] || 'H';
        const nextIsMorning = next === '1' || next === 'HT1';
        if (isNight && nextIsMorning) {
          staffViolations[d] = staffViolations[d] || [];
          staffViolations[d].push({
            type: 'quick_turnaround',
            level: 'danger',
            message: 'เข้ากะดึก เลิก 08:00 ต่อด้วยกะเช้าทันที พักผ่อนไม่ถึง 12 ชม.'
          });
        }
      }

      // 2. Track consecutive working days
      if (isWork) {
        consecutiveWorkDays++;
        if (consecutiveWorkDays > 6) {
          staffViolations[d] = staffViolations[d] || [];
          staffViolations[d].push({
            type: 'consecutive_work',
            level: 'warning',
            message: `ทำงานต่อเนื่อง ${consecutiveWorkDays} วันติดต่อกัน (เกินเกณฑ์ 6 วัน)`
          });
        }
      } else {
        consecutiveWorkDays = 0;
      }

      // 3. Track consecutive night shifts
      if (isNight) {
        consecutiveNights++;
        if (consecutiveNights > 3) {
          staffViolations[d] = staffViolations[d] || [];
          staffViolations[d].push({
            type: 'consecutive_nights',
            level: 'warning',
            message: `เข้ากะดึกต่อเนื่อง ${consecutiveNights} วันติดต่อกัน อาจเกิดความล้าสะสม`
          });
        }
      } else {
        consecutiveNights = 0;
      }
    }

    violationsMap[staff.id] = staffViolations;
  });

  return violationsMap;
}

/**
 * Smart Auto-Scheduler Algorithm for Data Center 24/7 Operations
 * Generates an optimal, balanced roster:
 * 1. ธีระกิจ ยืนประจำกะ A (จันทร์-ศุกร์), เสาร์-อาทิตย์ หยุด (H)
 * 2. วรพงษ์ ยืนประจำกะ 1 (จันทร์-ศุกร์), เสาร์-อาทิตย์ หยุด (H)
 *    และต้องมีเจ้าหน้าที่หมุนเวียนลงกะ 1 ร่วมด้วยอย่างน้อยอีก 1 คนในทุกวัน
 * 3. Equal off days (H) across all rotating staff in every month (8 days off)
 * 4. 7x24 Operations: Shift 3 = 2, Shift 2 = 2, Shift 1 = 1 (minimum)
 * 5. "ถ้ามีคนเหลือเกินให้ลงกะ1" -> All surplus staff assigned to Shift 1!
 */
/**
 * เจ้าหน้าที่ยืนประจำกะ (จันทร์-ศุกร์) — เสาร์-อาทิตย์ หยุด
 * ธีระกิจ = กะ A (08:00-17:00), วรพงษ์ = กะ 1 (07:00-16:00)
 */
const STANDING_SHIFT_RULES = [
  { shift: 'A', match: (s) => s.id === 1 || s.name.includes('ธีระกิจ') },
  { shift: '1', match: (s) => s.id === 2 || s.name.includes('วรพงษ์') }
];

/**
 * รับประกันว่าทุกวันต้องมีเจ้าหน้าที่ "หมุนเวียน" ลงกะ 1 อย่างน้อย 1 คน
 * (นอกเหนือจากวรพงษ์ซึ่งยืนประจำกะ 1 เฉพาะจันทร์-ศุกร์ — เสาร์-อาทิตย์จึงต้องมีคนหมุนเวียนคุมกะ 1 แทน)
 */
function ensureRotatingMorningStaff(schedule, rotatingStaff, daysCount, maxStreak = 6) {
  for (let d = 0; d < daysCount; d++) {
    const covered = rotatingStaff.some(s => {
      const code = schedule[s.id][d];
      return code === '1' || code === 'HT1';
    });
    if (covered) continue;

    const candidate = rotatingStaff.find(s => {
      const row = schedule[s.id];
      if (row[d] !== 'H') return false;
      const prev = d > 0 ? row[d - 1] : 'H';
      if (prev === '3' || prev === 'HT3') return false; // ห้ามกะดึกต่อกะเช้า
      let streak = 1;
      for (let i = d - 1; i >= 0 && row[i] !== 'H'; i--) streak++;
      for (let i = d + 1; i < daysCount && row[i] !== 'H'; i++) streak++;
      return streak <= maxStreak;
    });
    if (candidate) schedule[candidate.id][d] = '1';
  }
}

export function generateAutoSchedule({
  staffList,
  daysCount,
  year,
  month,
  minPerShift = { '1': 1, '2': 2, '3': 2 },
  fixStaffA = true
}) {
  const staffCount = staffList.length;
  if (staffCount < 5) {
    throw new Error('จำเป็นต้องมีเจ้าหน้าที่อย่างน้อย 5 คนเพื่อรองรับการจัดกะ');
  }

  const newSchedule = {};
  staffList.forEach(s => {
    newSchedule[s.id] = new Array(daysCount).fill('H');
  });

  // แยกเจ้าหน้าที่ยืนประจำกะ (ธีระกิจ = A, วรพงษ์ = 1) ออกจากกลุ่มหมุนเวียน
  const standingStaff = [];
  const rotatingStaff = [];

  if (fixStaffA) {
    staffList.forEach(s => {
      const rule = STANDING_SHIFT_RULES.find(r => r.match(s));
      if (rule) {
        standingStaff.push({ staff: s, shift: rule.shift });
      } else {
        rotatingStaff.push(s);
      }
    });
  } else {
    staffList.forEach(s => rotatingStaff.push(s));
  }

  // 1. ลงกะยืนประจำ: จันทร์-ศุกร์ = กะประจำของแต่ละคน, เสาร์-อาทิตย์ = หยุด (H)
  standingStaff.forEach(({ staff, shift }) => {
    for (let d = 0; d < daysCount; d++) {
      const isWknd = isWeekend(year, month, d + 1);
      newSchedule[staff.id][d] = isWknd ? 'H' : shift;
    }
  });

  // 2. If exactly 7 rotating operators and standard requirements (1x[1], 2x[2], 2x[3])
  const req1 = minPerShift['1'] ?? 1;
  const req2 = minPerShift['2'] ?? 2;
  const req3 = minPerShift['3'] ?? 2;

  if (rotatingStaff.length === 7 && req1 === 1 && req2 === 2 && req3 === 2) {
    // Base rotating cycle: 1 -> 2 -> 2 -> 3 -> 3 -> H -> H
    const cycle = ['1', '2', '2', '3', '3', 'H', 'H'];
    rotatingStaff.forEach((staff, sIdx) => {
      for (let d = 0; d < daysCount; d++) {
        newSchedule[staff.id][d] = cycle[(d + sIdx) % 7];
      }
    });

    // Rule: "วันหยุดแต่ละคน ในแต่ละเดือนต้องเท่ากันทุกเดือน ถ้ามีคนเหลือเกินให้ลงกะ1"
    // Target off-days per rotating staff is exactly 8 days for standard months
    const targetOffDays = 8;
    rotatingStaff.forEach((staff) => {
      const row = newSchedule[staff.id];
      let currentH = row.filter(c => c === 'H').length;
      if (currentH > targetOffDays) {
        for (let d = 0; d < daysCount && currentH > targetOffDays; d++) {
          if (row[d] === 'H') {
            const prev = d > 0 ? row[d - 1] : 'H';
            // Avoid 3 -> 1 transition
            if (prev !== '3' && prev !== 'HT3') {
              let workStreak = 0;
              for (let i = d - 1; i >= 0 && row[i] !== 'H'; i--) workStreak++;
              for (let i = d + 1; i < daysCount && row[i] !== 'H'; i++) workStreak++;
              if (workStreak + 1 <= 6) {
                row[d] = '1'; // Assign surplus person to Shift 1!
                currentH--;
              }
            }
          }
        }
      }
    });

    ensureRotatingMorningStaff(newSchedule, rotatingStaff, daysCount);
    return newSchedule;
  }

  // Fallback: Dynamic constraint scheduler for custom team sizes
  const staffState = rotatingStaff.map(s => ({
    id: s.id,
    consecutiveWork: 0,
    consecutiveNights: 0,
    lastShift: 'H',
    totalWorkDays: 0,
    totalNights: 0,
    totalOffDays: 0
  }));

  const targetOffDays = 8;

  for (let d = 0; d < daysCount; d++) {
    const availableStaff = [...staffState].sort((a, b) => a.totalWorkDays - b.totalWorkDays);
    const assignedToday = new Set();

    // Night (3)
    let nightAssigned = 0;
    for (const staff of availableStaff) {
      if (nightAssigned >= req3) break;
      if (assignedToday.has(staff.id)) continue;
      if (staff.consecutiveNights >= 3 || staff.consecutiveWork >= 6) continue;

      newSchedule[staff.id][d] = '3';
      assignedToday.add(staff.id);
      staff.lastShift = '3';
      staff.consecutiveWork++;
      staff.consecutiveNights++;
      staff.totalWorkDays++;
      staff.totalNights++;
      nightAssigned++;
    }

    // Afternoon (2)
    let afternoonAssigned = 0;
    for (const staff of availableStaff) {
      if (afternoonAssigned >= req2) break;
      if (assignedToday.has(staff.id)) continue;
      if (staff.lastShift === '3' || staff.lastShift === 'HT3') continue;
      if (staff.consecutiveWork >= 6) continue;

      newSchedule[staff.id][d] = '2';
      assignedToday.add(staff.id);
      staff.lastShift = '2';
      staff.consecutiveWork++;
      staff.consecutiveNights = 0;
      staff.totalWorkDays++;
      afternoonAssigned++;
    }

    // Morning (1) + All surplus available staff ("ถ้ามีคนเหลือเกินให้ลงกะ1")
    for (const staff of availableStaff) {
      if (assignedToday.has(staff.id)) continue;
      if (staff.lastShift === '3' || staff.lastShift === 'HT3') continue;
      if (staff.consecutiveWork >= 6) continue;
      
      // If staff has already reached target off days or needs to work to balance off days
      const daysRemaining = daysCount - d;
      const offDaysNeeded = targetOffDays - staff.totalOffDays;

      if (daysRemaining > offDaysNeeded) {
        newSchedule[staff.id][d] = '1';
        assignedToday.add(staff.id);
        staff.lastShift = '1';
        staff.consecutiveWork++;
        staff.consecutiveNights = 0;
        staff.totalWorkDays++;
      }
    }

    // Day Off (H)
    for (const staff of staffState) {
      if (!assignedToday.has(staff.id)) {
        newSchedule[staff.id][d] = 'H';
        staff.lastShift = 'H';
        staff.consecutiveWork = 0;
        staff.consecutiveNights = 0;
        staff.totalOffDays++;
      }
    }
  }

  ensureRotatingMorningStaff(newSchedule, rotatingStaff, daysCount);
  return newSchedule;
}
