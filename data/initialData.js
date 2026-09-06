export const SHIFT_TYPES = {
  '1': {
    code: '1',
    name: 'กะเช้า (Morning)',
    timeRange: '07:00 - 16:00',
    durationHours: 8,
    overlapHours: 1,
    bgColor: '#00e5ff',
    textColor: '#0f172a',
    badgeClass: 'shift-1',
    isWork: true,
    isNight: false,
    description: 'ดูแลความเรียบร้อยรอบเช้า ตรวจเช็คระบบ Facility ประจำวัน'
  },
  '2': {
    code: '2',
    name: 'กะบ่าย (Afternoon)',
    timeRange: '15:00 - 24:00',
    durationHours: 8,
    overlapHours: 1,
    bgColor: '#00e676',
    textColor: '#0f172a',
    badgeClass: 'shift-2',
    isWork: true,
    isNight: false,
    description: 'รองรับงาน Peak Time, แก้ไขเหตุขัดข้องรอบบ่ายค่ำ'
  },
  '3': {
    code: '3',
    name: 'กะดึก (Night)',
    timeRange: '23:00 - 08:00',
    durationHours: 8,
    overlapHours: 1,
    bgColor: '#ffb2dd',
    textColor: '#0f172a',
    badgeClass: 'shift-3',
    isWork: true,
    isNight: true,
    description: 'ดูแลความต่อเนื่องรอบดึก หน้าต่าง Maintenance Window สำคัญ'
  },
  'A': {
    code: 'A',
    name: 'กะปกติ (Admin / Office)',
    timeRange: '08:00 - 17:00',
    durationHours: 8,
    overlapHours: 0,
    bgColor: '#ffb74d',
    textColor: '#0f172a',
    badgeClass: 'shift-a',
    isWork: true,
    isNight: false,
    description: 'เวลาทำการปกติ งานบริหาร งานเอกสารและประสานงานผู้รับเหมา'
  },
  'H': {
    code: 'H',
    name: 'วันหยุด (Holiday / Off)',
    timeRange: 'พักผ่อน',
    durationHours: 0,
    overlapHours: 0,
    bgColor: '#ffeb3b',
    textColor: '#0f172a',
    badgeClass: 'shift-h',
    isWork: false,
    isNight: false,
    description: 'วันหยุดประจำสัปดาห์ / วันหยุดชดเชย'
  },
  'L': {
    code: 'L',
    name: 'ลาป่วย / ลากิจ (Leave)',
    timeRange: 'ลางาน',
    durationHours: 0,
    overlapHours: 0,
    bgColor: '#b0bec5',
    textColor: '#0f172a',
    badgeClass: 'shift-l',
    isWork: false,
    isNight: false,
    description: 'ลากิจ / ลาป่วยตามสิทธิ'
  },
  'V': {
    code: 'V',
    name: 'ลาพักร้อน (Vacation)',
    timeRange: 'พักผ่อนประจำปี',
    durationHours: 0,
    overlapHours: 0,
    bgColor: '#80cbc4',
    textColor: '#0f172a',
    badgeClass: 'shift-v',
    isWork: false,
    isNight: false,
    description: 'ลาพักผ่อนประจำปีที่ได้รับการอนุมัติ'
  },
  'HT1': {
    code: 'HT1',
    name: 'OT กะเช้า (Norm H)',
    timeRange: '07:00 - 16:00',
    durationHours: 8,
    overlapHours: 1,
    bgColor: '#00b050',
    textColor: '#ffffff',
    badgeClass: 'shift-ht1',
    isWork: true,
    isOT: true,
    baseShift: '1',
    isNight: false,
    description: 'วันหยุดปกติ (Key Norm เป็น H) แต่มาปฏิบัติงานกะเช้าเพื่อเบิก OT'
  },
  'HT2': {
    code: 'HT2',
    name: 'OT กะบ่าย (Norm H)',
    timeRange: '15:00 - 24:00',
    durationHours: 8,
    overlapHours: 1,
    bgColor: '#00b050',
    textColor: '#ffffff',
    badgeClass: 'shift-ht2',
    isWork: true,
    isOT: true,
    baseShift: '2',
    isNight: false,
    description: 'วันหยุดปกติ (Key Norm เป็น H) แต่มาปฏิบัติงานกะบ่ายเพื่อเบิก OT'
  },
  'HT3': {
    code: 'HT3',
    name: 'OT กะดึก (Norm H)',
    timeRange: '23:00 - 08:00',
    durationHours: 8,
    overlapHours: 1,
    bgColor: '#00b050',
    textColor: '#ffffff',
    badgeClass: 'shift-ht3',
    isWork: true,
    isOT: true,
    baseShift: '3',
    isNight: true,
    description: 'วันหยุดปกติ (Key Norm เป็น H) แต่มาปฏิบัติงานกะดึกเพื่อเบิก OT'
  }
};

