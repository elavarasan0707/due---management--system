import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Subject, Department, User } from '../../types';
import { BookOpen, X, AlertCircle, CheckCircle2, UserCheck, RotateCcw } from 'lucide-react';
import { SelectOrTypeInput, SelectOption } from '../common/SelectOrTypeInput';

interface SubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  subjectToEdit?: Subject | null;
  departments: Department[];
  staffList: User[];
}

export const SubjectModal: React.FC<SubjectModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  subjectToEdit,
  departments,
  staffList,
}) => {
  const { token } = useAuth();
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [semester, setSemester] = useState('1');
  const [type, setType] = useState('THEORY');
  const [credits, setCredits] = useState(3);
  const [batchYear, setBatchYear] = useState('2021 - 2025');
  const [assignedStaffId, setAssignedStaffId] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetFormToDefaults = () => {
    if (subjectToEdit) {
      setCode(subjectToEdit.code || '');
      setName(subjectToEdit.name || '');
      setDepartmentId(subjectToEdit.departmentId || (departments[0]?.id ?? ''));
      setSemester(String(subjectToEdit.semester || 1));
      setType(subjectToEdit.type || 'THEORY');
      setCredits(subjectToEdit.credits ?? 3);
      setBatchYear(subjectToEdit.batchYear || '2021 - 2025');
      setAssignedStaffId(subjectToEdit.assignedStaffId || subjectToEdit.assignedStaffName || '');
      setDescription(subjectToEdit.description || '');
    } else {
      setCode('');
      setName('');
      setDepartmentId(departments[0]?.id || '');
      setSemester('1');
      setType('THEORY');
      setCredits(3);
      setBatchYear('2021 - 2025');
      setAssignedStaffId('');
      setDescription('');
    }
    setError(null);
  };

  useEffect(() => {
    resetFormToDefaults();
  }, [subjectToEdit, isOpen, departments]);

  if (!isOpen) return null;

  // Filter staff members matching the selected department or unassigned
  const eligibleStaff = staffList.filter(
    (s) => !departmentId || s.departmentId === departmentId || s.role === 'STAFF'
  );

  const deptOptions: SelectOption[] = departments.map((d) => ({
    value: d.id,
    label: `${d.code} - ${d.name}`,
    subLabel: d.code,
  }));

  const courseTypeOptions: SelectOption[] = [
    { value: 'THEORY', label: 'Theory (Lecture Course)' },
    { value: 'PRACTICAL', label: 'Practical / Laboratory Course' },
    { value: 'PROJECT', label: 'Project / Seminar Work' },
  ];

  const semesterOptions: SelectOption[] = [1, 2, 3, 4, 5, 6, 7, 8].map((s) => ({
    value: String(s),
    label: `Semester ${s}`,
  }));

  const staffOptions: SelectOption[] = [
    { value: '', label: '-- No Faculty Allocated (Vacant / Unassigned) --' },
    ...eligibleStaff.map((staff) => ({
      value: staff.id,
      label: staff.name,
      subLabel: `${staff.staffId || staff.username} • ${staff.designation || 'Faculty'}`,
    })),
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim() || !departmentId) {
      setError('Subject Code, Subject Name, and Department are required.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const url = subjectToEdit ? `/api/subjects/${subjectToEdit.id}` : '/api/subjects';
      const method = subjectToEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          code: code.trim().toUpperCase(),
          name: name.trim(),
          departmentId,
          semester: Number(semester) || 1,
          type,
          credits: Number(credits) || 3,
          batchYear: batchYear.trim(),
          assignedStaffId: assignedStaffId || undefined,
          description: description.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save subject allocation');
      }

      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error saving subject allocation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-stone-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900">
                {subjectToEdit ? 'Edit Subject & Allocation' : 'Add Course & Allocate Faculty'}
              </h3>
              <p className="text-xs text-stone-500">
                Select from standard institutional options or type to add custom values
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600 p-1.5 rounded-lg hover:bg-stone-200/50 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center space-x-2 text-rose-700 text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Subject Code */}
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                Subject Code *
              </label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. CS8651"
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-sm text-stone-900 uppercase font-mono font-bold focus:outline-none focus:ring-2 focus:ring-stone-900 focus:bg-white"
              />
            </div>

            {/* Course Type with SelectOrTypeInput */}
            <div>
              <SelectOrTypeInput
                id="subject-type-select"
                label="COURSE CATEGORY"
                value={type}
                onChange={(val) => setType(val)}
                options={courseTypeOptions}
                placeholder="Select category..."
                typePlaceholder="Type custom course category (e.g. Open Elective)..."
                suggestions={['Theory', 'Practical', 'Project', 'Value Added Course', 'Industrial Seminar']}
                defaultValue="THEORY"
              />
            </div>
          </div>

          {/* Subject Name */}
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
              Subject Name / Title *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Internet Programming & Web Technologies"
              className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:bg-white"
            />
          </div>

          {/* Department and Semester with SelectOrTypeInput */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <SelectOrTypeInput
                id="subject-dept-select"
                label="ACADEMIC DEPARTMENT"
                required
                value={departmentId}
                onChange={(val) => setDepartmentId(val)}
                options={deptOptions}
                placeholder="Select department..."
                typePlaceholder="Type custom department name..."
                suggestions={['Artificial Intelligence & DS', 'Robotics & Automation', 'Bio-Medical']}
                defaultValue={departments[0]?.id || ''}
              />
            </div>

            <div>
              <SelectOrTypeInput
                id="subject-sem-select"
                label="SEMESTER"
                required
                value={semester}
                onChange={(val) => setSemester(val)}
                options={semesterOptions}
                placeholder="Semester..."
                typePlaceholder="Type semester (e.g. 9)..."
                defaultValue="1"
              />
            </div>
          </div>

          {/* Credits & Batch Year */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                Credits
              </label>
              <input
                type="number"
                min={1}
                max={10}
                value={credits}
                onChange={(e) => setCredits(Number(e.target.value))}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                Target Batch Year
              </label>
              <input
                type="text"
                value={batchYear}
                onChange={(e) => setBatchYear(e.target.value)}
                placeholder="e.g. 2021 - 2025"
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:bg-white"
              />
            </div>
          </div>

          {/* Faculty / Staff Allocation with SelectOrTypeInput */}
          <div className="p-3.5 bg-amber-50/50 border border-amber-200/80 rounded-xl space-y-2">
            <div className="flex items-center space-x-2 text-xs font-bold text-amber-950 uppercase tracking-wider">
              <UserCheck className="w-4 h-4 text-amber-700" />
              <span>Allocate Faculty / Staff In-Charge</span>
            </div>
            <SelectOrTypeInput
              id="subject-staff-select"
              value={assignedStaffId}
              onChange={(val) => setAssignedStaffId(val)}
              options={staffOptions}
              placeholder="-- Select faculty from registered staff --"
              typePlaceholder="Type faculty name (e.g. Dr. K. Ramesh, Visiting Faculty)..."
              customLabel="Type custom faculty name"
              dropdownLabel="Select registered staff"
              defaultValue=""
              suggestions={['Dr. S. K. Narayanan (Visiting Prof)', 'Guest Lecturer (Lab)', 'Adjunct Faculty']}
            />
            <p className="text-[11px] text-amber-900/80">
              Allocated faculty can view and manage their assigned courses in their staff dashboard.
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
              Subject Overview / Syllabus Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief course objectives, lab equipment requirements, or syllabus outline..."
              className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:bg-white resize-none"
            />
          </div>

          {/* Action Buttons: Reset Form & Submit */}
          <div className="flex items-center justify-between pt-4 border-t border-stone-200">
            <button
              type="button"
              onClick={resetFormToDefaults}
              className="inline-flex items-center space-x-1 px-3 py-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-lg transition"
              title="Reset all form fields to default"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              <span>Reset Form</span>
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
                id="save-subject-submit-btn"
                type="submit"
                disabled={loading}
                className="inline-flex items-center px-4 py-2 text-sm font-bold text-white bg-stone-900 hover:bg-stone-800 rounded-lg transition disabled:opacity-50 shadow-xs"
              >
                {loading ? 'Saving...' : subjectToEdit ? 'Save Changes' : 'Create & Allocate'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
