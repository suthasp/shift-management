'use client';

import React from 'react';
import { Upload, Settings, RefreshCw, AlertTriangle, CloudUpload, Check } from 'lucide-react';

const timeText = (ts) => {
  if (!ts) return '';
  return new Date(ts).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
};

/**
 * สถานะการเขียนตารางกะกลับลง Google Sheet ผ่าน Apps Script
 * แสดงเฉพาะตอนที่มีอะไรให้ผู้ใช้รู้หรือให้กด ไม่รบกวนเวลาไม่มีอะไรเกิดขึ้น
 */
export function SheetWriteBadge({ state, onConfigure, onFlush }) {
  const { status, error, savedAt, pendingCount, unsavedCount } = state;

  const view = (() => {
    if (status === 'unconfigured') {
      return {
        icon: <Settings size={14} />,
        color: 'var(--text-secondary)',
        text: 'ตั้งค่าเขียนกลับชีต',
        hint: 'ยังไม่ได้ตั้งค่า Apps Script Web App\nกดเพื่อใส่ URL และ token (ดูวิธีติดตั้งใน apps-script/README.md)',
        onClick: onConfigure
      };
    }
    if (status === 'saving') {
      return {
        icon: <RefreshCw size={14} className="sheet-sync-spin" />,
        color: 'var(--accent-cyan)',
        text: `กำลังบันทึก ${pendingCount} ช่อง…`,
        hint: 'กำลังเขียนการแก้ไขลง Google Sheet',
        onClick: null
      };
    }
    if (status === 'error') {
      return {
        icon: <AlertTriangle size={14} />,
        color: 'var(--accent-rose)',
        text: 'บันทึกลงชีตไม่สำเร็จ',
        hint: `${error || 'ไม่ทราบสาเหตุ'}\nการแก้ไขยังอยู่ในแอปและยังไม่ถูกเขียนลงชีต\nกดเพื่อลองบันทึกใหม่`,
        onClick: onFlush
      };
    }
    if (unsavedCount > 0) {
      return {
        icon: <CloudUpload size={14} />,
        color: 'var(--accent-amber)',
        text: `ยังไม่ได้บันทึก ${unsavedCount} ช่อง`,
        hint: 'มีการแก้ไขในแอปที่ยังไม่ได้เขียนลงชีต\nกดเพื่อบันทึกลง Google Sheet ทันที',
        onClick: onFlush
      };
    }
    if (status === 'saved') {
      return {
        icon: <Check size={14} />,
        color: 'var(--accent-emerald)',
        text: `บันทึกลงชีตแล้ว ${timeText(savedAt)}`,
        hint: 'การแก้ไขล่าสุดถูกเขียนลง Google Sheet เรียบร้อย\nกดเพื่อเปลี่ยนการตั้งค่าปลายทาง',
        onClick: onConfigure
      };
    }
    return {
      icon: <Upload size={14} />,
      color: 'var(--text-secondary)',
      text: 'เขียนกลับชีตพร้อมใช้งาน',
      hint: 'แก้ตารางกะในแอปแล้วระบบจะเขียนลง Google Sheet ให้อัตโนมัติ\nกดเพื่อเปลี่ยนการตั้งค่าปลายทาง',
      onClick: onConfigure
    };
  })();

  return (
    <button
      type="button"
      className="sheet-sync-badge"
      onClick={view.onClick || undefined}
      disabled={!view.onClick}
      title={view.hint}
      style={{ color: view.color, borderColor: 'currentColor' }}
    >
      {view.icon}
      <span>{view.text}</span>
    </button>
  );
}