export const OT_CLAIM_RULES = [
  {
    type: 'OT วันทำงาน',
    condition: 'ทำงานต่อเนื่องก่อน/หลังกะปกติ (8 ชม.)',
    rate: '1.5 แรง',
    multiplier: 1.5,
    description: 'ทำงานเกินเวลาในวันทำงานปกติ'
  },
  {
    type: 'OT วันหยุด (ตรง NORM)',
    condition: 'ตรงกับตารางกะปกติเดิม',
    rate: '1 แรง',
    multiplier: 1.0,
    description: 'ทำงานในวันหยุดตามตารางกะปกติเดิม (เช่น HT1, HT2, HT3)'
  },
  {
    type: 'OT วันหยุด (ไม่ตรง NORM)',
    condition: 'ไม่ตรงกับตารางกะปกติเดิม',
    rate: '3 แรง',
    multiplier: 3.0,
    description: 'ทำงานในวันหยุดที่ไม่ตรงกับรอบกะปกติ'
  },
  {
    type: 'OT วันหยุดนักขัตฤกษ์',
    condition: '8 ชั่วโมงแรก (กะปกติ)',
    rate: '1 แรง',
    multiplier: 1.0,
    description: 'ปฏิบัติงานในวันหยุดนักขัตฤกษ์ 8 ชั่วโมงแรก'
  },
  {
    type: 'OT วันหยุดนักขัตฤกษ์',
    condition: 'ชั่วโมงถัดไป (ชั่วโมงที่ 9-11)',
    rate: '3 แรง',
    multiplier: 3.0,
    description: 'ปฏิบัติงานล่วงเวลาในวันหยุดนักขัตฤกษ์ตั้งแต่ชั่วโมงที่ 9 ขึ้นไป'
  },
  {
    type: 'OT วันหยุดนักขัตฤกษ์',
    condition: 'กรณีมีการแทรกกะ',
    rate: '1.5 แรง',
    multiplier: 1.5,
    description: 'กรณีแทรกกะพิเศษในวันหยุดนักขัตฤกษ์'
  }
];

export const INITIAL_STAFF = [
  {
    id: 1,
    empCode: 'CNO-001',
    name: 'ธีระกิจ พรมตุ้ม',
    position: 'Senior CNO Operations Specialist',
    phone: '081-456-7890',
    minRestHours: 12
  },
  {
    id: 2,
    empCode: 'CNO-002',
    name: 'วรพงษ์ ริมสกุล',
    position: 'CNO Facilities Lead Engineer',
    phone: '082-567-8901',
    minRestHours: 12
  },
  {
    id: 3,
    empCode: 'CNO-003',
    name: 'กฤษณพน จตุรบูรณ์',
    position: 'NOC & Network Systems Engineer',
    phone: '083-678-9012',
    minRestHours: 12
  },
  {
    id: 4,
    empCode: 'CNO-004',
    name: 'สิทธิชัย ตั้งจิตอัจนา',
    position: 'Systems & Server Operator',
    phone: '084-789-0123',
    minRestHours: 12
  },
  {
    id: 5,
    empCode: 'CNO-005',
    name: 'ไพศาล เกรียงไกรวิท',
    position: 'CNO Infrastructure Specialist',
    phone: '085-890-1234',
    minRestHours: 12
  },
  {
    id: 6,
    empCode: 'CNO-006',
    name: 'ภูชิต แสงสวรรค์',
    position: 'NOC Monitoring Specialist',
    phone: '086-901-2345',
    minRestHours: 12
  },
  {
    id: 7,
    empCode: 'CNO-007',
    name: 'ดุลยกิตต์ อุทิตะสาร',
    position: 'CNO Operations Staff',
    phone: '087-012-3456',
    minRestHours: 12
  },
  {
    id: 8,
    empCode: 'CNO-008',
    name: 'วินัย แสงใส',
    position: 'CNO Operations Staff',
    phone: '088-123-4567',
    minRestHours: 12
  },
  {
    id: 9,
    empCode: 'CNO-009',
    name: 'พีระเดช ป้องภัย',
    position: 'CNO Operations Staff',
    phone: '089-234-5678',
    minRestHours: 12
  }
];

