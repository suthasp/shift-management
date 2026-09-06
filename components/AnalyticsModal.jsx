'use client';

import React, { useState } from 'react';
import { BarChart3, X, DollarSign, Clock, Moon, ShieldAlert, Award, Download } from 'lucide-react';
import { calculateStaffIncome } from '../utils/schedulerEngine';
import { THAI_MONTHS, OT_CLAIM_RULES, COMPENSATION_DEFAULT } from '../data/initialData';

const baht = (n) => n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const bahtInt = (n) => Math.round(n).toLocaleString('th-TH');

export function AnalyticsModal({
  isOpen,
  onClose,
  staffList,
  schedule,
  daysCount,
  year,
  month,
  settings
}) {
  if (!isOpen) return null;

  // อัตราค่าตอบแทน ปรับได้จากในหน้านี้ ตัวเลขคำนวณใหม่ทันทีจากตารางกะที่ซิงก์มาจาก Google Sheet
  const [salary, setSalary] = useState(COMPENSATION_DEFAULT.monthlySalary);
  const [hourlyRate, setHourlyRate] = useState(COMPENSATION_DEFAULT.hourlyRate);
  const [allow2, setAllow2] = useState(COMPENSATION_DEFAULT.shiftAllowance['2']);
  const [allow3, setAllow3] = useState(COMPENSATION_DEFAULT.shiftAllowance['3']);
  const [taxiRate, setTaxiRate] = useState(COMPENSATION_DEFAULT.taxiAllowance['2']);
  const [otMultiplier, setOtMultiplier] = useState(COMPENSATION_DEFAULT.otMultiplier);

  const compensation = {
    ...COMPENSATION_DEFAULT,
    monthlySalary: Number(salary) || 0,
    hourlyRate: Number(hourlyRate) || 0,
    shiftAllowance: { '1': 0, 'A': 0, '2': Number(allow2) || 0, '3': Number(allow3) || 0 },
    taxiAllowance: { '1': 0, 'A': 0, '2': Number(taxiRate) || 0, '3': Number(taxiRate) || 0 },
    otMultiplier: Number(otMultiplier) || 0
  };

  const income = calculateStaffIncome(schedule, staffList, daysCount, compensation);

  const sumOf = (key) => income.reduce((acc, s) => acc + s[key], 0);
  const totalDCHours = sumOf('workHours');
  const totalNightShifts = income.reduce((acc, s) => acc + s.counts['3'], 0);
  const totalOTShifts = sumOf('otShifts');
  const totalOTHours = sumOf('otHours');
  const totalSalary = sumOf('salary');
  const totalAllowance = sumOf('allowancePay');
  const totalTaxi = sumOf('taxiPay');
  const totalOTPay = sumOf('otPay');
  const totalPayroll = sumOf('totalIncome');
  const avgIncome = totalPayroll / (income.length || 1);

  // Calculate fairness: average night shifts per employee
  const avgNights = (totalNightShifts / (staffList.length || 1)).toFixed(1);

  return (
    <div className="shift-picker-overlay" onClick={onClose}>
      <div className="shift-picker-card" style={{ maxWidth: 1180 }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <h3>
            <BarChart3 size={20} color="var(--accent-cyan)" />
            <span>สถิติการปฏิบัติงาน & สรุปรายได้ ({THAI_MONTHS[month - 1]} {year + 543})</span>
          </h3>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {/* Top KPI Cards */}
          <div className="stats-grid">
            <div className="stat-box">
              <span className="stat-box-title">ชั่วโมงปฏิบัติงานรวมทั้ง CNO</span>
              <span className="stat-box-value" style={{ color: 'var(--accent-cyan)' }}>
                {totalDCHours.toLocaleString()} <span style={{ fontSize: '1rem' }}>ชม.</span>
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                รองรับงาน 24/7 ตลอดทั้งเดือน
              </span>
            </div>

            <div className="stat-box">
              <span className="stat-box-title">รวมกะดึก (23:00 - 08:00)</span>
              <span className="stat-box-value" style={{ color: '#ec4899' }}>
                {totalNightShifts} <span style={{ fontSize: '1rem' }}>กะ</span>
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                เฉลี่ยคนละ {avgNights} กะดึก/เดือน
              </span>
            </div>

            <div className="stat-box">
              <span className="stat-box-title">ค่ากะ + ค่าแท็กซี่รวม</span>
              <span className="stat-box-value" style={{ color: '#10b981' }}>
                {bahtInt(totalAllowance + totalTaxi)}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                ค่ากะ {bahtInt(totalAllowance)} + ค่าแท็กซี่ {bahtInt(totalTaxi)}
              </span>
            </div>

            <div className="stat-box">
              <span className="stat-box-title">รวมกะ OT (HT1, HT2, HT3)</span>
              <span className="stat-box-value" style={{ color: '#00e676' }}>
                {totalOTShifts} <span style={{ fontSize: '1rem' }}>กะ ({totalOTHours} ชม.)</span>
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                คิดเป็นเงิน {bahtInt(totalOTPay)} ที่ {otMultiplier} แรง
              </span>
            </div>

            <div className="stat-box">
              <span className="stat-box-title">รวมค่าใช้จ่ายบุคลากรทั้งเดือน</span>
              <span className="stat-box-value" style={{ color: '#f59e0b' }}>
                {bahtInt(totalPayroll)}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                เงินเดือน {bahtInt(totalSalary)} + ส่วนเพิ่ม {bahtInt(totalPayroll - totalSalary)} · เฉลี่ย {bahtInt(avgIncome)}/คน
              </span>
            </div>
          </div>

          {/* Allowance Rate Adjuster */}
          <div style={{ background: 'var(--bg-surface-elevated)', padding: '0.85rem 1.25rem', borderRadius: '10px', border: '1px solid var(--border-color)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <DollarSign size={16} color="var(--accent-cyan)" />
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>ปรับแต่งอัตราค่าตอบแทน (บาท):</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem', flexWrap: 'wrap' }}>
              {[
                { label: 'เงินเดือน', value: salary, set: setSalary, width: 100 },
                { label: 'ค่าแรง/ชม.', value: hourlyRate, set: setHourlyRate, width: 85, step: '0.1' },
                { label: 'ค่ากะบ่าย', value: allow2, set: setAllow2, width: 70 },
                { label: 'ค่ากะดึก', value: allow3, set: setAllow3, width: 70 },
                { label: 'ค่าแท็กซี่', value: taxiRate, set: setTaxiRate, width: 70 },
                { label: 'OT (แรง)', value: otMultiplier, set: setOtMultiplier, width: 70, step: '0.5' }
              ].map(f => (
                <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{f.label}:</label>
                  <input
                    type="number"
                    step={f.step || '1'}
                    className="form-control"
                    style={{ width: f.width, padding: '0.25rem 0.5rem', height: 32 }}
                    value={f.value}
                    onChange={e => f.set(e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>

          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '-0.75rem 0 1.25rem' }}>
            กะเช้า (1) และกะปกติ (A) ไม่มีค่ากะและค่าแท็กซี่ · กะบ่ายได้ค่าแท็กซี่กลับบ้าน กะดึกได้ค่าแท็กซี่มาทำงาน ·
            OT คิดเฉพาะกะ HT ที่ {hourlyRate} บาท/ชม. × 8 ชม. × {otMultiplier} แรง = {baht(Number(hourlyRate) * 8 * Number(otMultiplier))}/กะ ·
            วันลา (H/L/V) ไม่ได้ค่ากะและค่าแท็กซี่ แต่เงินเดือนเต็มจำนวน
          </p>

          {/* Breakdown Table */}
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            สรุปรายได้รายบุคคล (Staff Income Breakdown)
          </h4>

          <div style={{ overflowX: 'auto' }}>
            <table className="modal-data-table income-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>ชื่อเจ้าหน้าที่</th>
                  <th>ตำแหน่ง</th>
                  <th>กะเช้า (1)</th>
                  <th>กะบ่าย (2)</th>
                  <th>กะดึก (3)</th>
                  <th>กะ OT</th>
                  <th>ลา/หยุด</th>
                  <th>ชั่วโมงรวม</th>
                  <th>เงินเดือน</th>
                  <th>ค่ากะ</th>
                  <th>ค่าแท็กซี่</th>
                  <th>OT</th>
                  <th>รวมรับ</th>
                </tr>
              </thead>
              <tbody>
                {income.map((s, idx) => (
                  <tr key={s.staffId}>
                    <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{idx + 1}</td>
                    <td style={{ fontWeight: 600 }}>{s.name}</td>
                    <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.position}</td>
                    <td>{s.counts['1']}</td>
                    <td>{s.counts['2']}</td>
                    <td style={{ fontWeight: 700, color: '#ec4899' }}>{s.counts['3']}</td>
                    <td style={{ fontWeight: 700, color: s.otShifts > 0 ? '#00e676' : 'var(--text-muted)' }}>
                      {s.otShifts}
                    </td>
                    <td style={{ color: '#eab308' }}>{s.leaveDays}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                      {s.workHours} ชม.
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                      {bahtInt(s.salary)}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: '#10b981' }}>
                      {bahtInt(s.allowancePay)}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: '#38bdf8' }}>
                      {bahtInt(s.taxiPay)}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: s.otPay > 0 ? '#00e676' : 'var(--text-muted)' }}>
                      {bahtInt(s.otPay)}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#f59e0b' }}>
                      {baht(s.totalIncome)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: '2px solid var(--border-color)', fontWeight: 700 }}>
                  <td colSpan={3} style={{ textAlign: 'right' }}>รวมทั้งทีม {income.length} คน</td>
                  <td>{income.reduce((a, s) => a + s.counts['1'], 0)}</td>
                  <td>{income.reduce((a, s) => a + s.counts['2'], 0)}</td>
                  <td style={{ color: '#ec4899' }}>{totalNightShifts}</td>
                  <td style={{ color: '#00e676' }}>{totalOTShifts}</td>
                  <td style={{ color: '#eab308' }}>{income.reduce((a, s) => a + s.leaveDays, 0)}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>{totalDCHours} ชม.</td>
                  <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{bahtInt(totalSalary)}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', color: '#10b981' }}>{bahtInt(totalAllowance)}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', color: '#38bdf8' }}>{bahtInt(totalTaxi)}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', color: '#00e676' }}>{bahtInt(totalOTPay)}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', color: '#f59e0b' }}>{baht(totalPayroll)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* OT Claim Rules Section */}
          <div className="ot-rules-container" style={{ marginTop: '1.75rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>📋 เงื่อนไขการเบิกเงินค่าล่วงเวลา (OT Claim Conditions)</span>
              </h4>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                สรุปตามประกาศระเบียบการเบิกจ่ายค่าตอบแทนงานล่วงเวลา CNO
              </span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="ot-rules-table">
                <thead>
                  <tr>
                    <th style={{ width: 45 }}>ข้อ</th>
                    <th style={{ width: 130 }}>ลักษณะการทำงาน</th>
                    <th>เงื่อนไขการทำงาน</th>
                    <th style={{ width: 130 }}>อัตราค่าตอบแทน</th>
                    <th>รายละเอียดเพิ่มเติม</th>
                  </tr>
                </thead>
                <tbody>
                  {OT_CLAIM_RULES.map((rule, idx) => {
                    const badgeClass = rule.multiplier === 1.5 
                      ? 'ot-badge-15' 
                      : rule.multiplier === 3.0 
                      ? 'ot-badge-3' 
                      : 'ot-badge-1';
                    return (
                      <tr key={idx}>
                        <td style={{ textAlign: 'center', fontWeight: 700, color: 'var(--text-muted)' }}>
                          {idx + 1}
                        </td>
                        <td style={{ fontWeight: 600 }}>{rule.type}</td>
                        <td style={{ color: 'var(--text-secondary)' }}>{rule.condition}</td>
                        <td>
                          <span className={`ot-badge ${badgeClass}`}>
                            {rule.rate}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {rule.description}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer Action */}
          <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-secondary" onClick={onClose}>
              ปิดหน้าต่าง
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
