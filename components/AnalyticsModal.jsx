'use client';

import React, { useState } from 'react';
import { BarChart3, X, DollarSign, Clock, Moon, ShieldAlert, Award, Download } from 'lucide-react';
import { calculateStaffSummary } from '../utils/schedulerEngine';
import { THAI_MONTHS, OT_CLAIM_RULES } from '../data/initialData';

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

  const [nightRate, setNightRate] = useState(settings?.allowanceRates?.nightShiftRate || 300);
  const [weekendRate, setWeekendRate] = useState(settings?.allowanceRates?.weekendBonusRate || 150);

  const customSettings = {
    ...settings,
    allowanceRates: {
      nightShiftRate: Number(nightRate),
      weekendBonusRate: Number(weekendRate)
    }
  };

  const summary = calculateStaffSummary(schedule, staffList, daysCount, year, month, customSettings);

  const totalDCHours = summary.reduce((acc, s) => acc + s.totalHours, 0);
  const totalNightShifts = summary.reduce((acc, s) => acc + s.counts['3'], 0);
  const totalOTShifts = summary.reduce((acc, s) => acc + (s.totalOTShifts || 0), 0);
  const totalOTHours = summary.reduce((acc, s) => acc + (s.totalOTHours || 0), 0);
  const totalNightAllowance = summary.reduce((acc, s) => acc + s.nightShiftAllowance, 0);
  const totalWeekendAllowance = summary.reduce((acc, s) => acc + s.weekendAllowance, 0);
  const totalGrossAllowance = totalNightAllowance + totalWeekendAllowance;

  // Calculate fairness: average night shifts per employee
  const avgNights = (totalNightShifts / (staffList.length || 1)).toFixed(1);

  return (
    <div className="shift-picker-overlay" onClick={onClose}>
      <div className="shift-picker-card" style={{ maxWidth: 880 }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <h3>
            <BarChart3 size={20} color="var(--accent-cyan)" />
            <span>สถิติการปฏิบัติงาน & คำนวณเบี้ยเลี้ยง ({THAI_MONTHS[month - 1]} {year + 543})</span>
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
              <span className="stat-box-title">ประมาณการเบี้ยเลี้ยงกะดึกรวม</span>
              <span className="stat-box-value" style={{ color: '#10b981' }}>
                ฿{totalNightAllowance.toLocaleString()}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                อัตรา ฿{nightRate} / กะดึก
              </span>
            </div>

            <div className="stat-box">
              <span className="stat-box-title">รวมเบี้ยเลี้ยงพิเศษทั้งหมด</span>
              <span className="stat-box-value" style={{ color: '#f59e0b' }}>
                ฿{totalGrossAllowance.toLocaleString()}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                กะดึก + โบนัสวันเสาร์-อาทิตย์
              </span>
            </div>

            <div className="stat-box">
              <span className="stat-box-title">รวมกะ OT (HT1, HT2, HT3)</span>
              <span className="stat-box-value" style={{ color: '#00e676' }}>
                {totalOTShifts} <span style={{ fontSize: '1rem' }}>กะ ({totalOTHours} ชม.)</span>
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                ปฏิบัติงานแทนในวันหยุด (H)
              </span>
            </div>
          </div>

          {/* Allowance Rate Adjuster */}
          <div style={{ background: 'var(--bg-surface-elevated)', padding: '0.85rem 1.25rem', borderRadius: '10px', border: '1px solid var(--border-color)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <DollarSign size={16} color="var(--accent-cyan)" />
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>ปรับแต่งอัตราค่าตอบแทนพิเศษ (บาท):</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ค่ากะดึก:</label>
                <input
                  type="number"
                  className="form-control"
                  style={{ width: 90, padding: '0.25rem 0.5rem', height: 32 }}
                  value={nightRate}
                  onChange={e => setNightRate(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>กะวันหยุด:</label>
                <input
                  type="number"
                  className="form-control"
                  style={{ width: 90, padding: '0.25rem 0.5rem', height: 32 }}
                  value={weekendRate}
                  onChange={e => setWeekendRate(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Breakdown Table */}
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            ตารางสรุปรายบุคคล (Staff Breakdown)
          </h4>

          <div style={{ overflowX: 'auto' }}>
            <table className="modal-data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>ชื่อเจ้าหน้าที่</th>
                  <th>ตำแหน่ง</th>
                  <th>กะเช้า (1)</th>
                  <th>กะบ่าย (2)</th>
                  <th>กะดึก (3)</th>
                  <th>กะ OT</th>
                  <th>วันหยุด (H)</th>
                  <th>ชั่วโมงรวม</th>
                  <th>เสาร์-อาทิตย์</th>
                  <th>ค่ากะดึก</th>
                  <th>รวมเบี้ยเลี้ยง</th>
                </tr>
              </thead>
              <tbody>
                {summary.map((s, idx) => (
                  <tr key={s.staffId}>
                    <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{idx + 1}</td>
                    <td style={{ fontWeight: 600 }}>{s.name}</td>
                    <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.position}</td>
                    <td>{s.counts['1']}</td>
                    <td>{s.counts['2']}</td>
                    <td style={{ fontWeight: 700, color: '#ec4899' }}>{s.counts['3']}</td>
                    <td style={{ fontWeight: 700, color: (s.totalOTShifts || 0) > 0 ? '#00e676' : 'var(--text-muted)' }}>
                      {s.totalOTShifts || 0}
                    </td>
                    <td style={{ color: '#eab308' }}>{s.counts['H']}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                      {s.totalHours} ชม.
                    </td>
                    <td>{s.weekendShifts} วัน</td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: '#10b981' }}>
                      ฿{s.nightShiftAllowance.toLocaleString()}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#f59e0b' }}>
                      ฿{s.totalEstimatedAllowance.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
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
