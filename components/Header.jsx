'use client';

import React from 'react';
import { 
  Calendar, 
  Wand2, 
  ArrowLeftRight, 
  BarChart3, 
  Users, 
  Download, 
  Printer, 
  RotateCcw, 
  Sun, 
  Moon,
  ShieldCheck
} from 'lucide-react';
import { BrandMark } from './BrandMark';
import { THAI_MONTHS } from '../data/initialData';

export function Header({
  year,
  setYear,
  month,
  setMonth,
  theme,
  setTheme,
  onOpenAutoSchedule,
  onOpenSwap,
  onOpenAnalytics,
  onOpenStaff,
  onExportExcel,
  onPrint,
  onResetDefault
}) {
  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    try {
      localStorage.setItem('dc_shift_theme', nextTheme);
    } catch (e) {}
  };

  return (
    <header className="app-header no-print">
      <div className="header-inner">
        {/* Brand / Logo */}
        <div className="brand-section">
          <div className="dc-badge-pulse">
            <BrandMark size={24} />
          </div>
          <div className="brand-text">
            <h1>
              <span>DC Shift Roster</span>
              <span style={{ 
                fontSize: '0.68rem', 
                background: 'rgba(0, 229, 255, 0.15)', 
                color: 'var(--accent-cyan)', 
                padding: '2px 8px', 
                borderRadius: '6px',
                border: '1px solid rgba(0, 229, 255, 0.3)',
                fontWeight: 700 
              }}>
                24/7 MISSION CRITICAL
              </span>
            </h1>
            <p>ระบบกำหนดและบริหารจัดการตารางกะศูนย์ข้อมูล Data Center Operation</p>
          </div>
        </div>

        {/* Controls */}
        <div className="header-controls">
          {/* Month / Year Select */}
          <div className="month-selector">
            <Calendar size={16} color="var(--accent-cyan)" />
            <select 
              value={month} 
              onChange={(e) => setMonth(Number(e.target.value))}
              title="เลือกเดือน"
            >
              {THAI_MONTHS.map((name, idx) => (
                <option key={idx + 1} value={idx + 1}>
                  {name}
                </option>
              ))}
            </select>
            <select 
              value={year} 
              onChange={(e) => setYear(Number(e.target.value))}
              title="เลือกปี"
            >
              {[2025, 2026, 2027, 2028].map(y => (
                <option key={y} value={y}>
                  พ.ศ. {y + 543} ({y})
                </option>
              ))}
            </select>
          </div>

          {/* Auto-Scheduler Button */}
          <button 
            className="btn btn-auto-magic"
            onClick={onOpenAutoSchedule}
            title="จัดกะอัตโนมัติ 24/7 ด้วย AI Algorithm"
          >
            <Wand2 size={16} />
            <span>จัดกะอัตโนมัติ</span>
          </button>

          {/* Swap Shifts */}
          <button 
            className="btn btn-secondary"
            onClick={onOpenSwap}
            title="ขอสลับ / แลกกะระหว่างเจ้าหน้าที่"
          >
            <ArrowLeftRight size={16} />
            <span>แลกกะ</span>
          </button>

          {/* Analytics / Stats */}
          <button 
            className="btn btn-secondary"
            onClick={onOpenAnalytics}
            title="สถิติชั่วโมงทำงาน และสรุปเบี้ยเลี้ยงกะดึก"
          >
            <BarChart3 size={16} />
            <span>สถิติ & ค่ากะ</span>
          </button>

          {/* Staff Management */}
          <button 
            className="btn btn-secondary"
            onClick={onOpenStaff}
            title="จัดการรายชื่อเจ้าหน้าที่ DC"
          >
            <Users size={16} />
            <span>พนักงาน</span>
          </button>

          {/* Export Excel */}
          <button 
            className="btn btn-primary"
            onClick={onExportExcel}
            title="ดาวน์โหลดไฟล์ Excel (.xlsx) ตามรูปแบบเอกสารเดิม"
          >
            <Download size={16} />
            <span>Export Excel</span>
          </button>

          {/* Print */}
          <button 
            className="btn btn-secondary btn-icon-only"
            onClick={onPrint}
            title="พิมพ์ตาราง หรือบันทึกเป็น PDF (A4 แนวนอน)"
          >
            <Printer size={16} />
          </button>

          {/* Reset */}
          <button 
            className="btn btn-secondary btn-icon-only"
            onClick={onResetDefault}
            title="รีเซ็ตกลับเป็นตารางเดือนตุลาคมเริ่มต้น (ตามรูปตัวอย่าง)"
          >
            <RotateCcw size={16} />
          </button>

          {/* Theme Switcher */}
          <button 
            className="btn btn-secondary btn-icon-only"
            onClick={toggleTheme}
            title={`สลับเป็นโหมด ${theme === 'dark' ? 'สว่าง (Light)' : 'มืด (Dark)'}`}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </div>
    </header>
  );
}
