import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Subject, User } from '../../types';
import { UserCheck, X, AlertCircle, RotateCcw } from 'lucide-react';
import { SelectOrTypeInput, SelectOption } from '../common/SelectOrTypeInput';

interface AllocateStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAllocated: () => void;
  subject: Subject | null;
  staffList: User[];
}

export const AllocateStaffModal: React.FC<AllocateStaffModalProps> = ({
  isOpen,
  onClose,
  onAllocated,
  subject,
  staffList,
}) => {
  const { token } = useAuth();
  const [selectedStaffId, setSelectedStaffId] = useState<string>(
    subject?.assignedStaffId || subject?.assignedStaffName || ''
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync selected staff when subject changes
  React.useEffect(() => {
    if (subject) {
      setSelectedStaffId(subject.assignedStaffId || subject.assignedStaffName || '');
      setError(null);
    }
  }, [subject, isOpen]);

  if (!isOpen || !subject) return null;

  // Filter staff who belong to this department or have general scope
  const eligibleStaff = staffList.filter(
    (s) => !subject.departmentId || s.departmentId === subject.departmentId || s.role === 'STAFF'
  );

  const staffOptions: SelectOption[] = [
    { value: '', label: '-- No Faculty (Vacant / Clear Allocation) --' },
    ...eligibleStaff.map((staff) => ({
      value: staff.id,
      label: staff.name,
      subLabel: `${staff.staffId || staff.username} • ${staff.designation || 'Staff'}`,
    })),
  ];

  const handleResetToInitial = () => {
    setSelectedStaffId(subject.assignedStaffId || subject.assignedStaffName || '');
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/subjects/${subject.id}/allocate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          staffId: selectedStaffId, // empty string will deallocate, string will allocate
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update faculty allocation');
      }

      onAllocated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error updating allocation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full border border-stone-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-900">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900">Allocate Subject Teacher</h3>
              <p className="text-xs text-stone-500 font-medium">
                {subject.code} • Sem {subject.semester}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600 p-1.5 rounded-lg hover:bg-stone-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center space-x-2 text-xs text-rose-800 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Subject Overview Card */}
          <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 text-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-stone-900 font-mono text-sm">{subject.code}</span>
              <span className="px-2 py-0.5 rounded-md bg-stone-200 text-stone-700 font-semibold text-[10px]">
                {subject.type}
              </span>
            </div>
            <div className="font-medium text-stone-800">{subject.name}</div>
            <div className="text-stone-500 text-[11px]">
              {subject.departmentName || subject.departmentCode} • Semester {subject.semester} • Credits: {subject.credits || 3}
            </div>
          </div>

          <div>
            <SelectOrTypeInput
              id="quick-allocate-staff-select"
              label="ALLOCATED FACULTY / STAFF IN-CHARGE"
              value={selectedStaffId}
              onChange={(val) => setSelectedStaffId(val)}
              options={staffOptions}
              placeholder="-- Select faculty member or type custom name --"
              typePlaceholder="Type custom faculty name..."
              customLabel="Type custom teacher"
              dropdownLabel="Select existing staff"
              defaultValue={subject.assignedStaffId || ''}
              suggestions={['Visiting Professor', 'Lab Instructor', 'Guest Lecturer']}
              helpText="Select from registered college staff or type any faculty member's name directly."
            />
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-stone-200">
            <button
              type="button"
              onClick={handleResetToInitial}
              className="inline-flex items-center space-x-1 px-3 py-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-lg transition"
              title="Reset to current subject allocation"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              <span>Reset</span>
            </button>

            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-bold text-white bg-stone-900 hover:bg-stone-800 rounded-lg transition disabled:opacity-50 shadow-xs"
              >
                {loading ? 'Saving...' : 'Save Allocation'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
