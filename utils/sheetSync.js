/**
 * ซิงก์ตารางกะจาก Google Sheet ที่เผยแพร่ด้วย "ไฟล์ > แชร์ > เผยแพร่ไปยังเว็บ"
 *
 * สมุดงานมีหนึ่งแท็บต่อหนึ่งเดือน (เช่น "Jan 2026", "Sep 2026")
 * โครงสร้างของแต่ละแท็บ:
 *   บรรทัด 1 : ,ตารางการทำงาน TOC-RST ประจำเดือนกันยายน 2569,,,...   <- ใช้ยืนยันว่าเป็นเดือนที่ขอจริง
 *   บรรทัด 2 : No.,Name,Tue,Wed,Thu,...                              <- ชื่อวันในสัปดาห์
 *   บรรทัด 3 : ,,1,2,3,...                                           <- เลขวันที่ (ใช้กำหนดคอลัมน์)
 *   บรรทัด 4+: 1,ธีระกิจ พรมตุ้ม,A,A,A,H,H,...                        <- ข้อมูลรายคน
 *
 * ปลายทางส่ง Access-Control-Allow-Origin: * จึงเรียกจากเบราว์เซอร์ได้ตรง ๆ
 * ไม่ต้องมี backend (แอปนี้ deploy เป็น static export)
 */

export const SHEET_PUB_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vSwYJYRCcGER3xx1bR1tRfiRei8NMkLFsEB_Svx_cQmhuUM81vkuZOKWvKs_u-V_aG65SKb6uhfj9PH/pub';

/** Google แคชไฟล์ที่เผยแพร่ไว้ราว 5 นาที ดึงถี่กว่านี้ก็ไม่ได้ข้อมูลใหม่ */
export const SHEET_CACHE_SECONDS = 300;

const VALID_CODES = new Set(['1', '2', '3', 'A', 'H', 'L', 'V', 'HT1', 'HT2', 'HT3']);

const TH_MONTHS_FULL = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];
const TH_MONTHS_ABBR = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
];
const EN_MONTHS = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december'
];

/* ------------------------------------------------------------------ */
/* CSV                                                                 */
/* ------------------------------------------------------------------ */

/**
 * ตัวแยก CSV ตาม RFC 4180 (รองรับเครื่องหมายคำพูดและลูกน้ำในเซลล์)
 * ชื่อเจ้าหน้าที่บางคนมีลูกน้ำหรือช่องว่างซ้อน จึงใช้ split(',') ตรง ๆ ไม่ได้
 */
export function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];

    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else {
        field += c;
      }
      continue;
    }

    if (c === '"') { inQuotes = true; }
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (c !== '\r') { field += c; }
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }

  return rows;
}

/* ------------------------------------------------------------------ */
/* ตัวช่วย                                                             */
/* ------------------------------------------------------------------ */

/** ยุบช่องว่างซ้อนและตัดหัวท้าย — ชีตมีชื่อแบบ "วรพงษ์  ริมสกุล " */
export function normalizeName(s) {
  return String(s || '').replace(/\s+/g, ' ').trim();
}

/** ปีมากกว่า 2400 ถือเป็น พ.ศ. แปลงเป็น ค.ศ. */
function toGregorianYear(y) {
  return y >= 2400 ? y - 543 : y;
}

/**
 * อ่านชื่อเดือน/ปีจากข้อความ รองรับทั้งชื่อแท็บ ("Jan 2026")
 * และหัวตารางภาษาไทย ("ประจำเดือนกันยายน 2569")
 * คืน { year, month } โดย month เป็น 1-12 (ตรงกับ convention ของแอป)
 */
export function parseMonthLabel(text) {
  const raw = String(text || '');
  const lower = raw.toLowerCase();

  const yearMatch = raw.match(/(\d{4})/);
  if (!yearMatch) return null;
  const year = toGregorianYear(Number(yearMatch[1]));

  for (let i = 0; i < 12; i++) {
    if (raw.includes(TH_MONTHS_FULL[i]) || raw.includes(TH_MONTHS_ABBR[i])) {
      return { year, month: i + 1 };
    }
  }
  for (let i = 0; i < 12; i++) {
    // "jan", "january" — ตรวจ 3 ตัวแรกโดยต้องขึ้นต้นคำ กัน "march" ไปชน "mar" ของคำอื่น
    if (new RegExp(`\\b${EN_MONTHS[i].slice(0, 3)}`, 'i').test(lower)) {
      return { year, month: i + 1 };
    }
  }
  return null;
}

