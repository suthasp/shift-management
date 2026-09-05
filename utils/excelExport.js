import { THAI_MONTHS, THAI_DAYS_SHORT } from '../data/initialData.js';
import { getDayOfWeek, isWeekend } from './schedulerEngine.js';

/**
 * Color maps (ARGB format for ExcelJS)
 */
const SHIFT_STYLE_MAP = {
  '1': {
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF00E5FF' } }, // Cyan
    font: { name: 'Arial', size: 10, bold: true, color: { argb: 'FF022C36' } }
  },
  '2': {
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF00E676' } }, // Neon Green
    font: { name: 'Arial', size: 10, bold: true, color: { argb: 'FF022C15' } }
  },
  '3': {
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFB2DD' } }, // Pink / Magenta
    font: { name: 'Arial', size: 10, bold: true, color: { argb: 'FF3C0326' } }
  },
  'A': {
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFB74D' } }, // Orange / Amber
    font: { name: 'Arial', size: 10, bold: true, color: { argb: 'FF3E2723' } }
  },
  'H': {
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF00' } }, // Vibrant Yellow
    font: { name: 'Arial', size: 10, bold: true, color: { argb: 'FF3E2723' } }
  },
  'L': {
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF94A3B8' } }, // Slate
    font: { name: 'Arial', size: 10, bold: true, color: { argb: 'FF0F172A' } }
  },
  'V': {
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2DD4BF' } }, // Teal
    font: { name: 'Arial', size: 10, bold: true, color: { argb: 'FF042F2E' } }
  }
};

const THIN_BORDER = {
  top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
  left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
  bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
  right: { style: 'thin', color: { argb: 'FFD1D5DB' } }
};

/**
 * Export shift schedule to fully styled Excel (.xlsx) file
 * Matches webapp colors and original spreadsheet exactly
 */
