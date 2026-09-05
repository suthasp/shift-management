'use client';

import React, { useState } from 'react';
import { ArrowLeftRight, X, AlertTriangle, CheckCircle2, User } from 'lucide-react';
import { SHIFT_TYPES, THAI_MONTHS } from '../data/initialData';

export function ShiftSwapModal({
  isOpen,
  onClose,
  staffList,
  schedule,
  daysCount,
  month,
  year,
  onConfirmSwap
}) {
  if (!isOpen) return null;

  const [staffAId, setStaffAId] = useState(staffList[0]?.id || 1);
  const [dayA, setDayA] = useState(0); // 0-indexed

  const [staffBId, setStaffBId] = useState(staffList[1]?.id || 2);
  const [dayB, setDayB] = useState(0); // 0-indexed

  const staffA = staffList.find(s => s.id === Number(staffAId));
  const staffB = staffList.find(s => s.id === Number(staffBId));

  const shiftA = schedule[staffAId]?.[dayA] || 'H';
  const shiftB = schedule[staffBId]?.[dayB] || 'H';

  const shiftInfoA = SHIFT_TYPES[shiftA] || SHIFT_TYPES['H'];
  const shiftInfoB = SHIFT_TYPES[shiftB] || SHIFT_TYPES['H'];

  // Validation
  const isSamePersonSameDay = staffAId === staffBId && dayA === dayB;
  const isIdenticalShift = shiftA === shiftB;

  const handleSwap = () => {
    if (isSamePersonSameDay) return;
    onConfirmSwap({
      staffAId: Number(staffAId),
      dayA,
      shiftA,
      staffBId: Number(staffBId),
      dayB,
      shiftB
    });
    onClose();
  };

  return (
    <div className="shift-picker-overlay" onClick={onClose}>
      <div className="shift-picker-card" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <h3>
            <ArrowLeftRight size={20} color="var(--accent-cyan)" />
            <span>ระบบขอสลับ / แลกกะปฏิบัติงาน</span>
          </h3>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
            เลือกเจ้าหน้าที่และวันที่ต้องการสลับกะ ระบบจะตรวจสอบผลกระทบต่อความพร้อม 24/7 โดยอัตโนมัติ
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '1rem', alignItems: 'center' }}>
            {/* Person A */}
            <div style={{ background: 'var(--bg-surface-elevated)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent-cyan)', display: 'block', marginBottom: 6 }}>
                เจ้าหน้าที่คนที่ 1
              </label>
              <select
                className="form-control"
                value={staffAId}
                onChange={e => setStaffAId(Number(e.target.value))}
                style={{ marginBottom: 8 }}
              >
                {staffList.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>

              <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                วันที่ต้องการแลก:
              </label>
              <select
                className="form-control"
                value={dayA}
                onChange={e => setDayA(Number(e.target.value))}
              >
                {Array.from({ length: daysCount }, (_, i) => (
                  <option key={i} value={i}>วันที่ {i + 1} {THAI_MONTHS[month - 1]}</option>
                ))}
              </select>

              {/* Current Shift Badge */}
              <div style={{ marginTop: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className={`shift-tag tag-${shiftA.toLowerCase()}`}>{shiftA}</span>
                <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{shiftInfoA.name}</span>
              </div>
            </div>

            {/* Swap Icon */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--bg-surface-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-color)' }}>
                <ArrowLeftRight size={18} color="var(--accent-cyan)" />
              </div>
            </div>

            {/* Person B */}
            <div style={{ background: 'var(--bg-surface-elevated)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent-purple)', display: 'block', marginBottom: 6 }}>
                เจ้าหน้าที่คนที่ 2
              </label>
              <select
                className="form-control"
                value={staffBId}
                onChange={e => setStaffBId(Number(e.target.value))}
                style={{ marginBottom: 8 }}
              >
                {staffList.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>

              <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                วันที่ต้องการแลก:
              </label>
              <select
                className="form-control"
                value={dayB}
                onChange={e => setDayB(Number(e.target.value))}
              >
                {Array.from({ length: daysCount }, (_, i) => (
                  <option key={i} value={i}>วันที่ {i + 1} {THAI_MONTHS[month - 1]}</option>
                ))}
              </select>

              {/* Current Shift Badge */}
              <div style={{ marginTop: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className={`shift-tag tag-${shiftB.toLowerCase()}`}>{shiftB}</span>
                <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{shiftInfoB.name}</span>
              </div>
            </div>
          </div>

          {/* Validation Feedback */}
          <div style={{ marginTop: '1.25rem' }}>
            {isSamePersonSameDay ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#ef4444', fontSize: '0.85rem' }}>
                <AlertTriangle size={16} />
                <span>ไม่สามารถสลับกะของคนเดียวกันในวันเดียวกันได้</span>
              </div>
            ) : isIdenticalShift ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#f59e0b', fontSize: '0.85rem' }}>
                <AlertTriangle size={16} />
                <span>ทั้งสองคนมีกะเดียวกัน ({shiftA}) อยู่แล้ว</span>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--accent-emerald)', fontSize: '0.85rem' }}>
                <CheckCircle2 size={16} />
                <span>พร้อมสลับ: <strong>{staffA?.name}</strong> จะได้กะ <strong>{shiftB}</strong> และ <strong>{staffB?.name}</strong> จะได้กะ <strong>{shiftA}</strong></span>
              </div>
            )}
          </div>

          {/* Action Footer */}
          <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button className="btn btn-secondary" onClick={onClose}>
              ยกเลิก
            </button>
            <button
              className="btn btn-primary"
              disabled={isSamePersonSameDay}
              onClick={handleSwap}
            >
              ยืนยันการสลับกะ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
