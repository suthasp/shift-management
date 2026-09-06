'use client';

import React, { useState } from 'react';
import { Users, X, Plus, Trash2, Edit3, Check, ArrowUp, ArrowDown } from 'lucide-react';

export function StaffModal({
  isOpen,
  onClose,
  staffList,
  onAddStaff,
  onUpdateStaff,
  onDeleteStaff,
  onReorderStaff
}) {
  if (!isOpen) return null;

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [newName, setNewName] = useState('');
  const [newPosition, setNewPosition] = useState('CNO Operations Staff');
  const [newPhone, setNewPhone] = useState('');

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!newName.trim()) return;

    onAddStaff({
      name: newName.trim(),
      position: newPosition.trim(),
      phone: newPhone.trim() || '08x-xxx-xxxx'
    });

    setNewName('');
    setNewPosition('CNO Operations Staff');
    setNewPhone('');
    setIsAdding(false);
  };

  const handleSaveEdit = (id, currentValues) => {
    onUpdateStaff(id, currentValues);
    setEditingId(null);
  };

  return (
    <div className="shift-picker-overlay" onClick={onClose}>
      <div className="shift-picker-card" style={{ maxWidth: 680 }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <h3>
            <Users size={20} color="var(--accent-cyan)" />
            <span>จัดการรายชื่อเจ้าหน้าที่ Data Center ({staffList.length} คน)</span>
          </h3>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {/* Add Staff Button / Form */}
          {!isAdding ? (
            <div style={{ marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                รายชื่อเจ้าหน้าที่ที่ได้รับมอบหมายดูแลระบบ CNO ประจำตาราง
              </span>
              <button className="btn btn-primary" onClick={() => setIsAdding(true)}>
                <Plus size={16} />
                <span>เพิ่มเจ้าหน้าที่ใหม่</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleAddSubmit} style={{ background: 'var(--bg-surface-elevated)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-color)', marginBottom: '1.25rem' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.75rem' }}>
                เพิ่มรายชื่อเจ้าหน้าที่ใหม่
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ชื่อ - นามสกุล:</label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น สมชาย ใจดี"
                    className="form-control"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ตำแหน่ง:</label>
                  <input
                    type="text"
                    placeholder="CNO Operations Specialist"
                    className="form-control"
                    value={newPosition}
                    onChange={e => setNewPosition(e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>เบอร์ติดต่อ:</label>
                  <input
                    type="text"
                    placeholder="081-xxx-xxxx"
                    className="form-control"
                    value={newPhone}
                    onChange={e => setNewPhone(e.target.value)}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsAdding(false)}>
                  ยกเลิก
                </button>
                <button type="submit" className="btn btn-primary">
                  บันทึก
                </button>
              </div>
            </form>
          )}

          {/* Staff List Table */}
          <div style={{ overflowX: 'auto', maxHeight: '420px', overflowY: 'auto' }}>
            <table className="modal-data-table">
              <thead>
                <tr>
                  <th style={{ width: 45 }}>#</th>
                  <th>ชื่อ - นามสกุล</th>
                  <th>ตำแหน่ง</th>
                  <th>เบอร์โทร</th>
                  <th style={{ width: 110, textAlign: 'center' }}>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {staffList.map((staff, idx) => {
                  const isEditing = editingId === staff.id;
                  return (
                    <tr key={staff.id}>
                      <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                        {idx + 1}
                      </td>

                      {isEditing ? (
                        <>
                          <td>
                            <input
                              type="text"
                              className="form-control"
                              defaultValue={staff.name}
                              id={`edit-name-${staff.id}`}
                              style={{ height: 30, padding: '2px 6px', fontSize: '0.85rem' }}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control"
                              defaultValue={staff.position}
                              id={`edit-pos-${staff.id}`}
                              style={{ height: 30, padding: '2px 6px', fontSize: '0.85rem' }}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control"
                              defaultValue={staff.phone}
                              id={`edit-phone-${staff.id}`}
                              style={{ height: 30, padding: '2px 6px', fontSize: '0.85rem' }}
                            />
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <button
                              className="btn btn-primary"
                              style={{ padding: '2px 8px', fontSize: '0.75rem' }}
                              onClick={() => {
                                const name = document.getElementById(`edit-name-${staff.id}`).value;
                                const position = document.getElementById(`edit-pos-${staff.id}`).value;
                                const phone = document.getElementById(`edit-phone-${staff.id}`).value;
                                handleSaveEdit(staff.id, { name, position, phone });
                              }}
                            >
                              <Check size={14} />
                            </button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td style={{ fontWeight: 600 }}>{staff.name}</td>
                          <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{staff.position}</td>
                          <td style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>{staff.phone}</td>
                          <td style={{ textAlign: 'center' }}>
                            <div style={{ display: 'inline-flex', gap: '4px' }}>
                              <button
                                className="btn btn-secondary btn-icon-only"
                                style={{ width: 28, height: 28, padding: 0 }}
                                title="แก้ไข"
                                onClick={() => setEditingId(staff.id)}
                              >
                                <Edit3 size={13} />
                              </button>
                              <button
                                className="btn btn-secondary btn-icon-only"
                                style={{ width: 28, height: 28, padding: 0, color: '#ef4444' }}
                                title="ลบ"
                                onClick={() => {
                                  if (confirm(`คุณต้องการลบ ${staff.name} ออกจากตารางหรือไม่?`)) {
                                    onDeleteStaff(staff.id);
                                  }
                                }}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-secondary" onClick={onClose}>
              ปิด
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
