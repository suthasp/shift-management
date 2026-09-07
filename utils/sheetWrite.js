/**
 * ส่งการแก้ไขตารางกะจากเว็บแอปกลับไปเขียนลง Google Sheet
 * ผ่าน Google Apps Script Web App (โค้ดฝั่งสคริปต์อยู่ที่ apps-script/Code.gs)
 *
 * ทำไมต้องส่งเป็น text/plain:
 *   Apps Script ตอบ preflight (OPTIONS) ไม่ได้ ถ้าตั้ง Content-Type เป็น
 *   application/json เบราว์เซอร์จะยิง preflight ก่อนแล้วติด CORS ทันที
 *   แต่ text/plain นับเป็น "simple request" จึงข้าม preflight ไปได้
 *   ตัว body ยังเป็น JSON เหมือนเดิม ฝั่งสคริปต์อ่านจาก e.postData.contents
 */

const URL_KEY = 'dc_sheet_webapp_url';
const TOKEN_KEY = 'dc_sheet_webapp_token';

/**
 * อ่านค่าตั้งค่าปลายทาง
 * ลำดับความสำคัญ: ค่าที่ตั้งไว้ในแอป (localStorage) > ค่าจากตอน build (env)
 * ที่ให้ override ด้วย localStorage ได้ เพราะแอปนี้ deploy เป็น static export
 * ถ้าใช้ env อย่างเดียวจะต้อง build ใหม่ทุกครั้งที่เปลี่ยน URL ของ Apps Script
 */
export function getWriteConfig() {
  let url = process.env.NEXT_PUBLIC_SHEET_WEBAPP_URL || '';
  let token = process.env.NEXT_PUBLIC_SHEET_WEBAPP_TOKEN || '';

  if (typeof window !== 'undefined') {
    try {
      url = localStorage.getItem(URL_KEY) || url;
      token = localStorage.getItem(TOKEN_KEY) || token;
    } catch (e) {
      // localStorage ใช้ไม่ได้ (โหมดส่วนตัว ฯลฯ) ก็ใช้ค่าจาก env ต่อไป
    }
  }

  return { url: url.trim(), token: token.trim(), configured: Boolean(url.trim()) };
}

/** ตั้งค่า URL และ token จากในแอป ไม่ต้อง build ใหม่ */
export function setWriteConfig({ url, token }) {
  if (typeof window === 'undefined') return;
  try {
    if (url) localStorage.setItem(URL_KEY, url.trim());
    else localStorage.removeItem(URL_KEY);

    if (token) localStorage.setItem(TOKEN_KEY, token.trim());
    else localStorage.removeItem(TOKEN_KEY);
  } catch (e) {
    console.warn('LocalStorage error:', e);
  }
}

/**
 * ส่งรายการเซลล์ที่แก้ไปเขียนลงชีต
 *
 * @param {object}   p
 * @param {number}   p.year     ค.ศ.
 * @param {number}   p.month    1-12
 * @param {Array}    p.changes  [{ staffNo, staffName, day, code }]  day เริ่มที่ 1
 * @returns {Promise<{updated:number, sheet:string, skipped?:string[]}>}
 * @throws  ถ้าไม่ได้ตั้งค่า ปลายทางตอบไม่สำเร็จ หรือเขียนไม่ได้
 */
export async function pushChangesToSheet({ year, month, changes }) {
  const { url, token, configured } = getWriteConfig();
  if (!configured) {
    throw new Error('ยังไม่ได้ตั้งค่า URL ของ Apps Script (ดูวิธีติดตั้งใน apps-script/README.md)');
  }
  if (!changes || changes.length === 0) {
    return { updated: 0, sheet: null };
  }

  const res = await fetch(url, {
    method: 'POST',
    // ห้ามใส่ application/json เด็ดขาด จะติด CORS preflight
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ token, action: 'updateCells', year, month, changes }),
    redirect: 'follow'
  });

  if (!res.ok) {
    throw new Error(`เขียนลงชีตไม่สำเร็จ (HTTP ${res.status})`);
  }

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    // ถ้าได้ HTML กลับมา มักแปลว่า deployment ตั้งสิทธิ์ให้ต้องล็อกอิน
    throw new Error('ปลายทางไม่ได้ตอบเป็น JSON — ตรวจว่า deploy แบบ "Anyone" แล้วหรือยัง');
  }

  if (!data.ok) throw new Error(data.error || 'เขียนลงชีตไม่สำเร็จ');
  return { updated: data.updated, sheet: data.sheet, skipped: data.skipped };
}

/** เช็คว่าปลายทางพร้อมใช้งานไหม (เรียก doGet) */
export async function checkWriteEndpoint() {
  const { url, configured } = getWriteConfig();
  if (!configured) throw new Error('ยังไม่ได้ตั้งค่า URL ของ Apps Script');

  const res = await fetch(url, { method: 'GET', redirect: 'follow' });
  if (!res.ok) throw new Error(`ปลายทางตอบ HTTP ${res.status}`);

  const text = await res.text();
  try {
    const data = JSON.parse(text);
    if (!data.ok) throw new Error(data.error || 'ปลายทางไม่พร้อมใช้งาน');
    return data;
  } catch {
    throw new Error('ปลายทางไม่ได้ตอบเป็น JSON — ตรวจว่า deploy แบบ "Anyone" แล้วหรือยัง');
  }
}
