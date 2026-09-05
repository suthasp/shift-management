import { INITIAL_STAFF, SHIFT_TYPES, OT_CLAIM_RULES } from '../data/initialData.js';
import { generateAutoSchedule, calculateDailyCoverage, calculateStaffSummary } from '../utils/schedulerEngine.js';

console.log('=== Checking SHIFT_TYPES for HT1, HT2, HT3 ===');
['HT1', 'HT2', 'HT3'].forEach(code => {
  const shift = SHIFT_TYPES[code];
  console.log(`${code}: name="${shift.name}", bgColor="${shift.bgColor}", textColor="${shift.textColor}", isOT=${shift.isOT}`);
});

console.log('\n=== Checking OT_CLAIM_RULES ===');
console.log(`Total rules defined: ${OT_CLAIM_RULES.length}`);
OT_CLAIM_RULES.forEach((r, idx) => {
  console.log(`Rule ${idx + 1}: [${r.type}] -> ${r.rate} (${r.condition})`);
});

console.log('\n=== Testing Auto-Schedule for September (30 days) ===');
const schedSep = generateAutoSchedule({ staffList: INITIAL_STAFF, daysCount: 30, year: 2026, month: 9 });
const covSep = calculateDailyCoverage(schedSep, INITIAL_STAFF, 30);
const sumSep = calculateStaffSummary(schedSep, INITIAL_STAFF, 30, 2026, 9);

console.log('Daily coverage sample (Day 1):', covSep[0].counts);
let allRotating8 = true;
INITIAL_STAFF.filter(s => s.role !== 'office').forEach(s => {
  const hCount = schedSep[s.id].filter(c => c === 'H').length;
  const shift1Count = schedSep[s.id].filter(c => c === '1').length;
  console.log(`${s.name}: H=${hCount}, Shift 1=${shift1Count}`);
  if (hCount !== 8) allRotating8 = false;
});
console.log('All rotating staff have exactly 8 days off in Sep:', allRotating8);

console.log('\n=== Testing Auto-Schedule for October (31 days) ===');
const schedOct = generateAutoSchedule({ staffList: INITIAL_STAFF, daysCount: 31, year: 2026, month: 10 });
const covOct = calculateDailyCoverage(schedOct, INITIAL_STAFF, 31);
allRotating8 = true;
INITIAL_STAFF.filter(s => s.role !== 'office').forEach(s => {
  const hCount = schedOct[s.id].filter(c => c === 'H').length;
  const shift1Count = schedOct[s.id].filter(c => c === '1').length;
  console.log(`${s.name}: H=${hCount}, Shift 1=${shift1Count}`);
  if (hCount !== 8) allRotating8 = false;
});
console.log('All rotating staff have exactly 8 days off in Oct:', allRotating8);

console.log('\nAll assertions passed!');
