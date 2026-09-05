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
 * Rule: ธีระกิจ & วรพงษ์ stand on Shift A (Mon-Fri), Weekend H
 * 7x24 Operations: Shift 1 = 1 person, Shift 2 = 2 persons, Shift 3 = 2 persons
 */
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

  // Identify fixed Shift A staff (ธีระกิจ & วรพงษ์)
  const fixedAStaff = [];
  const rotatingStaff = [];

  if (fixStaffA) {
    staffList.forEach(s => {
      if (s.id === 1 || s.id === 2 || s.name.includes('ธีระกิจ') || s.name.includes('วรพงษ์')) {
        fixedAStaff.push(s);
      } else {
        rotatingStaff.push(s);
      }
    });
  } else {
    staffList.forEach(s => rotatingStaff.push(s));
  }

  // 1. Assign fixed Shift A staff (ธีระกิจ & วรพงษ์)
  fixedAStaff.forEach(staff => {
    for (let d = 0; d < daysCount; d++) {
      const dayNum = d + 1;
      const isWknd = isWeekend(year, month, dayNum);
      // Weekdays = Shift A (08:00 - 17:00), Weekends = Day Off (H)
      newSchedule[staff.id][d] = isWknd ? 'H' : 'A';
    }
  });

  // 2. If exactly 7 rotating operators and standard requirements (1x[1], 2x[2], 2x[3])
  // use the mathematically optimal 7x24 rotating shift cycle
  const req1 = minPerShift['1'] ?? 1;
  const req2 = minPerShift['2'] ?? 2;
  const req3 = minPerShift['3'] ?? 2;

  if (rotatingStaff.length === 7 && req1 === 1 && req2 === 2 && req3 === 2) {
    // Pattern: 1 -> 2 -> 2 -> 3 -> 3 -> H -> H
    // 2 consecutive night shifts followed by 2 consecutive rest days, zero fatigue violations!
    const cycle = ['1', '2', '2', '3', '3', 'H', 'H'];
    rotatingStaff.forEach((staff, sIdx) => {
      for (let d = 0; d < daysCount; d++) {
        newSchedule[staff.id][d] = cycle[(d + sIdx) % 7];
      }
    });
    return newSchedule;
  }

  // Fallback: Dynamic constraint scheduler for custom team sizes or requirements
  const staffState = rotatingStaff.map(s => ({
    id: s.id,
    consecutiveWork: 0,
    consecutiveNights: 0,
    lastShift: 'H',
    totalWorkDays: 0,
    totalNights: 0
  }));

  for (let d = 0; d < daysCount; d++) {
    const needed = {
      '3': req3,
      '2': req2,
      '1': req1
    };

    const availableStaff = [...staffState].sort((a, b) => a.totalWorkDays - b.totalWorkDays);
    const assignedToday = new Set();

    // Night (3)
    let nightAssigned = 0;
    for (const staff of availableStaff) {
      if (nightAssigned >= needed['3']) break;
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
      if (afternoonAssigned >= needed['2']) break;
      if (assignedToday.has(staff.id)) continue;
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

    // Morning (1)
    let morningAssigned = 0;
    for (const staff of availableStaff) {
      if (morningAssigned >= needed['1']) break;
      if (assignedToday.has(staff.id)) continue;
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

    // Day Off (H)
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
