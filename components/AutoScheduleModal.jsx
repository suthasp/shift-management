'use client';

import React, { useState } from 'react';
import { Wand2, X, ShieldAlert, Check, Sparkles, Sliders, RefreshCw } from 'lucide-react';
import confetti from 'canvas-confetti';

export function AutoScheduleModal({
  isOpen,
  onClose,
  onGenerateSchedule,
  defaultMinStaff = { '1': 1, '2': 2, '3': 2 }
}) {
  if (!isOpen) return null;

  const [minMorning, setMinMorning] = useState(defaultMinStaff['1'] || 1);
  const [minAfternoon, setMinAfternoon] = useState(defaultMinStaff['2'] || 2);
  const [minNight, setMinNight] = useState(defaultMinStaff['3'] || 2);

  const [fixStaffA, setFixStaffA] = useState(true);
  const [restAfterNight, setRestAfterNight] = useState(true);
  const [maxConsecutiveDays, setMaxConsecutiveDays] = useState(6);

  const handleGenerate = () => {
    onGenerateSchedule({
      minPerShift: {
        '1': Number(minMorning),
        '2': Number(minAfternoon),
        '3': Number(minNight)
      },
      fixStaffA,
      restAfterNight,
      maxConsecutiveDays: Number(maxConsecutiveDays)
    });

    // Celebrate with confetti
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (e) {
      // ignore
    }

    onClose();
  };

  return (
    <div className="shift-picker-overlay" onClick={onClose}>
      <div className="shift-picker-card" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <h3>
            <Wand2 size={20} color="var(--accent-purple)" />
            <span>จัดตารางกะอัตโนมัติ 24/7 (Smart Auto-Assign)</span>
          </h3>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
            อัลกอริทึมจะจัดสรรเจ้าหน้าที่ให้ครอบคลุมตลอด 24 ชั่วโมง โดยคำนึงถึงสุขอนามัยการพักผ่อน และกระจายกะดึกกับวันหยุดอย่างเป็นธรรม
          </p>

          {/* Min Staff Settings */}
          <div style={{ background: 'var(--bg-surface-elevated)', padding: '1.15rem', borderRadius: '10px', border: '1px solid var(--border-color)', marginBottom: '1.25rem' }}>
            <h4 style={{ fontSize: '0.88rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Sliders size={16} color="var(--accent-cyan)" />
              <span>เกณฑ์จำนวนเจ้าหน้าที่ขั้นต่ำต่อกะ (Coverage SLA)</span>
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: '0.78rem' }}>กะเช้า (1):</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  className="form-control"
                  value={minMorning}
                  onChange={e => setMinMorning(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: '0.78rem' }}>กะบ่าย (2):</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  className="form-control"
                  value={minAfternoon}
                  onChange={e => setMinAfternoon(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: '0.78rem' }}>กะดึก (3):</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  className="form-control"
                  value={minNight}
                  onChange={e => setMinNight(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Fatigue & Health Rules */}
          <div style={{ background: 'var(--bg-surface-elevated)', padding: '1.15rem', borderRadius: '10px', border: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
            <h4 style={{ fontSize: '0.88rem', fontWeight: 700, marginBottom: '0.75rem' }}>
              กฎการพักผ่อนและความปลอดภัย (Compliance Rules)
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.82rem', cursor: 'pointer', color: 'var(--accent-cyan)' }}>
                <input
                  type="checkbox"
                  checked={fixStaffA}
                  onChange={e => setFixStaffA(e.target.checked)}
                  style={{ accentColor: 'var(--accent-cyan)' }}
                />
                <strong>ธีระกิจ พรมตุ้ม & วรพงษ์ ริมสกุล ยืนประจำกะ A (จันทร์-ศุกร์)</strong>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.82rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={restAfterNight}
                  onChange={e => setRestAfterNight(e.target.checked)}
                  style={{ accentColor: 'var(--accent-purple)' }}
                />
                <span>หลังออกกะดึก (3) ต้องได้วันหยุดพักผ่อน (H) ในวันถัดไปทันที</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.82rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={true}
                  disabled
                  style={{ accentColor: 'var(--accent-purple)' }}
                />
                <span>ห้ามจัดกะดึก (3) ต่อด้วยกะเช้า (1) ทันทีเด็ดขาด (ป้องกันการหลับใน)</span>
              </label>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.82rem', marginTop: 4 }}>
                <span>ทำงานติดต่อกันไม่เกิน:</span>
                <input
                  type="number"
                  min="4"
                  max="7"
                  className="form-control"
                  style={{ width: 65, height: 28, padding: '2px 6px' }}
                  value={maxConsecutiveDays}
                  onChange={e => setMaxConsecutiveDays(e.target.value)}
                />
                <span>วัน แล้วต้องมีวันหยุด</span>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button className="btn btn-secondary" onClick={onClose}>
              ยกเลิก
            </button>
            <button className="btn btn-auto-magic" onClick={handleGenerate}>
              <Sparkles size={16} />
              <span>ประมวลผลจัดกะทันที</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
