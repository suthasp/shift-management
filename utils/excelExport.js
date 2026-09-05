import * as XLSX from 'xlsx';
import { THAI_MONTHS, THAI_DAYS_SHORT, SHIFT_TYPES } from '../data/initialData';
import { getDayOfWeek } from './schedulerEngine';

/**
 * Export the current shift schedule to an Excel file (.xlsx)
 * formatted to match the user's template
 */
export function exportRosterToExcel({ schedule, staffList, year, month, daysCount }) {
  const monthNameThai = THAI_MONTHS[month - 1];
  const monthNameEng = new Date(year, month - 1, 1).toLocaleString('en-US', { month: 'long' });

  // 1. Build row data
  const data = [];

  // Row 1: Title & Month
  const titleRow = ['8Hrs./Shift', '', monthNameEng];
  for (let i = 3; i <= daysCount + 2; i++) titleRow.push('');
  data.push(titleRow);

  // Row 2: Day of Week (Thai)
  const dowRow = ['', ''];
  for (let d = 1; d <= daysCount; d++) {
    const dow = getDayOfWeek(year, month, d);
    dowRow.push(THAI_DAYS_SHORT[dow]);
  }
  data.push(dowRow);

  // Row 3: Day numbers (1, 2, ..., 31)
  const daysRow = ['ลำดับ', 'ชื่อ - สกุล'];
  for (let d = 1; d <= daysCount; d++) {
    daysRow.push(d);
  }
  data.push(daysRow);

  // Rows 4 to N: Staff rows
  staffList.forEach((staff, index) => {
    const staffShifts = schedule[staff.id] || [];
    const row = [index + 1, staff.name];
    for (let d = 0; d < daysCount; d++) {
      row.push(staffShifts[d] || 'H');
    }
    data.push(row);
  });

  // Empty separator
  data.push([]);

  // Legend rows matching user's image
  data.push(['รหัสกะ / คำอธิบาย', 'เวลาปฏิบัติงาน', 'หมายเหตุ']);
  data.push(['A', '08:00 - 17:00', 'กะปกติ (Admin/Office)']);
  data.push(['1', '07:00 - 16:00', 'กะเช้า (Morning)']);
  data.push(['2', '15:00 - 24:00', 'กะบ่าย (Afternoon)']);
  data.push(['3', '23:00 - 08:00', 'กะดึก (Night)']);
  data.push(['H', 'วันหยุด', 'Day Off']);

  // 2. Create worksheet
  const ws = XLSX.utils.aoa_to_sheet(data);

  // Set column widths
  const colWidths = [
    { wch: 8 },  // No.
    { wch: 26 }, // Name
  ];
  for (let d = 0; d < daysCount; d++) {
    colWidths.push({ wch: 4.5 }); // Day columns
  }
  ws['!cols'] = colWidths;

  // 3. Create workbook and trigger download
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, `${monthNameEng}_${year}`);

  const fileName = `DC_Shift_Schedule_${monthNameEng}_${year}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

/**
 * Export data to JSON for full backup
 */
export function exportBackupJSON(state) {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `DC_Shift_Backup_${new Date().toISOString().slice(0,10)}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}
