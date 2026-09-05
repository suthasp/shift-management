import { SHIFT_TYPES, DC_SETTINGS_DEFAULT } from '../data/initialData';

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
export function calculateDailyCoverage(schedule, staffList, daysCount, settings = DC_SETTINGS_DEFAULT) {
  const coverage = [];
  const minStaff = settings.minStaffPerShift || { '1': 2, '2': 2, '3': 2 };

  for (let d = 0; d < daysCount; d++) {
    const counts = {
      '1': 0,
      '2': 0,
      '3': 0,
      'A': 0,
      'H': 0,
      'L': 0,
      'V': 0,
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

      if (code === '1' || code === '2' || code === '3' || code === 'A') {
        counts.totalWorking++;
      }
    });

    // Check deficits
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
 * Calculate working metrics, hours and allowances per staff
 */
export function calculateStaffSummary(schedule, staffList, daysCount, year, month, settings = DC_SETTINGS_DEFAULT) {
  const rates = settings.allowanceRates || { nightShiftRate: 300, weekendBonusRate: 150 };

  return staffList.map(staff => {
    const shifts = schedule[staff.id] || [];
    const counts = { '1': 0, '2': 0, '3': 0, 'A': 0, 'H': 0, 'L': 0, 'V': 0 };
    let totalWorkDays = 0;
    let weekendShifts = 0;

    for (let d = 0; d < daysCount; d++) {
      const code = shifts[d] || 'H';
      if (counts[code] !== undefined) {
        counts[code]++;
      }
      if (code === '1' || code === '2' || code === '3' || code === 'A') {
        totalWorkDays++;
        if (isWeekend(year, month, d + 1)) {
          weekendShifts++;
        }
      }
    }

    const totalHours = totalWorkDays * 8;
    const nightShiftAllowance = counts['3'] * rates.nightShiftRate;
    const weekendAllowance = weekendShifts * rates.weekendBonusRate;
    const totalEstimatedAllowance = nightShiftAllowance + weekendAllowance;

    return {
      staffId: staff.id,
      empCode: staff.empCode,
      name: staff.name,
      position: staff.position,
      counts,
      totalWorkDays,
      totalOffDays: counts['H'] + counts['L'] + counts['V'],
      totalHours,
      weekendShifts,
      nightShiftAllowance,
      weekendAllowance,
      totalEstimatedAllowance
    };
  });
}

/**
 * Check Labor & Safety Compliance:
 * 1. Night shift (3) directly followed by morning shift (1)
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
      const isWork = current === '1' || current === '2' || current === '3' || current === 'A';

      // 1. Check Night -> Morning transition
      if (d < daysCount - 1) {
        const next = shifts[d + 1] || 'H';
        if (current === '3' && next === '1') {
          staffViolations[d] = staffViolations[d] || [];
          staffViolations[d].push({
            type: 'quick_turnaround',
            level: 'danger',
            message: 'เข้ากะดึก (3) เลิก 08:00 ต่อด้วยกะเช้า (1) ทันที พักผ่อนไม่ถึง 12 ชม.'
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
      if (current === '3') {
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
 * Generates an optimal, balanced roster that fulfills coverage and respects rest days
 */
export function generateAutoSchedule({
  staffList,
  daysCount,
  year,
  month,
  minPerShift = { '1': 2, '2': 2, '3': 2 }
}) {
  const staffCount = staffList.length;
  if (staffCount < 6) {
    throw new Error('จำเป็นต้องมีเจ้าหน้าที่อย่างน้อย 6 คนเพื่อรองรับ 3 กะตลอด 24 ชั่วโมง');
  }

  const newSchedule = {};
  staffList.forEach(s => {
    newSchedule[s.id] = new Array(daysCount).fill('H');
  });

  // Track state per employee
  const staffState = staffList.map(s => ({
    id: s.id,
    consecutiveWork: 0,
    consecutiveNights: 0,
    lastShift: 'H',
    totalWorkDays: 0,
    totalNights: 0
  }));

  for (let d = 0; d < daysCount; d++) {
    // Required slots for today
    const needed = {
      '3': minPerShift['3'] || 2, // Assign Night first (hardest constraint)
      '2': minPerShift['2'] || 2, // Assign Afternoon
      '1': minPerShift['1'] || 2  // Assign Morning
    };

    // Score available employees for each shift
    // For Night shift: Avoid someone who worked Shift 1 or 2 with low rest, or someone who already did 3 nights
    const availableStaff = [...staffState].sort((a, b) => {
      // Prioritize staff with fewer total work days to balance workload
      return a.totalWorkDays - b.totalWorkDays;
    });

    const assignedToday = new Set();

    // 1. Assign Night Shifts (3)
    let nightAssigned = 0;
    for (const staff of availableStaff) {
      if (nightAssigned >= needed['3']) break;
      if (assignedToday.has(staff.id)) continue;

      // Cannot assign night if already 3 consecutive nights or 6 consecutive days
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

    // 2. Assign Afternoon Shifts (2)
    let afternoonAssigned = 0;
    for (const staff of availableStaff) {
      if (afternoonAssigned >= needed['2']) break;
      if (assignedToday.has(staff.id)) continue;

      // After night shift, MUST have rest day (cannot do 2 next day without sleep)
      if (staff.lastShift === '3') continue;
      if (staff.consecutiveWork >= 6) continue;

      newSchedule[staff.id][d] = '2';
      assignedToday.add(staff.id);
      staff.lastShift = '2';
      staff.consecutiveWork++;
      staff.consecutiveNights = 0;
      staff.totalWorkDays++;
      afternoonAssigned++;
    }

    // 3. Assign Morning Shifts (1)
    let morningAssigned = 0;
    for (const staff of availableStaff) {
      if (morningAssigned >= needed['1']) break;
      if (assignedToday.has(staff.id)) continue;

      // After night shift (3), STRICTLY CANNOT work morning shift (1)
      if (staff.lastShift === '3') continue;
      if (staff.consecutiveWork >= 6) continue;

      newSchedule[staff.id][d] = '1';
      assignedToday.add(staff.id);
      staff.lastShift = '1';
      staff.consecutiveWork++;
      staff.consecutiveNights = 0;
      staff.totalWorkDays++;
      morningAssigned++;
    }

    // 4. Remaining staff get Day Off ('H')
    for (const staff of staffState) {
      if (!assignedToday.has(staff.id)) {
        newSchedule[staff.id][d] = 'H';
        staff.lastShift = 'H';
        staff.consecutiveWork = 0;
        staff.consecutiveNights = 0;
      }
    }
  }

  return newSchedule;
}
