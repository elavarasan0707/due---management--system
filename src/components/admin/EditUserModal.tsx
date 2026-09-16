import React, { useState, useEffect } from 'react';
import { User, Department } from '../../types';
import { X, Eye, EyeOff, Save, KeyRound, UserCheck, ShieldAlert, RotateCcw } from 'lucide-react';
import { SelectOrTypeInput, SelectOption } from '../common/SelectOrTypeInput';

interface EditUserModalProps {
  user: User;
  departments: Department[];
  token: string;
  onClose: () => void;
  onSaved: (updatedUser: User) => void;
}

export const EditUserModal: React.FC<EditUserModalProps> = ({
  user,
  departments,
  token,
  onClose,
  onSaved,
}) => {
  const [name, setName] = useState(user.name || '');
  const [email, setEmail] = useState(user.email || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [password, setPassword] = useState(user.password || '');
  const [showPassword, setShowPassword] = useState(false);
  const [departmentId, setDepartmentId] = useState(user.departmentId || (departments[0]?.id || ''));
  const [status, setStatus] = useState<string>(user.status || 'ACTIVE');

  // Student specific
  const [rollNo, setRollNo] = useState(user.rollNo || user.username || '');
  const [registerNo, setRegisterNo] = useState(user.registerNo || '');
  const [degree, setDegree] = useState(user.degree || 'B.E. Computer Science');
  const [batchYear, setBatchYear] = useState(user.batchYear || '2021 - 2025');
  const [semester, setSemester] = useState<string>(String(user.semester || 8));
  const [isHosteler, setIsHosteler] = useState<boolean>(Boolean(user.isHosteler));

  // Staff specific
  const [staffId, setStaffId] = useState(user.staffId || '');
  const [designation, setDesignation] = useState(user.designation || '');
  const [clearanceScope, setClearanceScope] = useState(user.clearanceScope || '');

  // HOD specific
  const [username, setUsername] = useState(user.username || '');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetFormToOriginal = () => {
    setName(user.name || '');
    setEmail(user.email || '');
    setPhone(user.phone || '');
    setPassword(user.password || '');
    setShowPassword(false);
    setDepartmentId(user.departmentId || (departments[0]?.id || ''));
    setStatus(user.status || 'ACTIVE');

    if (user.role === 'STUDENT') {
      setRollNo(user.rollNo || user.username || '');
      setRegisterNo(user.registerNo || '');
      setDegree(user.degree || 'B.E. Computer Science');
      setBatchYear(user.batchYear || '2021 - 2025');
      setSemester(String(user.semester || 8));
      setIsHosteler(Boolean(user.isHosteler));
    } else if (user.role === 'STAFF') {
      setStaffId(user.staffId || '');
      setDesignation(user.designation || '');
      setClearanceScope(user.clearanceScope || '');
    } else if (user.role === 'HOD') {
      setUsername(user.username || '');
    }
    setError(null);
  };

  useEffect(() => {
    resetFormToOriginal();
  }, [user]);

  const deptOptions: SelectOption[] = departments.map((d) => ({
    value: d.id,
    label: `${d.name} (${d.code})`,
    subLabel: d.code,
  }));

  const statusOptions: SelectOption[] = [
    { value: 'ACTIVE', label: 'Active (Login & Clearance Enabled)' },
    { value: 'INACTIVE', label: 'Inactive (Suspended / On Leave)' },
  ];

  const semesterOptions: SelectOption[] = [1, 2, 3, 4, 5, 6, 7, 8].map((s) => ({
    value: String(s),
    label: `Semester ${s}`,
  }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const payload: Partial<User> = {
        name,
        email,
        phone,
        password,
        status: status as 'ACTIVE' | 'INACTIVE',
        departmentId,
      };

      if (user.role === 'STUDENT') {
        payload.rollNo = rollNo;
        payload.registerNo = registerNo;
        payload.degree = degree;
        payload.batchYear = batchYear;
        payload.semester = Number(semester);
        payload.isHosteler = isHosteler;
      } else if (user.role === 'STAFF') {
        payload.staffId = staffId;
        payload.designation = designation;
        payload.clearanceScope = clearanceScope;
      } else if (user.role === 'HOD') {
        payload.username = username;
      }

      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update user');
      }

      onSaved(data);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error updating user');
    } finally {
      setSaving(false);
    }
  };

  const roleTitle = user.role === 'STUDENT' ? 'Student' : user.role === 'HOD' ? 'Department HOD' : 'Staff Member';

  return (
    <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-stone-200 animate-in fade-in zoom-in duration-150 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-stone-100">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-stone-100 text-stone-900 rounded-xl">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900">
                Edit &amp; Save {roleTitle}
              </h3>
              <p className="text-xs text-stone-500">
                Update account details, credentials, and departmental mapping
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
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="mt-4 space-y-4 text-xs">
          {/* Top Identifier / Name */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-stone-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-900 focus:bg-white focus:ring-1 focus:ring-stone-900"
              />
            </div>
            {user.role === 'HOD' && (
              <div>
                <label className="block font-bold text-stone-700 mb-1">Username (Login ID)</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg font-mono text-stone-900 focus:bg-white focus:ring-1 focus:ring-stone-900"
                />
              </div>
            )}
            {user.role === 'STAFF' && (
              <div>
                <label className="block font-bold text-stone-700 mb-1">Staff ID</label>
                <input
                  type="text"
                  required
                  value={staffId}
                  onChange={(e) => setStaffId(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg font-mono font-bold text-stone-900 uppercase focus:bg-white focus:ring-1 focus:ring-stone-900"
                />
              </div>
            )}
            {user.role === 'STUDENT' && (
              <div>
                <label className="block font-bold text-stone-700 mb-1">Roll Number</label>
                <input
                  type="text"
                  required
                  value={rollNo}
                  onChange={(e) => setRollNo(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg font-mono font-bold text-stone-900 uppercase focus:bg-white focus:ring-1 focus:ring-stone-900"
                />
              </div>
            )}
          </div>

          {/* Student specific fields */}
          {user.role === 'STUDENT' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Register Number</label>
                  <input
                    type="text"
                    value={registerNo}
                    onChange={(e) => setRegisterNo(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-900 focus:bg-white focus:ring-1 focus:ring-stone-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Degree Program</label>
                  <input
                    type="text"
                    value={degree}
                    onChange={(e) => setDegree(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-900 focus:bg-white focus:ring-1 focus:ring-stone-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Batch Year</label>
                  <input
                    type="text"
                    value={batchYear}
                    onChange={(e) => setBatchYear(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-900 focus:bg-white focus:ring-1 focus:ring-stone-900"
                  />
                </div>
                <div>
                  <SelectOrTypeInput
                    id="edit-user-semester"
                    label="Current Semester"
                    value={semester}
                    onChange={(val) => setSemester(val)}
                    options={semesterOptions}
                    placeholder="Select semester..."
                    typePlaceholder="Type semester..."
                    defaultValue={String(user.semester || 8)}
                  />
                </div>
                <div className="flex flex-col justify-end">
                  <label className="flex items-center space-x-2 pb-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isHosteler}
                      onChange={(e) => setIsHosteler(e.target.checked)}
                      className="rounded border-stone-300 text-stone-900 focus:ring-stone-900"
                    />
                    <span className="font-bold text-stone-700">Hostel Student</span>
                  </label>
                </div>
              </div>
            </>
          )}

          {/* Staff details */}
          {user.role === 'STAFF' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-stone-700 mb-1">Designation</label>
                <input
                  type="text"
                  required
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-900 focus:bg-white focus:ring-1 focus:ring-stone-900"
                />
              </div>
              <div>
                <label className="block font-bold text-stone-700 mb-1">Clearance Scope</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Department Labs / Central Library"
                  value={clearanceScope}
                  onChange={(e) => setClearanceScope(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-900 focus:bg-white focus:ring-1 focus:ring-stone-900"
                />
              </div>
            </div>
          )}

          {/* Department & Status with SelectOrTypeInput */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <SelectOrTypeInput
                id="edit-user-dept"
                label="Assigned Department"
                value={departmentId}
                onChange={(val) => setDepartmentId(val)}
                options={deptOptions}
                placeholder="Select department..."
                typePlaceholder="Type custom department..."
                defaultValue={user.departmentId || departments[0]?.id || ''}
              />
            </div>

            <div>
              <SelectOrTypeInput
                id="edit-user-status"
                label="Account Status"
                value={status}
                onChange={(val) => setStatus(val)}
                options={statusOptions}
                placeholder="Select status..."
                typePlaceholder="Type custom status..."
                defaultValue={user.status || 'ACTIVE'}
              />
            </div>
          </div>

          {/* Contact Details */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-stone-700 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-900 focus:bg-white focus:ring-1 focus:ring-stone-900"
              />
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
          </div>

          {/* Password Reset */}
          <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center space-x-1.5 font-bold text-amber-950">
                <KeyRound className="w-3.5 h-3.5 text-amber-700" />
                <span>Manage Password / Security Credential</span>
              </div>
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
              className="w-full px-3 py-2 bg-white border border-amber-300 rounded-lg font-mono text-stone-900 focus:ring-1 focus:ring-amber-500"
            />
            <p className="text-[10px] text-amber-800 mt-1">
              The student/staff will be able to log in immediately using their Roll No/ID and this password.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-stone-100">
            <button
              type="button"
              onClick={resetFormToOriginal}
              className="inline-flex items-center space-x-1 px-3 py-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-lg transition"
              title="Reset to original saved details"
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
                <span>{saving ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
