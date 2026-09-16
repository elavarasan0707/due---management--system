import React, { useState } from 'react';
import { StudentClearanceRecord, ClearanceItem, ClearanceStatus } from '../../types';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Edit2,
  Plus,
  Trash2,
  Save,
  Check,
  DollarSign,
  FileCheck,
  ShieldCheck,
  RotateCcw,
  Printer,
} from 'lucide-react';
import { NoDueCertificate } from '../NoDueCertificate';
import { SelectOrTypeInput, SelectOption } from '../common/SelectOrTypeInput';

interface ClearanceDetailModalProps {
  clearance: StudentClearanceRecord;
  token: string;
  onClose: () => void;
  onUpdated: (updatedClearance: StudentClearanceRecord) => void;
}

export const ClearanceDetailModal: React.FC<ClearanceDetailModalProps> = ({
  clearance: initialClr,
  token,
  onClose,
  onUpdated,
}) => {
  const [clearance, setClearance] = useState<StudentClearanceRecord>(initialClr);
  const [showCertificate, setShowCertificate] = useState(false);
  const [autoPrintCert, setAutoPrintCert] = useState(false);

  // Checkpoint editing state
  const [editingItem, setEditingItem] = useState<ClearanceItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editStatus, setEditStatus] = useState<ClearanceStatus>('PENDING');
  const [editDueAmount, setEditDueAmount] = useState('0');
  const [editDueReason, setEditDueReason] = useState('');
  const [editRemarks, setEditRemarks] = useState('');

  // Add checkpoint modal state
  const [showAddCheckpoint, setShowAddCheckpoint] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<'DEPARTMENT' | 'CENTRAL'>('DEPARTMENT');
  const [newScope, setNewScope] = useState('Department Office');
  const [newDueAmount, setNewDueAmount] = useState('0');
  const [newDueReason, setNewDueReason] = useState('');
  const [newRemarks, setNewRemarks] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startEdit = (item: ClearanceItem) => {
    setEditingItem(item);
    setEditTitle(item.title);
    setEditStatus(item.status);
    setEditDueAmount(String(item.dueAmount || 0));
    setEditDueReason(item.dueReason || '');
    setEditRemarks(item.remarks || '');
  };

  const handleSaveCheckpoint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/clearances/${clearance.id}/items/${editingItem.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: editTitle.trim(),
          status: editStatus,
          dueAmount: Number(editDueAmount || 0),
          dueReason: editDueReason.trim(),
          remarks: editRemarks.trim(),
        }),
      });

      const updated = await res.json();
      if (!res.ok) throw new Error(updated.error || 'Failed to update checkpoint');

      setClearance(updated);
      onUpdated(updated);
      setEditingItem(null);
    } catch (err: any) {
      setError(err.message || 'Error updating checkpoint');
    } finally {
      setSaving(false);
    }
  };

  const handleAddCheckpoint = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/clearances/${clearance.id}/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: newTitle.trim(),
          category: newCategory,
          assignedScope: newScope.trim(),
          dueAmount: Number(newDueAmount || 0),
          dueReason: newDueReason.trim(),
          remarks: newRemarks.trim(),
        }),
      });

      const updated = await res.json();
      if (!res.ok) throw new Error(updated.error || 'Failed to add checkpoint');

      setClearance(updated);
      onUpdated(updated);
      setShowAddCheckpoint(false);
      setNewTitle('');
      setNewDueAmount('0');
      setNewDueReason('');
      setNewRemarks('');
    } catch (err: any) {
      setError(err.message || 'Error adding checkpoint');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCheckpoint = async (itemId: string, title: string) => {
    if (!confirm(`Are you sure you want to remove the clearance checkpoint "${title}"?`)) return;
    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/clearances/${clearance.id}/items/${itemId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const updated = await res.json();
      if (!res.ok) throw new Error(updated.error || 'Failed to delete checkpoint');

      setClearance(updated);
      onUpdated(updated);
    } catch (err: any) {
      setError(err.message || 'Error deleting checkpoint');
    } finally {
      setSaving(false);
    }
  };

  const handleQuickAction = async (itemId: string, action: 'APPROVE' | 'CLEAR_DUE') => {
    try {
      setSaving(true);
      const res = await fetch('/api/clearances/action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          studentClearanceId: clearance.id,
          itemId,
          action,
        }),
      });

      const updated = await res.json();
      if (!res.ok) throw new Error(updated.error || 'Failed to execute action');

      setClearance(updated);
      onUpdated(updated);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const percent = Math.round((clearance.clearedCheckpoints / clearance.totalCheckpoints) * 100);

  return (
    <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-stone-200 animate-in fade-in zoom-in duration-150 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-stone-200 shrink-0">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-stone-100 text-stone-900">
                {clearance.studentRollNo}
              </span>
              <h2 className="text-lg font-bold text-stone-900">
                {clearance.studentName}
              </h2>
              <span className="text-xs text-stone-500 font-medium">
                • {clearance.studentDepartmentName}
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-1">
              Batch: {clearance.batchYear} • Sem {clearance.semester} • {clearance.isHosteler ? 'Hosteler' : 'Day Scholar'}
            </p>
          </div>

          <div className="flex items-center space-x-2">
            {clearance.overallStatus === 'COMPLETED' && (
              <button
                type="button"
                onClick={() => {
                  setAutoPrintCert(true);
                  setShowCertificate(true);
                }}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-lg text-xs font-bold transition shadow-xs cursor-pointer active:scale-95"
                title="Print Official No-Due Certificate"
              >
                <Printer className="w-3.5 h-3.5 text-stone-950" />
                <span>Print Certificate</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Progress & Dues Header */}
        <div className="grid grid-cols-3 gap-4 py-3 bg-stone-50 border-b border-stone-200 px-4 -mx-6 shrink-0 text-xs">
          <div>
            <span className="text-stone-500 block text-[11px]">Clearance Progress</span>
            <span className="font-bold text-stone-900 text-sm">
              {clearance.clearedCheckpoints} of {clearance.totalCheckpoints} Cleared ({percent}%)
            </span>
          </div>
          <div>
            <span className="text-stone-500 block text-[11px]">Outstanding Dues</span>
            <span className={`font-bold text-sm ${clearance.totalDueAmount > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
              ₹{clearance.totalDueAmount.toLocaleString()}
            </span>
          </div>
          <div>
            <span className="text-stone-500 block text-[11px]">Overall Status</span>
            <span className="inline-flex items-center space-x-1 font-bold">
              {clearance.overallStatus === 'COMPLETED' ? (
                <span className="text-emerald-700 flex items-center space-x-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Fully Cleared</span>
                </span>
              ) : clearance.overallStatus === 'HAS_DUES' ? (
                <span className="text-rose-600 flex items-center space-x-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Dues Pending</span>
                </span>
              ) : (
                <span className="text-amber-700 flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>In Progress</span>
                </span>
              )}
            </span>
          </div>
        </div>

        {error && (
          <div className="my-2 p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Checkpoints List (Scrollable) */}
        <div className="flex-1 overflow-y-auto py-3 space-y-2.5 pr-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-stone-700 uppercase tracking-wider">
              Department &amp; Institutional Checkpoints ({clearance.items.length})
            </span>
            <button
              type="button"
              onClick={() => setShowAddCheckpoint(true)}
              className="inline-flex items-center space-x-1 px-2.5 py-1 bg-stone-900 text-white rounded-lg text-xs font-bold hover:bg-stone-800 transition"
            >
              <Plus className="w-3 h-3" />
              <span>Add Custom Checkpoint</span>
            </button>
          </div>

          <div className="divide-y divide-stone-100 border border-stone-200 rounded-xl overflow-hidden bg-white">
            {clearance.items.map((item) => (
              <div key={item.id} className="p-3 hover:bg-stone-50/70 transition flex items-center justify-between text-xs">
                <div className="flex-1 pr-4">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-stone-900">{item.title}</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-stone-100 text-stone-600">
                      {item.assignedScope}
                    </span>
                    {item.status === 'APPROVED' ? (
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Cleared</span>
                      </span>
                    ) : item.status === 'DUE_RAISED' ? (
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
                        <AlertTriangle className="w-3 h-3 text-rose-600" />
                        <span>Due: ₹{item.dueAmount}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        <Clock className="w-3 h-3 text-amber-600" />
                        <span>Pending</span>
                      </span>
                    )}
                  </div>

                  <div className="mt-1 flex items-center space-x-3 text-[11px] text-stone-500">
                    {item.dueReason && (
                      <span className="text-rose-600 font-medium">Reason: {item.dueReason}</span>
                    )}
                    {item.clearedByUserName && (
                      <span>Approved by: {item.clearedByUserName} ({item.clearedByDesignation})</span>
                    )}
                    {item.remarks && (
                      <span className="italic">Note: "{item.remarks}"</span>
                    )}
                  </div>
                </div>

                {/* Row Actions */}
                <div className="flex items-center space-x-1.5 shrink-0">
                  {item.status !== 'APPROVED' && (
                    <button
                      type="button"
                      onClick={() => handleQuickAction(item.id, 'APPROVE')}
                      className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded text-[11px] font-bold transition flex items-center space-x-1"
                      title="Direct Approve"
                    >
                      <Check className="w-3 h-3" />
                      <span>Approve</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => startEdit(item)}
                    className="p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition"
                    title="Edit Checkpoint & Save"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteCheckpoint(item.id, item.title)}
                    className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    title="Delete Checkpoint"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* EDIT CHECKPOINT SUB-MODAL */}
        {editingItem && (
          <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-2xs flex items-center justify-center p-4 z-60">
            <div className="bg-white rounded-xl max-w-md w-full p-5 shadow-xl border border-stone-200">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <h4 className="text-sm font-bold text-stone-900">
                  Edit &amp; Save Checkpoint
                </h4>
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="p-1 text-stone-400 hover:text-stone-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveCheckpoint} className="mt-3 space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Checkpoint Title</label>
                  <input
                    type="text"
                    required
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <SelectOrTypeInput
                      id="edit-checkpoint-status"
                      label="Status"
                      value={editStatus}
                      onChange={(val) => setEditStatus(val as ClearanceStatus)}
                      options={[
                        { value: 'APPROVED', label: 'Approved / Cleared' },
                        { value: 'DUE_RAISED', label: 'Due Raised' },
                        { value: 'PENDING', label: 'Pending Review' },
                      ]}
                      placeholder="Select status..."
                      typePlaceholder="Type custom status..."
                      defaultValue={editingItem.status}
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">Due Amount (₹)</label>
                    <input
                      type="number"
                      min={0}
                      value={editDueAmount}
                      onChange={(e) => setEditDueAmount(e.target.value)}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">Due Reason</label>
                  <input
                    type="text"
                    placeholder="e.g. Overdue library book, unpaid lab fee"
                    value={editDueReason}
                    onChange={(e) => setEditDueReason(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">Official Remarks / Comments</label>
                  <textarea
                    rows={2}
                    placeholder="Internal remarks or approval comments"
                    value={editRemarks}
                    onChange={(e) => setEditRemarks(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-900"
                  />
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => {
                      if (editingItem) {
                        setEditTitle(editingItem.title);
                        setEditStatus(editingItem.status);
                        setEditDueAmount(String(editingItem.dueAmount || 0));
                        setEditDueReason(editingItem.dueReason || '');
                        setEditRemarks(editingItem.remarks || '');
                      }
                    }}
                    className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-semibold text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-lg transition"
                    title="Reset to original checkpoint values"
                  >
                    <RotateCcw className="w-3 h-3 mr-1" />
                    <span>Reset</span>
                  </button>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setEditingItem(null)}
                      className="px-3 py-1.5 text-stone-600 hover:text-stone-900"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="inline-flex items-center space-x-1.5 px-4 py-1.5 bg-stone-900 text-white font-bold rounded-lg hover:bg-stone-800 disabled:opacity-50"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ADD CHECKPOINT SUB-MODAL */}
        {showAddCheckpoint && (
          <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-2xs flex items-center justify-center p-4 z-60">
            <div className="bg-white rounded-xl max-w-md w-full p-5 shadow-xl border border-stone-200">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <h4 className="text-sm font-bold text-stone-900">
                  Add Custom Clearance Checkpoint
                </h4>
                <button
                  type="button"
                  onClick={() => setShowAddCheckpoint(false)}
                  className="p-1 text-stone-400 hover:text-stone-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddCheckpoint} className="mt-3 space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Checkpoint Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Robotics Club Dues / Bus Pass Return"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <SelectOrTypeInput
                      id="new-checkpoint-category"
                      label="Category"
                      value={newCategory}
                      onChange={(val) => setNewCategory(val as any)}
                      options={[
                        { value: 'DEPARTMENT', label: 'Department Level' },
                        { value: 'CENTRAL', label: 'Central / Institutional' },
                      ]}
                      placeholder="Select category..."
                      typePlaceholder="Type custom category..."
                      defaultValue="DEPARTMENT"
                    />
                  </div>
                  <div>
                    <SelectOrTypeInput
                      id="new-checkpoint-scope"
                      label="Assigned Office / Scope"
                      value={newScope}
                      onChange={(val) => setNewScope(val)}
                      options={[
                        { value: 'Department Office', label: 'Department Office' },
                        { value: 'Main Library', label: 'Main Library' },
                        { value: 'Accounts Section', label: 'Accounts Section' },
                        { value: 'Transport Office', label: 'Transport Office' },
                        { value: 'Hostel Office', label: 'Hostel Office' },
                        { value: 'Physical Education / Sports', label: 'Physical Education / Sports' },
                      ]}
                      placeholder="Select or type office..."
                      typePlaceholder="Type custom office/scope..."
                      defaultValue="Department Office"
                      suggestions={['Lab In-charge', 'Placement Cell', 'Alumni Office']}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">Initial Due Amount (₹)</label>
                    <input
                      type="number"
                      min={0}
                      value={newDueAmount}
                      onChange={(e) => setNewDueAmount(e.target.value)}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-900"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">Due Reason (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Transport pass card missing"
                      value={newDueReason}
                      onChange={(e) => setNewDueReason(e.target.value)}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">Remarks</label>
                  <textarea
                    rows={2}
                    placeholder="Instructions for student"
                    value={newRemarks}
                    onChange={(e) => setNewRemarks(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-900"
                  />
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => {
                      setNewTitle('');
                      setNewCategory('DEPARTMENT');
                      setNewScope('Department Office');
                      setNewDueAmount('0');
                      setNewDueReason('');
                      setNewRemarks('');
                    }}
                    className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-semibold text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-lg transition"
                    title="Reset form"
                  >
                    <RotateCcw className="w-3 h-3 mr-1" />
                    <span>Reset</span>
                  </button>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setShowAddCheckpoint(false)}
                      className="px-3 py-1.5 text-stone-600 hover:text-stone-900"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="inline-flex items-center space-x-1.5 px-4 py-1.5 bg-stone-900 text-white font-bold rounded-lg hover:bg-stone-800 disabled:opacity-50"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{saving ? 'Adding...' : 'Add Checkpoint'}</span>
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* CERTIFICATE PREVIEW MODAL */}
        {showCertificate && (
          <NoDueCertificate
            clearance={clearance}
            autoPrint={autoPrintCert}
            onClose={() => {
              setShowCertificate(false);
              setAutoPrintCert(false);
            }}
          />
        )}
      </div>
    </div>
  );
};
