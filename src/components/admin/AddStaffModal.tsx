import React, { useState } from 'react';
import { Department, User } from '../../types';
import { X, UserPlus, Save, AlertCircle, Eye, EyeOff, RotateCcw } from 'lucide-react';
import { SelectOrTypeInput, SelectOption } from '../common/SelectOrTypeInput';

interface AddStaffModalProps {
  departments: Department[];
  token: string;
  onClose: () => void;
  onSaved: (staff: User) => void;
}

export const AddStaffModal: React.FC<AddStaffModalProps> = ({
  departments,
  token,
  onClose,
  onSaved,
}) => {
  const [name, setName] = useState('');
  const [staffId, setStaffId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('staff123');
  const [showPassword, setShowPassword] = useState(false);
  const [departmentId, setDepartmentId] = useState(departments[0]?.id || '');
  const [designation, setDesignation] = useState('Assistant Professor');
  const [clearanceScope, setClearanceScope] = useState('');
  const [phone, setPhone] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setName('');
    setStaffId('');
    setEmail('');
    setPassword('staff123');
    setShowPassword(false);
    setDepartmentId(departments[0]?.id || '');
    setDesignation('Assistant Professor');
    setClearanceScope('');
    setPhone('');
    setError(null);
  };

  const deptOptions: SelectOption[] = departments.map((d) => ({
    value: d.id,
    label: `${d.name} (${d.code})`,
    subLabel: d.code,
  }));

  const designationOptions: SelectOption[] = [
    { value: 'Professor & HOD', label: 'Professor & HOD' },
    { value: 'Professor', label: 'Professor' },
    { value: 'Associate Professor', label: 'Associate Professor' },
    { value: 'Assistant Professor', label: 'Assistant Professor' },
    { value: 'Lab Instructor / Technician', label: 'Lab Instructor / Technician' },
    { value: 'System Analyst', label: 'System Analyst' },
    { value: 'Office Superintendent', label: 'Office Superintendent' },
  ];

  const scopeOptions: SelectOption[] = [
    { value: 'Department Labs & Equipment', label: 'Department Labs & Equipment' },
    { value: 'Central College Library', label: 'Central College Library' },
    { value: 'Accounts & Fees Section', label: 'Accounts & Fees Section' },
    { value: 'Sports & Gymnasium Dept', label: 'Sports & Gymnasium Dept' },
    { value: 'Placement & Training Cell', label: 'Placement & Training Cell' },
    { value: 'Hostel & Mess Administration', label: 'Hostel & Mess Administration' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const res = await fetch('/api/hod/staff', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          staffId: staffId.trim().toUpperCase(),
          name: name.trim(),
          email: email.trim(),
          password: password.trim(),
          departmentId,
          designation: designation.trim(),
          clearanceScope: clearanceScope.trim() || 'Department Labs & Equipment',
          phone: phone.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to allocate staff member');
      }

      onSaved(data);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error creating staff');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 animate-in fade-in zoom-in duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-stone-100">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-stone-100 text-stone-900 rounded-xl">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900">
                Allocate Staff Member
              </h3>
              <p className="text-xs text-stone-500">
                Grant staff authority to sign off or raise clearance dues
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center space-x-2 text-rose-700 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-stone-700 mb-1">Staff ID (Login ID)</label>
              <input
                type="text"
                required
                placeholder="e.g. STF-CS-02"
                value={staffId}
                onChange={(e) => setStaffId(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg font-mono font-bold text-stone-900 uppercase focus:bg-white focus:ring-1 focus:ring-stone-900"
              />
            </div>
            <div>
              <label className="block font-bold text-stone-700 mb-1">Staff Full Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Dr. Rajesh Kumar"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-900 focus:bg-white focus:ring-1 focus:ring-stone-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-stone-700 mb-1">Official Email</label>
              <input
                type="email"
                required
                placeholder="staff@college.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-900 focus:bg-white focus:ring-1 focus:ring-stone-900"
              />
            </div>
            <div>
              <SelectOrTypeInput
                id="staff-dept-select"
                label="Department"
                value={departmentId}
                onChange={(val) => setDepartmentId(val)}
                options={deptOptions}
                placeholder="Select department..."
                typePlaceholder="Type custom department..."
                defaultValue={departments[0]?.id || ''}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <SelectOrTypeInput
                id="staff-designation-select"
                label="Designation"
                value={designation}
                onChange={(val) => setDesignation(val)}
                options={designationOptions}
                placeholder="Select designation..."
                typePlaceholder="Type custom designation..."
                defaultValue="Assistant Professor"
              />
            </div>
            <div>
              <SelectOrTypeInput
                id="staff-scope-select"
                label="Clearance Scope / Role"
                value={clearanceScope}
                onChange={(val) => setClearanceScope(val)}
                options={scopeOptions}
                placeholder="Select scope or type..."
                typePlaceholder="Type custom scope (e.g. Robotics Lab)..."
                defaultValue=""
                suggestions={['Department Labs', 'Library', 'Hostel Mess', 'Transport']}
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-stone-700 mb-1">Contact Phone</label>
            <input
              type="text"
              placeholder="+91 98765 43210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-900 focus:bg-white focus:ring-1 focus:ring-stone-900"
            />
          </div>

          <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl">
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-bold text-amber-950">Initial Password</label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[11px] font-semibold text-amber-800 hover:text-amber-950 flex items-center space-x-1"
              >
                {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                <span>{showPassword ? 'Hide' : 'Reveal'}</span>
              </button>
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-amber-300 rounded-lg font-mono text-stone-900"
            />
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-stone-100">
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex items-center space-x-1 px-3 py-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-lg transition"
              title="Reset form fields"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              <span>Reset</span>
            </button>

            <div className="flex items-center space-x-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-stone-600 hover:text-stone-900 font-semibold rounded-lg hover:bg-stone-100 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center space-x-1.5 px-5 py-2 bg-stone-900 text-white font-bold rounded-lg hover:bg-stone-800 transition shadow-xs disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{saving ? 'Allocating...' : 'Allocate Staff'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
