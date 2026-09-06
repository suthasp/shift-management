# CNO Shift Manager | ระบบจัดการตารางกะศูนย์ข้อมูล 24/7 (Next.js + Netlify)

เว็บแอปพลิเคชันสำหรับการกำหนดและบริหารจัดการตารางกะเจ้าหน้าที่ศูนย์ข้อมูล (Data Center 24/7 Operations) พร้อมระบบตรวจสอบความพร้อม กำกับสุขอนามัยการทำงาน และจัดกะอัตโนมัติ

## 🚀 ฟีเจอร์หลัก
- **ตารางกะ Interactive 31 วัน**: แสดงผลและแก้ไขกะได้รวดเร็ว (คลิกเลือก หรือกดปุ่ม 1, 2, 3, A, H, Del)
- **ชุดสีมาตรฐานตามเอกสาร**:
  - `1`: กะเช้า (07:00 - 16:00) - สีฟ้า
  - `2`: กะบ่าย (15:00 - 24:00) - สีเขียว
  - `3`: กะดึก (23:00 - 08:00) - สีชมพู
  - `A`: กะปกติ (08:00 - 17:00) - สีส้ม
  - `H`: วันหยุด (Holiday / Day Off) - สีเหลือง
- **Daily 24/7 Coverage Monitor**: ตรวจนับจำนวนคนต่อกะแบบเรียลไทม์ พร้อมเตือนทันทีหากกะใดขาดคน
- **Fatigue & Compliance Guard**: ตรวจจับกะดึกต่อกะเช้าทันที หรือการทำงานต่อเนื่องเกิน 6 วัน
- **Smart Auto-Scheduler**: ปลั๊กอินจัดกะอัตโนมัติ 24/7 กระจายวันหยุดและกะดึกอย่างสมดุล
- **Shift Swap Assistant**: ระบบขอสลับกะระหว่างเจ้าหน้าที่
- **Analytics & Allowance**: คำนวณชั่วโมงทำงานรวมและค่าตอบแทนกะดึก
- **Export Excel & Print**: ส่งออกเป็นไฟล์ `.xlsx` และโหมดสั่งพิมพ์หน้ากระดาษ A4 แนวนอน

---

## 💻 การติดตั้งและรันในเครื่อง (Local Development)

```bash
# ติดตั้ง dependencies
npm install

# รัน Development Server
npm run dev
```
เปิดเบราว์เซอร์ไปที่: `http://localhost:3000`

---

## 📦 การ Build และ Deploy บน Netlify

โปรเจกต์นี้ตั้งค่าเป็น **Next.js Static Export (`output: 'export'`)** ซึ่งจะ Build เป็นไฟล์ Static HTML/JS/CSS ในโฟลเดอร์ `out/` ทำให้รันบน Netlify ได้อย่างรวดเร็วและไม่มีค่าใช้จ่าย Serverless

```bash
# คำสั่ง Build
npm run build
```

### การ Deploy บน Netlify:
1. **ผ่าน Netlify Drop**: นำโฟลเดอร์ `out/` ไปวางที่ [https://app.netlify.com/drop](https://app.netlify.com/drop)
2. **ผ่าน Git**: เชื่อมต่อ Git Repository กับ Netlify ระบบจะอ่านการตั้งค่าจาก `netlify.toml` และ Deploy ให้อัตโนมัติ
