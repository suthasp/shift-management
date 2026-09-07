/**
 * CNO Shift Roster — ตัวรับข้อมูลจากเว็บแอปเพื่อเขียนกลับลง Google Sheet
 *
 * วิธีติดตั้งอยู่ในไฟล์ apps-script/README.md
 *
 * สัญญาการเรียกใช้ (contract)
 *   POST  body = JSON string, Content-Type: text/plain
 *   {
 *     "token":  "<ต้องตรงกับ SHARED_TOKEN ด้านล่าง>",
 *     "action": "updateCells",
 *     "year":   2026,          // ค.ศ.
 *     "month":  9,             // 1-12
 *     "changes": [ { "staffNo": 3, "staffName": "กฤษณพน จตุรบูรณ์", "day": 12, "code": "2" } ]
 *   }
 *
 *   ตอบกลับ { "ok": true, "updated": 1, "sheet": "Sep 2026" }
 *   หรือ    { "ok": false, "error": "..." }
 *
 * หมายเหตุเรื่อง Content-Type: ต้องเป็น text/plain เท่านั้น
 * ถ้าใช้ application/json เบราว์เซอร์จะยิง preflight (OPTIONS) ซึ่ง Apps Script
 * ตอบไม่ได้ ทำให้ติด CORS — ฝั่งเว็บแอปจึงส่ง JSON มาในรูปแบบ text/plain
 */

// ── ตั้งค่า ────────────────────────────────────────────────────────────────
/** เปลี่ยนเป็นค่าลับของคุณเอง แล้วใส่ค่าเดียวกันนี้ในเว็บแอป */
var SHARED_TOKEN = 'CHANGE-ME-TO-YOUR-OWN-SECRET';

/** รหัสกะที่ยอมให้เขียนได้ กันข้อมูลแปลกปลอมหลุดลงชีต */
var VALID_CODES = ['1', '2', '3', 'A', 'H', 'L', 'V', 'HT1', 'HT2', 'HT3'];

var TH_MONTHS = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
                 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
var EN_MONTHS = ['january', 'february', 'march', 'april', 'may', 'june',
                 'july', 'august', 'september', 'october', 'november', 'december'];

// ── จุดเข้า ───────────────────────────────────────────────────────────────

function doGet() {
  return jsonOut({ ok: true, service: 'CNO Shift Roster writer', ready: true });
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonOut({ ok: false, error: 'ไม่มีข้อมูลส่งมา' });
    }

    var req = JSON.parse(e.postData.contents);

    if (req.token !== SHARED_TOKEN) {
      return jsonOut({ ok: false, error: 'token ไม่ถูกต้อง' });
    }
    if (req.action !== 'updateCells') {
      return jsonOut({ ok: false, error: 'ไม่รู้จัก action: ' + req.action });
    }

    // ล็อกกันการเขียนชนกันเมื่อมีหลายคนแก้พร้อมกัน
    var lock = LockService.getScriptLock();
    if (!lock.tryLock(20000)) {
      return jsonOut({ ok: false, error: 'ระบบกำลังถูกใช้งานอยู่ กรุณาลองใหม่' });
    }

    try {
      return jsonOut(updateCells(req));
    } finally {
      lock.releaseLock();
    }
  } catch (err) {
    return jsonOut({ ok: false, error: String(err && err.message ? err.message : err) });
  }
}

// ── การทำงานหลัก ──────────────────────────────────────────────────────────

function updateCells(req) {
  var changes = req.changes || [];
  if (!changes.length) return { ok: true, updated: 0, sheet: null };

  var sheet = findMonthSheet(req.year, req.month);
  if (!sheet) {
    return { ok: false, error: 'ไม่พบแท็บของเดือน ' + req.month + '/' + req.year + ' ในสมุดงาน' };
  }

  var values = sheet.getDataRange().getValues();
  var dayRowIdx = findDayNumberRow(values);
  if (dayRowIdx === -1) return { ok: false, error: 'ไม่พบแถวเลขวันที่ในแท็บ ' + sheet.getName() };

  var dayCol = buildDayColumnMap(values[dayRowIdx], daysInMonth(req.year, req.month));
  var updated = 0;
  var skipped = [];

  for (var i = 0; i < changes.length; i++) {
    var ch = changes[i];
    var code = String(ch.code || '').toUpperCase();

    if (VALID_CODES.indexOf(code) === -1) {
      skipped.push('รหัสกะไม่ถูกต้อง: ' + code);
      continue;
    }

    var col = dayCol[ch.day];
    if (!col) {
      skipped.push('ไม่พบคอลัมน์ของวันที่ ' + ch.day);
      continue;
    }

    var row = findStaffRow(values, dayRowIdx, ch.staffNo, ch.staffName);
    if (row === -1) {
      skipped.push('ไม่พบแถวของ ' + (ch.staffName || ('No.' + ch.staffNo)));
      continue;
    }

    // getRange ใช้เลขฐาน 1 ส่วน values เป็นฐาน 0
    sheet.getRange(row + 1, col + 1).setValue(code);
    updated++;
  }

  SpreadsheetApp.flush();

  return {
    ok: true,
    updated: updated,
    sheet: sheet.getName(),
    skipped: skipped.length ? skipped : undefined
  };
}