function csvUrl(gid) {
  const bust = `_ts=${Date.now()}`;
  return gid === null || gid === undefined
    ? `${SHEET_PUB_URL}?output=csv&${bust}`
    : `${SHEET_PUB_URL}?output=csv&gid=${encodeURIComponent(gid)}&${bust}`;
}

/* ------------------------------------------------------------------ */
/* ค้นหาแท็บในสมุดงาน                                                   */
/* ------------------------------------------------------------------ */

let tabCache = null;

/**
 * ดึงรายชื่อแท็บ (ชื่อ + gid) จากหน้า pub ของ Google
 * หน้านี้ฝัง items.push({name: "Sep 2026", ... gid: "1338607717"}) ไว้ในสคริปต์
 * ถ้ารูปแบบของ Google เปลี่ยนจนอ่านไม่ได้ จะคืนอาเรย์ว่าง แล้วผู้เรียกจะ fallback
 * ไปใช้แท็บแรกของสมุดงานแทน
 */
export async function discoverSheetTabs({ force = false } = {}) {
  if (tabCache && !force) return tabCache;

  const res = await fetch(`${SHEET_PUB_URL}?_ts=${Date.now()}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`เปิดสมุดงานไม่สำเร็จ (HTTP ${res.status})`);
  const html = await res.text();

  const tabs = [];
  const re = /items\.push\(\{name:\s*"([^"]+)"[\s\S]{0,800}?gid:\s*"(\d+)"/g;
  let m;
  while ((m = re.exec(html))) {
    tabs.push({ name: m[1], gid: m[2], label: parseMonthLabel(m[1]) });
  }

  tabCache = tabs;
  return tabs;
}

/* ------------------------------------------------------------------ */
/* แปลง CSV เป็นตารางกะ                                                */
/* ------------------------------------------------------------------ */

/**
 * แปลงข้อความ CSV ของหนึ่งแท็บเป็นโครงสร้างกลาง
 * คืน { label, dayColumns, rows } — label คือเดือน/ปีที่อ่านได้จากหัวตาราง
 */
export function parseSheetCsv(text) {
  const rows = parseCSV(text).filter(r => r.some(c => String(c).trim() !== ''));
  if (rows.length < 4) throw new Error('รูปแบบชีตไม่ถูกต้อง (ข้อมูลไม่ครบ)');

  const label = parseMonthLabel(rows[0].join(' '));

  // หาแถวที่เป็นเลขวันที่ (1,2,3,...) — ปกติคือแถวที่ 3 แต่ค้นเผื่อชีตมีแถวเกิน
  let dayRowIdx = -1;
  for (let i = 0; i < Math.min(rows.length, 6); i++) {
    const nums = rows[i].filter(c => /^\d+$/.test(String(c).trim()));
    if (nums.length >= 28 && String(rows[i].find(c => /^\d+$/.test(String(c).trim()))).trim() === '1') {
      dayRowIdx = i;
      break;
    }
  }
  if (dayRowIdx === -1) throw new Error('ไม่พบแถวเลขวันที่ในชีต');

  // คอลัมน์ไหนคือวันที่เท่าไร
  let dayColumns = [];
  const seenDays = new Set();
  rows[dayRowIdx].forEach((cell, colIdx) => {
    const v = String(cell).trim();
    if (!/^\d+$/.test(v)) return;
    const day = Number(v);
    if (day < 1 || day > 31 || seenDays.has(day)) return;
    seenDays.add(day);
    dayColumns.push({ colIdx, day });
  });

  // บางแท็บมีคอลัมน์สรุป (เช่น "รวม") ต่อท้าย และแถวเลขวันที่ใส่ตัวเลขไล่ต่อมาด้วย
  // เช่นแท็บ Jun 2026 มีเลข 31 ทั้งที่มิถุนายนมี 30 วัน จึงตัดทิ้งตามจำนวนวันจริงของเดือน
  if (label) {
    const daysInMonth = new Date(label.year, label.month, 0).getDate();
    dayColumns = dayColumns.filter(c => c.day <= daysInMonth);
    if (dayColumns.length !== daysInMonth) {
      throw new Error(
        `ชีตเดือน ${label.month}/${label.year} มีคอลัมน์วันที่ ${dayColumns.length} คอลัมน์ แต่เดือนนี้มี ${daysInMonth} วัน`
      );
    }
  } else if (dayColumns.length < 28) {
    throw new Error(`พบคอลัมน์วันที่เพียง ${dayColumns.length} คอลัมน์`);
  }

  const staffRows = [];
  for (let i = dayRowIdx + 1; i < rows.length; i++) {
    const r = rows[i];
    const no = String(r[0] ?? '').trim();
    const name = normalizeName(r[1]);
    if (!name) continue;
    staffRows.push({
      no: /^\d+$/.test(no) ? Number(no) : null,
      name,
      cells: dayColumns.map(({ colIdx, day }) => ({
        day,
        code: String(r[colIdx] ?? '').trim().toUpperCase()
      }))
    });
  }
  if (staffRows.length === 0) throw new Error('ไม่พบแถวข้อมูลเจ้าหน้าที่ในชีต');

  return { label, dayColumns, rows: staffRows };
}

/**
 * จับคู่แถวในชีตกับเจ้าหน้าที่ในแอป แล้วสร้าง schedule object
 * จับคู่ด้วยลำดับ No. ก่อน (ตรงกับ id) ถ้าไม่ตรงจึงใช้ชื่อที่ normalize แล้ว
 */
export function buildScheduleFromSheet(parsed, staffList, daysCount) {
  const byId = new Map(staffList.map(s => [s.id, s]));
  const byName = new Map(staffList.map(s => [normalizeName(s.name), s]));

  const schedule = {};
  staffList.forEach(s => { schedule[s.id] = new Array(daysCount).fill('H'); });

  const matchedIds = new Set();
  const unmatchedRows = [];
  const unknownCodes = new Set();

  parsed.rows.forEach(row => {
    let staff = row.no !== null ? byId.get(row.no) : undefined;
    if (staff && normalizeName(staff.name) !== row.name && byName.has(row.name)) {
      // No. ชนกับคนอื่น — เชื่อชื่อมากกว่า
      staff = byName.get(row.name);
    }
    if (!staff) staff = byName.get(row.name);
    if (!staff) { unmatchedRows.push(row.name); return; }

    matchedIds.add(staff.id);
    row.cells.forEach(({ day, code }) => {
      const d = day - 1;
      if (d < 0 || d >= daysCount) return;
      if (!code) { schedule[staff.id][d] = 'H'; return; }
      if (VALID_CODES.has(code)) {
        schedule[staff.id][d] = code;
      } else {
        unknownCodes.add(code);
        schedule[staff.id][d] = 'H';
      }
    });
  });

  const missingStaff = staffList.filter(s => !matchedIds.has(s.id)).map(s => s.name);

  return {
    schedule,
    matchedCount: matchedIds.size,
    unmatchedRows,
    missingStaff,
    unknownCodes: [...unknownCodes]
  };
}

/* ------------------------------------------------------------------ */
/* API หลัก                                                            */
/* ------------------------------------------------------------------ */

/**
 * ดึงตารางกะของเดือนที่ระบุจากชีต
 *
 * คืน { status, ... } โดย status เป็นหนึ่งใน
 *   'ok'       ได้ข้อมูลครบ -> ใช้ result.schedule ได้เลย
 *   'no-tab'   สมุดงานยังไม่มีแท็บของเดือนนี้ -> ผู้เรียกควรใช้ตารางที่แอปสร้างเอง
 * ถ้าดึงไม่ได้จะ throw เพื่อให้ผู้เรียกแสดงข้อความผิดพลาด
 */
export async function fetchMonthFromSheet({ year, month, staffList, daysCount }) {
  const tabs = await discoverSheetTabs();

  const tab = tabs.find(t => t.label && t.label.year === year && t.label.month === month);
  if (!tab) {
    return {
      status: 'no-tab',
      availableTabs: tabs.map(t => t.name),
      fetchedAt: Date.now()
    };
  }

  const res = await fetch(csvUrl(tab.gid), { cache: 'no-store' });
  if (!res.ok) throw new Error(`ดึงข้อมูลแท็บ "${tab.name}" ไม่สำเร็จ (HTTP ${res.status})`);
  const csv = await res.text();

  const parsed = parseSheetCsv(csv);

  // กันกรณีชื่อแท็บกับเนื้อในไม่ตรงกัน จะได้ไม่เอาข้อมูลเดือนอื่นมาทับ
  if (parsed.label && (parsed.label.year !== year || parsed.label.month !== month)) {
    throw new Error(
      `แท็บ "${tab.name}" มีข้อมูลของเดือน ${parsed.label.month}/${parsed.label.year} ไม่ตรงกับเดือนที่เลือก`
    );
  }

  const built = buildScheduleFromSheet(parsed, staffList, daysCount);

  return {
    status: 'ok',
    tabName: tab.name,
    fetchedAt: Date.now(),
    sheetDays: parsed.dayColumns.length,
    ...built
  };
}
