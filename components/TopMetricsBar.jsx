'use client';

import React from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  Users, 
  Clock, 
  Keyboard, 
  Moon, 
  Sparkles 
} from 'lucide-react';

export function TopMetricsBar({ 
  staffList, 
  dailyCoverage, 
  violationsMap, 
  totalShiftsCount,
  daysCount 
}) {
  // Count days with deficit (where any shift has 0 or below min)
  const deficitDays = dailyCoverage.filter(d => !d.isFullyStaffed);
  
  // Count total compliance violations
  let violationCount = 0;
  Object.values(violationsMap).forEach(staffViolations => {
    violationCount += Object.keys(staffViolations).length;
  });

  return (
    <div className="top-metric-bar no-print">
      <div className="top-metric-inner">
        {/* Status Badges */}
        <div className="dc-status-badges">
          {/* DC 24/7 Coverage Status */}
          <div className="status-badge-item">
            {deficitDays.length === 0 ? (
              <>
                <div className="status-dot-green" />
                <span>ความพร้อมศูนย์ข้อมูล: <strong>24/7 ครอบคลุมสมบูรณ์ 100%</strong></span>
              </>
            ) : (
              <>
                <AlertTriangle size={15} color="#ef4444" />
                <span style={{ color: '#ef4444' }}>
                  แจ้งเตือนความคุ้มครอง: <strong>พบกะขาดคน {deficitDays.length} วัน</strong>
                </span>
              </>
            )}
          </div>

          {/* Compliance Status */}
          <div className="status-badge-item">
            {violationCount === 0 ? (
              <>
                <ShieldCheck size={16} color="var(--accent-cyan)" />
                <span>สุขอนามัยการทำงาน: <strong>ผ่านเกณฑ์การพักผ่อน (ไม่มีกะชน)</strong></span>
              </>
            ) : (
              <>
                <AlertTriangle size={15} color="#f59e0b" />
                <span style={{ color: '#f59e0b' }}>
                  ข้อควรระวัง: <strong>{violationCount} จุด (กะดึกต่อเช้า/ทำงานเกิน 6 วัน)</strong>
                </span>
              </>
            )}
          </div>

          {/* Active Operators */}
          <div className="status-badge-item">
            <Users size={15} color="var(--text-muted)" />
            <span>กำลังพล: <strong>{staffList.length} คน</strong></span>
          </div>

          {/* Total Shifts */}
          <div className="status-badge-item">
            <Clock size={15} color="var(--text-muted)" />
            <span>เวลารวม: <strong>{(totalShiftsCount * 8).toLocaleString()} ชม.</strong></span>
          </div>
        </div>

        {/* Keyboard Quick Hint */}
        <div className="keyboard-hint">
          <Keyboard size={14} />
          <span>คีย์ลัด: เลือกช่องแล้วกด</span>
          <span className="kbd">1</span>
          <span className="kbd">2</span>
          <span className="kbd">3</span>
          <span className="kbd">A</span>
          <span className="kbd">H</span>
          <span>หรือ ดับเบิ้ลคลิก</span>
        </div>
      </div>
    </div>
  );
}