// ── ตัวช่วยค้นหาตำแหน่งในชีต ───────────────────────────────────────────────

/** หาแท็บของเดือนที่ต้องการ จากชื่อแท็บก่อน ถ้าไม่เจอจึงดูจากหัวตารางในเซลล์ */
function findMonthSheet(year, month) {
  var sheets = SpreadsheetApp.getActiveSpreadsheet().getSheets();

  for (var i = 0; i < sheets.length; i++) {
    var label = parseMonthLabel(sheets[i].getName());
    if (label && label.year === year && label.month === month) return sheets[i];
  }

  // ชื่อแท็บอ่านไม่ออก ลองดูข้อความหัวตารางแถวแรก ๆ แทน
  for (var j = 0; j < sheets.length; j++) {
    var head = sheets[j].getRange(1, 1, Math.min(3, sheets[j].getLastRow()),
                                  Math.min(6, sheets[j].getLastColumn())).getValues();
    var text = head.map(function (r) { return r.join(' '); }).join(' ');
    var label2 = parseMonthLabel(text);
    if (label2 && label2.year === year && label2.month === month) return sheets[j];
  }

  return null;
}

/** แถวเลขวันที่ = แถวที่มีตัวเลข 1..31 เรียงกันตั้งแต่ 28 ตัวขึ้นไป */
function findDayNumberRow(values) {
  for (var i = 0; i < Math.min(values.length, 8); i++) {
    var count = 0;
    var hasOne = false;
    for (var j = 0; j < values[i].length; j++) {
      var v = String(values[i][j]).trim();
      if (/^\d+$/.test(v)) {
        var n = Number(v);
        if (n >= 1 && n <= 31) {
          count++;
          if (n === 1) hasOne = true;
        }
      }
    }
    if (hasOne && count >= 28) return i;
  }
  return -1;
}

/**
 * จับคู่ "วันที่" กับ "ดัชนีคอลัมน์"
 * ตัดคอลัมน์ที่เกินจำนวนวันจริงของเดือนออก เพราะบางแท็บมีคอลัมน์สรุป (เช่น "รวม")
 * ต่อท้ายแล้วใส่เลขไล่ต่อมาด้วย ซึ่งจะถูกเข้าใจผิดว่าเป็นวันที่
 */
function buildDayColumnMap(dayRow, maxDay) {
  var map = {};
  for (var j = 0; j < dayRow.length; j++) {
    var v = String(dayRow[j]).trim();
    if (!/^\d+$/.test(v)) continue;
    var day = Number(v);
    if (day < 1 || day > maxDay) continue;
    if (map[day]) continue; // เจอซ้ำให้ยึดตัวแรก
    map[day] = j;
  }
  return map;
}

/** หาแถวของเจ้าหน้าที่ ใช้เลข No. ในคอลัมน์แรกก่อน ถ้าไม่ตรงจึงเทียบชื่อ */
function findStaffRow(values, dayRowIdx, staffNo, staffName) {
  var target = normalizeName(staffName);

  for (var i = dayRowIdx + 1; i < values.length; i++) {
    var no = String(values[i][0]).trim();
    if (no !== '' && Number(no) === Number(staffNo)) return i;
  }
  if (!target) return -1;

  for (var k = dayRowIdx + 1; k < values.length; k++) {
    if (normalizeName(values[k][1]) === target) return k;
  }
  return -1;
}

// ── ตัวช่วยทั่วไป ─────────────────────────────────────────────────────────

/** ยุบช่องว่างซ้อนและตัดอักขระควบคุมทิศทางที่ Google Sheets แอบใส่มา */
function normalizeName(s) {
  return String(s == null ? '' : s)
    .replace(/[‎‏‪-‮⁦-⁩﻿]/g, '')
    .replace(/ /g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** อ่านเดือน/ปีจากข้อความ รองรับทั้ง "Sep 2026" และ "ประจำเดือนกันยายน 2569" */
function parseMonthLabel(text) {
  var raw = String(text || '');
  var m = raw.match(/(\d{4})/);
  if (!m) return null;
  var year = Number(m[1]);
  if (year >= 2400) year -= 543; // พ.ศ. -> ค.ศ.

  for (var i = 0; i < 12; i++) {
    if (raw.indexOf(TH_MONTHS[i]) !== -1) return { year: year, month: i + 1 };
  }
  var lower = raw.toLowerCase();
  for (var j = 0; j < 12; j++) {
    if (new RegExp('\\b' + EN_MONTHS[j].substring(0, 3)).test(lower)) {
      return { year: year, month: j + 1 };
    }
  }
  return null;
}

function daysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

function jsonOut(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
