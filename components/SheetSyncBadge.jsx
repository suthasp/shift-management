'use client';

import React from 'react';
import { Cloud, CloudOff, RefreshCw, AlertTriangle, PencilLine, Check } from 'lucide-react';

const timeText = (ts) => {
  if (!ts) return '';
  const d = new Date(ts);
  return d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
};

/**
 * ป้ายสถานะการซิงก์กับ Google Sheet
 * โหมดผสม: ดึงอัตโนมัติจนกว่าผู้ใช้จะแก้กะเดือนนั้นเอง แล้วจึงหยุดจนกดดึงใหม่
 */
export function SheetSyncBadge({ state, onSync }) {
  const { status, tabName, fetchedAt, error, locked, availableTabs } = state;

  const view = (() => {
    if (locked) {
      return {
        icon: <PencilLine size={14} />,
        color: 'var(--accent-amber)',
        text: 'แก้ในแอปแล้ว — หยุดซิงก์',
        hint: 'เดือนนี้ถูกแก้ในแอป ระบบจึงหยุดดึงอัตโนมัติเพื่อไม่ให้ทับงานของคุณ\nกดเพื่อดึงข้อมูลจากชีตมาทับและเปิดซิงก์อัตโนมัติอีกครั้ง'
      };
    }
    switch (status) {
      case 'loading':
        return {
          icon: <RefreshCw size={14} className="sheet-sync-spin" />,
          color: 'var(--accent-cyan)',
          text: 'กำลังดึงจากชีต…',
          hint: 'กำลังติดต่อ Google Sheet'
        };
      case 'synced':
        return {
          icon: <Check size={14} />,
          color: 'var(--accent-emerald)',
          text: `ซิงก์แล้ว ${timeText(fetchedAt)}`,
          hint: `ข้อมูลจากแท็บ "${tabName}" ของ Google Sheet\nดึงอัตโนมัติทุก 1 นาที (Google แคชไฟล์ที่เผยแพร่ราว 5 นาที ข้อมูลจึงอาจช้ากว่าชีตจริงได้ถึง 5 นาที)\nกดเพื่อดึงใหม่ทันที`
        };
      case 'no-tab':
        return {
          icon: <CloudOff size={14} />,
          color: 'var(--text-muted)',
          text: 'ไม่มีเดือนนี้ในชีต',
          hint: `Google Sheet ยังไม่มีแท็บของเดือนนี้ จึงใช้ตารางที่แอปสร้างเอง\nแท็บที่มีในชีต: ${(availableTabs || []).join(', ') || '-'}`
        };
      case 'error':
        return {
          icon: <AlertTriangle size={14} />,
          color: 'var(--accent-rose)',
          text: 'ซิงก์ไม่สำเร็จ',
          hint: `${error || 'ไม่ทราบสาเหตุ'}\nกดเพื่อลองใหม่`
        };
      default:
        return {
          icon: <Cloud size={14} />,
          color: 'var(--text-secondary)',
          text: 'ซิงก์จากชีต',
          hint: 'กดเพื่อดึงตารางกะของเดือนที่เลือกจาก Google Sheet'
        };
    }
  })();

  return (
    <button
      type="button"
      className="sheet-sync-badge"
      onClick={onSync}
      disabled={status === 'loading'}
      title={view.hint}
      style={{ color: view.color, borderColor: 'currentColor' }}
    >
      {view.icon}
      <span>{view.text}</span>
    </button>
  );
}
