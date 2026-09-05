'use client';

import React from 'react';
import { SHIFT_TYPES, THAI_DAYS_FULL, THAI_MONTHS } from '../data/initialData';
import { getDayOfWeek } from '../utils/schedulerEngine';
import { X, Calendar, User, ArrowRight, Check } from 'lucide-react';

export function ShiftPickerModal({
  isOpen,
  onClose,
  target, // { staffId, dayIndex }
  staffList,
  schedule,
  year,
  month,
  daysCount,
  onSelectShift,
  onBatchApply
}) {
  if (!isOpen || !target) return null;

  const staff = staffList.find(s => s.id === target.staffId);
  if (!staff) return null;

  const currentShift = schedule[target.staffId]?.[target.dayIndex] || 'H';
  const dayNum = target.dayIndex + 1;
  const dow = getDayOfWeek(year, month, dayNum);

  const availableShifts = ['1', '2', '3', 'HT1', 'HT2', 'HT3', 'A', 'H', 'L', 'V'];

  return (
    <div className="shift-picker-overlay" onClick={onClose}>
      <div className="shift-picker-card" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div>
            <h3>
              <span>กำหนดกะการทำงาน</span>
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>
              <User size={13} style={{ display: 'inline', marginRight: 4 }} />
              <strong>{staff.name}</strong> • วัน{THAI_DAYS_FULL[dow]}ที่ {dayNum} {THAI_MONTHS[month - 1]}
            </p>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, display: 'block' }}>
            เลือกรหัสกะที่ต้องการ:
          </label>

          <div className="shift-options-grid">
            {availableShifts.map((code) => {
              const shift = SHIFT_TYPES[code];
              if (!shift) return null;
              const isSelected = currentShift === code;

              return (
                <button
                  key={code}
                  className="shift-option-btn"
                  style={{
                    borderColor: isSelected ? 'var(--accent-cyan)' : undefined,
                    boxShadow: isSelected ? '0 0 10px rgba(0, 229, 255, 0.25)' : undefined
                  }}
                  onClick={() => {
                    onSelectShift(target.staffId, target.dayIndex, code);
                    onClose();
                  }}
                >
                  <span className={`shift-tag tag-${code.toLowerCase()}`}>
                    {code}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div className="shift-option-title">{shift.name}</div>
                    <div className="shift-option-time">{shift.timeRange}</div>
                  </div>
                  {isSelected && (
                    <Check size={16} color="var(--accent-cyan)" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick Batch Options */}
          <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, display: 'block' }}>
              การลงกะเป็นชุด (Quick Fill):
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                className="btn btn-secondary"
                style={{ fontSize: '0.78rem' }}
                onClick={() => {
                  onBatchApply(target.staffId, target.dayIndex, Math.min(target.dayIndex + 3, daysCount - 1), currentShift);
                  onClose();
                }}
              >
                ลงกะนี้ต่อเนื่อง 4 วัน
              </button>
              <button
                className="btn btn-secondary"
                style={{ fontSize: '0.78rem' }}
                onClick={() => {
                  onBatchApply(target.staffId, target.dayIndex, Math.min(target.dayIndex + 6, daysCount - 1), currentShift);
                  onClose();
                }}
              >
                ลงกะนี้ตลอด 7 วัน
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
