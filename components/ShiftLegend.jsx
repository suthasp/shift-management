'use client';

import React from 'react';
import { SHIFT_TYPES } from '../data/initialData';
import { Info, Paintbrush } from 'lucide-react';

export function ShiftLegend({ activeBrush, setActiveBrush }) {
  const legendItems = ['A', '1', '2', '3', 'H', 'L', 'V'];

  return (
    <div className="legend-card no-print">
      <div className="legend-title">
        <Info size={16} color="var(--accent-cyan)" />
        <span>รหัสกะ & เวลาปฏิบัติงาน (8 ชม. / กะ)</span>
      </div>

      <div className="legend-items">
        {legendItems.map((code) => {
          const shift = SHIFT_TYPES[code];
          if (!shift) return null;
          const isBrushActive = activeBrush === code;

          return (
            <div
              key={code}
              className="legend-chip"
              style={{
                borderColor: isBrushActive ? 'var(--accent-cyan)' : undefined,
                background: isBrushActive ? 'var(--bg-surface-hover)' : undefined,
                cursor: 'pointer'
              }}
              onClick={() => setActiveBrush(isBrushActive ? null : code)}
              title={`${shift.name}\n⏰ เวลาปฏิบัติงาน: ${shift.timeRange} น. (${shift.durationHours} ชม.)\n📝 ${shift.description}\n\n${isBrushActive ? '👉 คลิกเพื่อยกเลิกพู่กันเทสี' : '👉 คลิกเพื่อเลือกใช้พู่กันเทสีกะนี้'}`}
            >
              <span className={`shift-tag tag-${code.toLowerCase()}`}>
                {code}
              </span>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                  {shift.name.split(' (')[0]}
                </span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  {shift.timeRange}
                </span>
              </div>
              {isBrushActive && (
                <Paintbrush size={12} color="var(--accent-cyan)" style={{ marginLeft: 4 }} />
              )}
            </div>
          );
        })}
      </div>

      {activeBrush && (
        <div style={{ fontSize: '0.78rem', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Paintbrush size={13} />
          <span>กำลังเปิดโหมดพู่กัน: คลิกช่องเพื่อลงกะ <strong>{activeBrush}</strong></span>
          <button 
            className="btn btn-secondary" 
            style={{ padding: '2px 6px', fontSize: '0.7rem' }}
            onClick={() => setActiveBrush(null)}
          >
            ปิด
          </button>
        </div>
      )}
    </div>
  );
}