export async function exportRosterToExcel({ schedule, staffList, year, month, daysCount }) {
  const monthNameThai = THAI_MONTHS[month - 1];
  const monthNameEng = new Date(year, month - 1, 1).toLocaleString('en-US', { month: 'long' });

  // Dynamically import ExcelJS for browser client
  const ExcelJSModule = await import('exceljs');
  const ExcelJS = ExcelJSModule.default || ExcelJSModule;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'DC Shift Management System';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet(`${monthNameEng}_${year + 543}`, {
    views: [{ showGridLines: true }]
  });

  // 1. Setup Column Widths
  const columns = [
    { key: 'colA', width: 6 },  // Index #
    { key: 'colB', width: 25 }, // Staff Name
  ];
  for (let d = 1; d <= daysCount; d++) {
    columns.push({ key: `day_${d}`, width: 4.5 });
  }
  // Summary columns
  columns.push({ key: 'sum_1', width: 6 });
  columns.push({ key: 'sum_2', width: 6 });
  columns.push({ key: 'sum_3', width: 6 });
  columns.push({ key: 'sum_a', width: 6 });
  columns.push({ key: 'sum_h', width: 6 });
  columns.push({ key: 'sum_hrs', width: 8 });

  sheet.columns = columns;

  // --- Row 1: Header Top (8Hrs./Shift and Merged Month Banner) ---
  const row1 = sheet.getRow(1);
  row1.height = 24;

  const cellA1 = row1.getCell(1);
  cellA1.value = '8Hrs./Shift';
  cellA1.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF0F172A' } };
  cellA1.alignment = { vertical: 'middle', horizontal: 'center' };
  cellA1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
  cellA1.border = THIN_BORDER;

  const cellB1 = row1.getCell(2);
  cellB1.value = '';
  cellB1.border = THIN_BORDER;

  // Month Banner
  sheet.mergeCells(1, 3, 1, daysCount + 2);
  const monthBannerCell = sheet.getCell(1, 3);
  monthBannerCell.value = `${monthNameEng} (${monthNameThai} พ.ศ. ${year + 543})`;
  monthBannerCell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
  monthBannerCell.alignment = { vertical: 'middle', horizontal: 'center' };
  monthBannerCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF9800' } }; // Orange
  monthBannerCell.border = THIN_BORDER;

  // Summary header span
  sheet.mergeCells(1, daysCount + 3, 1, daysCount + 8);
  const sumBannerCell = sheet.getCell(1, daysCount + 3);
  sumBannerCell.value = 'สรุปรวมรายบุคคล';
  sumBannerCell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF334155' } };
  sumBannerCell.alignment = { vertical: 'middle', horizontal: 'center' };
  sumBannerCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
  sumBannerCell.border = THIN_BORDER;

  // --- Row 2: Day of Week in Thai ---
  const row2 = sheet.getRow(2);
  row2.height = 20;

  const cellA2 = row2.getCell(1);
  cellA2.value = '';
  cellA2.border = THIN_BORDER;

  const cellB2 = row2.getCell(2);
  cellB2.value = 'วันในสัปดาห์';
  cellB2.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FF475569' } };
  cellB2.alignment = { vertical: 'middle', horizontal: 'center' };
  cellB2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
  cellB2.border = THIN_BORDER;

  for (let d = 1; d <= daysCount; d++) {
    const dow = getDayOfWeek(year, month, d);
    const cell = row2.getCell(d + 2);
    cell.value = THAI_DAYS_SHORT[dow];
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = THIN_BORDER;

    if (dow === 6) {
      // Saturday = Purple
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF9333EA' } };
      cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FFFFFFFF' } };
    } else if (dow === 0) {
      // Sunday = Red
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDC2626' } };
      cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FFFFFFFF' } };
    } else if (dow === 1 || dow === 2) {
      // Mon / Tue = Orange
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF97316' } };
      cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FFFFFFFF' } };
    } else {
      // Wed, Thu, Fri = Soft Slate
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
      cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FF334155' } };
    }
  }

  // Summary Col Headers in Row 2
  const sumCols = ['1 (เช้า)', '2 (บ่าย)', '3 (ดึก)', 'A (ปกติ)', 'H (หยุด)', 'ชม. รวม'];
  sumCols.forEach((title, idx) => {
    const cell = row2.getCell(daysCount + 3 + idx);
    cell.value = title;
    cell.font = { name: 'Arial', size: 8, bold: true, color: { argb: 'FF334155' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
    cell.border = THIN_BORDER;
  });

  // --- Row 3: Day Numbers (1, 2, ..., 31) ---
  const row3 = sheet.getRow(3);
  row3.height = 20;

  const cellA3 = row3.getCell(1);
  cellA3.value = 'ลำดับ';
  cellA3.font = { name: 'Arial', size: 9, bold: true };
  cellA3.alignment = { vertical: 'middle', horizontal: 'center' };
  cellA3.border = THIN_BORDER;

  const cellB3 = row3.getCell(2);
  cellB3.value = 'ชื่อ - สกุล';
  cellB3.font = { name: 'Arial', size: 9, bold: true };
  cellB3.alignment = { vertical: 'middle', horizontal: 'left' };
  cellB3.border = THIN_BORDER;

  for (let d = 1; d <= daysCount; d++) {
    const cell = row3.getCell(d + 2);
    cell.value = d;
    cell.border = THIN_BORDER;
    cell.alignment = { vertical: 'middle', horizontal: 'center' };

    const isWknd = isWeekend(year, month, d);
    if (isWknd) {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } }; // Soft red
      cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FFDC2626' } };
    } else {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
      cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FF1E293B' } };
    }
  }

  // Row 3 Summary empty filler
  for (let i = 0; i < 6; i++) {
    const cell = row3.getCell(daysCount + 3 + i);
    cell.value = '';
    cell.border = THIN_BORDER;
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
  }

  // --- Staff Shift Rows (Rows 4 to N) ---
  staffList.forEach((staff, sIdx) => {
    const rowNum = 4 + sIdx;
    const row = sheet.getRow(rowNum);
    row.height = 22;

    // Col A: Number
    const cA = row.getCell(1);
    cA.value = sIdx + 1;
    cA.font = { name: 'Arial', size: 9, color: { argb: 'FF64748B' } };
    cA.alignment = { vertical: 'middle', horizontal: 'center' };
    cA.border = THIN_BORDER;

    // Col B: Staff Name
    const cB = row.getCell(2);
    cB.value = staff.name;
    cB.font = { name: 'Arial', size: 9.5, bold: true, color: { argb: 'FF0F172A' } };
    cB.alignment = { vertical: 'middle', horizontal: 'left' };
    cB.border = THIN_BORDER;

    const staffShifts = schedule[staff.id] || [];
    let c1 = 0, c2 = 0, c3 = 0, cAcount = 0, cH = 0;

    // Day Shift Cells (Col C to Col DaysCount+2)
    for (let d = 0; d < daysCount; d++) {
      const shiftCode = staffShifts[d] || 'H';
      const cell = row.getCell(d + 3);
      cell.value = shiftCode;
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = THIN_BORDER;

      // Apply Exact Shift Colors
      const style = SHIFT_STYLE_MAP[shiftCode] || SHIFT_STYLE_MAP['H'];
      cell.fill = style.fill;
      cell.font = style.font;

      if (shiftCode === '1') c1++;
      else if (shiftCode === '2') c2++;
      else if (shiftCode === '3') c3++;
      else if (shiftCode === 'A') cAcount++;
      else if (shiftCode === 'H') cH++;
    }

    const totalHours = (c1 + c2 + c3 + cAcount) * 8;

    // Summary Cells for this staff
    const sumVals = [c1, c2, c3, cAcount, cH, totalHours];
    sumVals.forEach((val, idx) => {
      const cell = row.getCell(daysCount + 3 + idx);
      cell.value = val;
      cell.border = THIN_BORDER;
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.font = { name: 'Arial', size: 9, bold: idx === 5, color: { argb: idx === 5 ? 'FF0284C7' : 'FF0F172A' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: idx === 5 ? 'FFE0F2FE' : 'FFF8FAFC' } };
    });
  });

  // --- Bottom Coverage Summary Rows ---
  const startCovRow = 4 + staffList.length;

  const coverageDefinitions = [
    { code: 'A', name: 'กะปกติ (08:00 - 17:00)', target: 2, bg: 'FFFFF7ED', fg: 'FFFFB74D' },
    { code: '1', name: 'กะเช้า (07:00 - 16:00)', target: 1, bg: 'FFE0F7FA', fg: 'FF00E5FF' },
    { code: '2', name: 'กะบ่าย (15:00 - 24:00)', target: 2, bg: 'FFE8F5E9', fg: 'FF00E676' },
    { code: '3', name: 'กะดึก (23:00 - 08:00)', target: 2, bg: 'FFFCE4EC', fg: 'FFFFB2DD' },
    { code: 'H', name: 'วันหยุด (Day Off)', target: 0, bg: 'FFFFFDE7', fg: 'FFFFFF00' },
  ];

  coverageDefinitions.forEach((cov, covIdx) => {
    const rowNum = startCovRow + covIdx;
    const row = sheet.getRow(rowNum);
    row.height = 20;

    const cA = row.getCell(1);
    cA.value = '';
    cA.border = THIN_BORDER;

    const cB = row.getCell(2);
    cB.value = cov.name;
    cB.font = { name: 'Arial', size: 8.5, bold: true, color: { argb: 'FF334155' } };
    cB.alignment = { vertical: 'middle', horizontal: 'right' };
    cB.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
    cB.border = THIN_BORDER;

    for (let d = 0; d < daysCount; d++) {
      let count = 0;
      staffList.forEach(s => {
        const c = (schedule[s.id] || [])[d] || 'H';
        if (c === cov.code) count++;
      });

      const cell = row.getCell(d + 3);
      cell.value = count;
      cell.border = THIN_BORDER;
      cell.alignment = { vertical: 'middle', horizontal: 'center' };

      // Highlight coverage alerts
      if (cov.code === '1' || cov.code === '2' || cov.code === '3') {
        if (count === 0) {
          // Zero staff = Red Alert!
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
          cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FFEF4444' } };
        } else if (count < cov.target) {
          // Under target = Amber Warning
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } };
          cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FFF59E0B' } };
        } else {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: cov.bg } };
          cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FF15803D' } };
        }
      } else {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: cov.bg } };
        cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FF475569' } };
      }
    }

    // Merge summary columns for coverage
    sheet.mergeCells(rowNum, daysCount + 3, rowNum, daysCount + 8);
    const targetCell = sheet.getCell(rowNum, daysCount + 3);
    targetCell.value = cov.code === 'A' ? 'ธีระกิจ & วรพงษ์ (จ.-ศ.)' : cov.target > 0 ? `เป้าหมาย 7x24: ${cov.target} คน` : '';
    targetCell.font = { name: 'Arial', size: 8, color: { argb: 'FF64748B' } };
    targetCell.alignment = { vertical: 'middle', horizontal: 'center' };
    targetCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
    targetCell.border = THIN_BORDER;
  });

  // --- Empty separator ---
  const sepRowNum = startCovRow + coverageDefinitions.length + 1;

  // --- Legend Table (Matching original document legend) ---
  const legendHeaderRow = sheet.getRow(sepRowNum + 1);
  legendHeaderRow.height = 20;

  const legHeadA = legendHeaderRow.getCell(1);
  legHeadA.value = 'รหัส';
  legHeadA.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FFFFFFFF' } };
  legHeadA.alignment = { vertical: 'middle', horizontal: 'center' };
  legHeadA.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } };
  legHeadA.border = THIN_BORDER;

  const legHeadB = legendHeaderRow.getCell(2);
  legHeadB.value = 'เวลาปฏิบัติงาน / คำอธิบาย';
  legHeadB.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FFFFFFFF' } };
  legHeadB.alignment = { vertical: 'middle', horizontal: 'left' };
  legHeadB.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } };
  legHeadB.border = THIN_BORDER;

  const legendItems = [
    { code: 'A', text: '08:00 - 17:00 กะปกติ (Admin / Office)' },
    { code: '1', text: '07:00 - 16:00 กะเช้า (Morning Shift)' },
    { code: '2', text: '15:00 - 24:00 กะบ่าย (Afternoon Shift)' },
    { code: '3', text: '23:00 - 08:00 กะดึก (Night Shift)' },
    { code: 'H', text: 'วันหยุด (Holiday / Day Off)' },
  ];

  legendItems.forEach((leg, idx) => {
    const row = sheet.getRow(sepRowNum + 2 + idx);
    row.height = 20;

    const cCode = row.getCell(1);
    cCode.value = leg.code;
    cCode.alignment = { vertical: 'middle', horizontal: 'center' };
    cCode.border = THIN_BORDER;

    const style = SHIFT_STYLE_MAP[leg.code];
    cCode.fill = style.fill;
    cCode.font = style.font;

    const cText = row.getCell(2);
    cText.value = leg.text;
    cText.font = { name: 'Arial', size: 9, color: { argb: 'FF1E293B' } };
    cText.alignment = { vertical: 'middle', horizontal: 'left' };
    cText.border = THIN_BORDER;
  });

  // 3. Write buffer & Trigger Download
  if (typeof window !== 'undefined') {
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    const url = window.URL.createObjectURL(blob);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.href = url;
    downloadAnchor.download = `DC_Shift_Schedule_${monthNameEng}_${year + 543}.xlsx`;
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    window.URL.revokeObjectURL(url);
  } else {
    // Server / Node.js test environment
    await workbook.xlsx.writeFile(`DC_Shift_Schedule_${monthNameEng}_${year + 543}.xlsx`);
  }
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
