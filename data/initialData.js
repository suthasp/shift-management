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
  }
};

export const INITIAL_STAFF = [
  {
    id: 1,
    empCode: 'DC-001',
    name: 'ธีระกิจ พรมตุ้ม',
    position: 'Senior DC Operations Specialist',
    phone: '081-456-7890',
    minRestHours: 12
  },
  {
    id: 2,
    empCode: 'DC-002',
    name: 'วรพงษ์ ริมสกุล',
    position: 'DC Facilities Lead Engineer',
    phone: '082-567-8901',
    minRestHours: 12
  },
  {
    id: 3,
    empCode: 'DC-003',
    name: 'กฤษณพน จตุรบูรณ์',
    position: 'NOC & Network Systems Engineer',
    phone: '083-678-9012',
    minRestHours: 12
  },
  {
    id: 4,
    empCode: 'DC-004',
    name: 'สิทธิชัย ตั้งจิตอัจนา',
    position: 'Systems & Server Operator',
    phone: '084-789-0123',
    minRestHours: 12
  },
  {
    id: 5,
    empCode: 'DC-005',
    name: 'ไพศาล เกรียงไกรวิท',
    position: 'DC Infrastructure Specialist',
    phone: '085-890-1234',
    minRestHours: 12
  },
  {
    id: 6,
    empCode: 'DC-006',
    name: 'ภูชิต แสงสวรรค์',
    position: 'NOC Monitoring Specialist',
    phone: '086-901-2345',
    minRestHours: 12
  },
  {
    id: 7,
    empCode: 'DC-007',
    name: 'ดุลยกิตต์ อุทิตะสาร',
    position: 'DC Operations Staff',
    phone: '087-012-3456',
    minRestHours: 12
  },
  {
    id: 8,
    empCode: 'DC-008',
    name: 'วินัย แสงใส',
    position: 'DC Operations Staff',
    phone: '088-123-4567',
    minRestHours: 12
  },
  {
    id: 9,
    empCode: 'DC-009',
    name: 'พีระเดช ป้องภัย',
    position: 'DC Operations Staff',
    phone: '089-234-5678',
    minRestHours: 12
  }
];

// Initial schedule from the user's spreadsheet image for October (31 days)
export const INITIAL_OCTOBER_ROSTER = {
  1: ['1','1','1','H','H','1','1','1','1','1','H','H','H','1','1','1','1','H','H','1','1','1','H','1','H','H','1','1','1','1','1'],
  2: ['1','1','1','H','H','1','1','1','1','1','H','H','H','1','1','1','1','H','H','1','1','1','H','1','H','H','1','1','1','1','1'],
  3: ['2','H','2','2','2','2','H','1','1','1','1','2','3','H','1','1','1','H','H','1','2','2','3','3','H','H','1','1','2','2','2'],
  4: ['3','3','3','H','3','3','3','3','3','H','3','3','H','3','H','1','1','1','1','1','H','H','1','2','2','2','3','H','1','1','1'],
  5: ['H','2','2','2','2','H','1','1','1','3','H','1','1','1','3','3','H','3','3','3','3','3','H','1','3','3','3','H','3','H','H'],
  6: ['3','3','H','H','1','1','2','2','H','1','3','3','3','3','3','H','H','2','2','2','H','2','H','1','1','2','2','H','3','3','H'],
  7: ['H','2','3','3','H','1','1','H','2','2','2','H','1','1','1','2','2','1','2','2','2','2','3','H','2','H','H','1','2','2','H'],
  8: ['1','1','H','1','1','2','2','2','H','H','1','1','2','2','H','H','2','2','3','3','3','H','3','3','3','3','H','3','H','1','3'],
  9: ['1','1','1','1','H','H','3','3','3','3','H','H','2','2','2','2','3','H','1','H','1','1','2','H','1','1','2','3','3','3','H']
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
    '1': 2, // Morning min 2
    '2': 2, // Afternoon min 2
    '3': 2  // Night min 2
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
