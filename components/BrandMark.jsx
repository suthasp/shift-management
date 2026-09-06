'use client';

import React from 'react';

/**
 * ตราสัญลักษณ์ CNO Shift Roster — หน้าปัดกะ 24 ชม.
 * วงแหวนแบ่ง 3 ส่วนแทนรอบกะหมุนเวียน ใช้ชุดสีเดียวกับ favicon
 */
export function BrandMark({ size = 24, title = 'CNO Shift Roster' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      role="img"
      aria-label={title}
      style={{ display: 'block' }}
    >
      {/* สีแบรนด์ ตรึงไว้ให้ตรงกับ favicon — ไม่ผูกกับ --shift-a-bg ที่เปลี่ยนตามสีกะได้ */}
      <path d="M17.98 1.94A14.2 14.2 0 0 1 29.17 21.32L23.05 18.85A7.6 7.6 0 0 0 17.06 8.47Z" fill="#ffb74d" />
      <path d="M27.19 24.74A14.2 14.2 0 0 1 4.81 24.74L10.01 20.68A7.6 7.6 0 0 0 21.99 20.68Z" fill="var(--accent-cyan, #00e5ff)" />
      <path d="M2.83 21.32A14.2 14.2 0 0 1 14.02 1.94L14.94 8.47A7.6 7.6 0 0 0 8.95 18.85Z" fill="var(--accent-emerald, #10b981)" />
      <circle cx="16" cy="16" r="3.6" fill="var(--accent-cyan, #00e5ff)" />
    </svg>
  );
}