// Initial schedule for October (31 days)
// Staff 1 (ธีระกิจ): ยืนประจำกะ A วันทำงาน (จ.-ศ.), หยุด (H) เสาร์-อาทิตย์
// Staff 2 (วรพงษ์): ยืนประจำกะ 1 วันทำงาน (จ.-ศ.), หยุด (H) เสาร์-อาทิตย์
// Staff 3 to 9 (7 operators): 7x24 Rotating Shift Cycle: Shift 1 = 1 person, Shift 2 = 2 persons, Shift 3 = 2 persons, Day Off H = 2 persons
export const INITIAL_OCTOBER_ROSTER = {
  // 1. ธีระกิจ พรมตุ้ม (กะ A วันทำงาน จ.-ศ., H วันหยุด ส.-อา.)
  1: ['A','A','H','H','A','A','A','A','A','H','H','A','A','A','A','A','H','H','A','A','A','A','A','H','H','A','A','A','A','A','H'],
  // 2. วรพงษ์ ริมสกุล (กะ 1 วันทำงาน จ.-ศ., H วันหยุด ส.-อา.)
  2: ['1','1','H','H','1','1','1','1','1','H','H','1','1','1','1','1','H','H','1','1','1','1','1','H','H','1','1','1','1','1','H'],
  // 3. กฤษณพน จตุรบูรณ์ (Offset 0)
  3: ['1','2','2','3','3','H','H','1','2','2','3','3','H','H','1','2','2','3','3','H','H','1','2','2','3','3','H','H','1','2','2'],
  // 4. สิทธิชัย ตั้งจิตอัจนา (Offset 1)
  4: ['2','2','3','3','H','H','1','2','2','3','3','H','H','1','2','2','3','3','H','H','1','2','2','3','3','H','H','1','2','2','3'],
  // 5. ไพศาล เกรียงไกรวิท (Offset 2)
  5: ['2','3','3','H','H','1','2','2','3','3','H','H','1','2','2','3','3','H','H','1','2','2','3','3','H','H','1','2','2','3','3'],
  // 6. ภูชิต แสงสวรรค์ (Offset 3)
  6: ['3','3','H','H','1','2','2','3','3','H','H','1','2','2','3','3','H','H','1','2','2','3','3','H','H','1','2','2','3','3','H'],
  // 7. ดุลยกิตต์ อุทิตะสาร (Offset 4)
  7: ['3','H','H','1','2','2','3','3','H','H','1','2','2','3','3','H','H','1','2','2','3','3','H','H','1','2','2','3','3','H','H'],
  // 8. วินัย แสงใส (Offset 5)
  8: ['H','H','1','2','2','3','3','H','H','1','2','2','3','3','H','H','1','2','2','3','3','H','H','1','2','2','3','3','H','H','1'],
  // 9. พีระเดช ป้องภัย (Offset 6)
  9: ['H','1','2','2','3','3','H','H','1','2','2','3','3','H','H','1','2','2','3','3','H','H','1','2','2','3','3','H','H','1','2']
};

export const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

export const THAI_DAYS_SHORT = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
export const THAI_DAYS_FULL = [
  'อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'
];

export const DC_SETTINGS_DEFAULT = {
  minStaffPerShift: {
    'A': 1, // ธีระกิจ ยืนกะ A วันทำงาน (จ.-ศ.)
    '1': 1, // Morning min 1 คน (วันทำงานจะมีวรพงษ์ยืนประจำ + หมุนเวียนอีกอย่างน้อย 1 คน)
    '2': 2, // Afternoon min 2 คน
    '3': 2  // Night min 2 คน
  },
  allowanceRates: {
    nightShiftRate: 300, // 300 THB per night shift
    weekendBonusRate: 150, // 150 THB extra for weekend work
    holidayBonusRate: 500  // 500 THB for public holiday work
  },
  complianceRules: {
    maxConsecutiveWorkDays: 6,
    maxConsecutiveNightShifts: 3,
    forbidNightToMorning: true, // กะดึกต่อกะเช้า
    minRestHoursBetweenShifts: 12
  }
};
