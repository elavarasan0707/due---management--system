import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Department, User, StudentClearanceRecord, SystemStats, Subject } from '../types';
import {
  Users,
  GraduationCap,
  Building,
  Building2,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Edit2,
  RotateCcw,
  Search,
  Filter,
  FileText,
  ShieldAlert,
  ShieldCheck,
  Eye,
  EyeOff,
  UserPlus,
  UserCheck,
  DollarSign,
  Clock,
  Layers,
  Check,
  BookOpen,
  Award,
  Printer,
} from 'lucide-react';
import { NoDueCertificate } from './NoDueCertificate';
import { EditUserModal } from './admin/EditUserModal';
import { DepartmentModal } from './admin/DepartmentModal';
import { AddStaffModal } from './admin/AddStaffModal';
import { ClearanceDetailModal } from './admin/ClearanceDetailModal';
import { SubjectModal } from './admin/SubjectModal';
import { AllocateStaffModal } from './admin/AllocateStaffModal';
import { SelectOrTypeInput, SelectOption } from './common/SelectOrTypeInput';

interface AdminPortalProps {
  onOpenResetModal: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({ onOpenResetModal }) => {
  const { token, user } = useAuth();

  const [activeTab, setActiveTab] = useState<'students' | 'hods' | 'staffs' | 'departments' | 'subjects' | 'clearances' | 'logs'>('students');
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [clearances, setClearances] = useState<StudentClearanceRecord[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showAddHodModal, setShowAddHodModal] = useState(false);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [departmentModalData, setDepartmentModalData] = useState<{ open: boolean; dept: Department | null }>({
    open: false,
    dept: null,
  });

  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [allocatingSubject, setAllocatingSubject] = useState<Subject | null>(null);
  const [subjectSemesterFilter, setSubjectSemesterFilter] = useState<number | ''>('');
  const [subjectAllocationFilter, setSubjectAllocationFilter] = useState<'all' | 'allocated' | 'unassigned'>('all');

  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [inspectingClearance, setInspectingClearance] = useState<StudentClearanceRecord | null>(null);
  const [selectedCertClearance, setSelectedCertClearance] = useState<StudentClearanceRecord | null>(null);
  const [autoPrintCert, setAutoPrintCert] = useState(false);

  // Password visibility map (userId -> boolean)
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});

  // Form states - Add HOD
  const [hodName, setHodName] = useState('');
  const [hodUsername, setHodUsername] = useState('');
  const [hodEmail, setHodEmail] = useState('');
  const [hodPassword, setHodPassword] = useState('hod123');
  const [hodDeptId, setHodDeptId] = useState('');
  const [hodPhone, setHodPhone] = useState('');

  // Form states - Add Student
  const [studName, setStudName] = useState('');
  const [studRollNo, setStudRollNo] = useState('');
  const [studRegNo, setStudRegNo] = useState('');
  const [studEmail, setStudEmail] = useState('');
  const [studPassword, setStudPassword] = useState('student123');
  const [studDeptId, setStudDeptId] = useState('');
  const [studDegree, setStudDegree] = useState('B.E. Computer Science');
  const [studBatch, setStudBatch] = useState('2021 - 2025');
  const [studSemester, setStudSemester] = useState(8);
  const [studHosteler, setStudHosteler] = useState(false);
  const [studPhone, setStudPhone] = useState('');

  // Bulk CSV student import modal
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkCsv, setBulkCsv] = useState('');

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const headers = { Authorization: `Bearer ${token}` };

      const [statsRes, deptsRes, usersRes, clrRes, logsRes, subjRes] = await Promise.all([
        fetch('/api/stats', { headers }),
        fetch('/api/departments'),
        fetch('/api/users', { headers }),
        fetch('/api/clearances', { headers }),
        fetch('/api/audit-logs', { headers }),
        fetch('/api/subjects', { headers }),
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (deptsRes.ok) {
        const d = await deptsRes.json();
        setDepartments(d);
        if (d.length > 0 && !hodDeptId) setHodDeptId(d[0].id);
        if (d.length > 0 && !studDeptId) setStudDeptId(d[0].id);
      }
      if (usersRes.ok) setUsersList(await usersRes.json());
      if (clrRes.ok) setClearances(await clrRes.json());
      if (logsRes.ok) setAuditLogs(await logsRes.json());
      if (subjRes.ok) setSubjects(await subjRes.json());
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const handleDeleteSubject = async (subjectId: string, subjectCode: string, subjectName: string) => {
    if (!confirm(`Are you sure you want to delete subject ${subjectCode} - "${subjectName}"?`)) return;
    try {
      const res = await fetch(`/api/subjects/${subjectId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete subject');
      setFormSuccess(`Subject ${subjectCode} removed successfully.`);
      fetchData();
    } catch (err: any) {
      setFormError(err.message);
    }
  };

  const togglePasswordVisibility = (userId: string) => {
    setRevealedPasswords((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  // Handle Add HOD
  const handleAddHod = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    try {
      const res = await fetch('/api/admin/hod', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: hodName.trim(),
          username: hodUsername.trim().toLowerCase(),
          email: hodEmail.trim(),
          password: hodPassword.trim(),
          departmentId: hodDeptId,
          phone: hodPhone.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create HOD');

      setFormSuccess(`HOD ${data.name} appointed successfully.`);
      setShowAddHodModal(false);
      setHodName('');
      setHodUsername('');
      setHodEmail('');
      setHodPhone('');
      fetchData();
    } catch (err: any) {
      setFormError(err.message);
    }
  };

  // Handle Add Student
  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    try {
      const res = await fetch('/api/admin/student', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: studName.trim(),
          rollNo: studRollNo.trim().toUpperCase(),
          registerNo: studRegNo.trim(),
          email: studEmail.trim(),
          password: studPassword.trim(),
          departmentId: studDeptId,
          degree: studDegree.trim(),
          batchYear: studBatch.trim(),
          semester: Number(studSemester),
          isHosteler: studHosteler,
          phone: studPhone.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to register student');

      setFormSuccess(`Student ${data.name} (${data.rollNo}) registered successfully. Password: "${studPassword.trim()}"`);
      setShowAddStudentModal(false);
      setStudName('');
      setStudRollNo('');
      setStudRegNo('');
      setStudEmail('');
      setStudPassword('student123');
      setStudPhone('');
      fetchData();
    } catch (err: any) {
      setFormError(err.message);
    }
  };

  // Handle Bulk Student CSV Import
  const handleBulkImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkCsv.trim()) return;

    try {
      setLoading(true);
      const lines = bulkCsv.trim().split('\n');
      let createdCount = 0;

      for (const line of lines) {
        const parts = line.split(',').map((p) => p.trim());
        if (parts.length >= 3) {
          const [roll, name, email, deptCode, pass] = parts;
          const targetDept = departments.find(
            (d) => d.code.toLowerCase() === (deptCode || '').toLowerCase()
          ) || departments[0];

          if (roll && name && targetDept) {
            await fetch('/api/admin/student', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                rollNo: roll.toUpperCase(),
                name,
                email: email || `${roll.toLowerCase()}@college.edu`,
                departmentId: targetDept.id,
                password: pass || 'student123',
                degree: 'B.E. Engineering',
                batchYear: '2021 - 2025',
                semester: 8,
              }),
            });
            createdCount++;
          }
        }
      }

      setFormSuccess(`Successfully registered ${createdCount} students from CSV.`);
      setShowBulkModal(false);
      setBulkCsv('');
      fetchData();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle Delete User (Student, HOD, or Staff)
  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to permanently delete user "${userName}"?\n\nThis will remove their login access and any associated clearance records.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete user');

      setFormSuccess(`User "${userName}" was successfully deleted.`);
      fetchData();
    } catch (err: any) {
      setFormError(err.message);
    }
  };

  // Handle Delete Department
  const handleDeleteDepartment = async (deptId: string, deptName: string) => {
    if (!confirm(`Are you sure you want to delete department "${deptName}"?\nNote: Departments with enrolled students cannot be deleted.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/departments/${deptId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete department');

      setFormSuccess(`Department "${deptName}" was successfully deleted.`);
      fetchData();
    } catch (err: any) {
      setFormError(err.message);
    }
  };

  // Derived filtered user lists
  const students = usersList.filter((u) => u.role === 'STUDENT');
  const hods = usersList.filter((u) => u.role === 'HOD');
  const staffs = usersList.filter((u) => u.role === 'STAFF');

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.rollNo && s.rollNo.toLowerCase().includes(searchQuery.toLowerCase())) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = !selectedDeptFilter || s.departmentId === selectedDeptFilter;
    return matchesSearch && matchesDept;
  });

  const filteredHods = hods.filter((h) => {
    return (
      h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (h.departmentName && h.departmentName.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  const filteredStaffs = staffs.filter((st) => {
    return (
      st.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (st.staffId && st.staffId.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (st.clearanceScope && st.clearanceScope.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (st.departmentName && st.departmentName.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  const filteredClearances = clearances.filter((c) => {
    const matchesSearch =
      c.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.studentRollNo.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = !selectedDeptFilter || c.studentDepartmentId === selectedDeptFilter;
    return matchesSearch && matchesDept;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner with Stats & Controls */}
      <div className="bg-stone-900 text-white rounded-2xl p-6 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-full bg-stone-800 border border-stone-700 text-amber-400 text-xs font-semibold mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Full System Master Control</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">
              Autonomous College Administration &amp; Clearance Directorate
            </h1>
            <p className="text-xs text-stone-400 mt-1 max-w-2xl">
              Manage departments, allocate HODs and Staff, register students, configure clearance checkpoints, and issue digitally verified No Due certificates.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onOpenResetModal}
              className="inline-flex items-center space-x-1.5 px-3 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-xl text-xs font-semibold border border-stone-700 transition"
              title="Reset or reseed database"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <span>System Reset</span>
            </button>
          </div>
        </div>

        {/* Quick KPI Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 mt-6 pt-6 border-t border-stone-800">
          <div className="bg-stone-800/60 p-3 rounded-xl border border-stone-800">
            <span className="text-[11px] text-stone-400 block font-medium">Departments</span>
            <span className="text-lg font-bold text-white font-mono mt-0.5 block">
              {stats?.totalDepartments || departments.length}
            </span>
          </div>

          <div className="bg-stone-800/60 p-3 rounded-xl border border-stone-800">
            <span className="text-[11px] text-stone-400 block font-medium">HODs Appointed</span>
            <span className="text-lg font-bold text-white font-mono mt-0.5 block">
              {stats?.totalHods || hods.length}
            </span>
          </div>

          <div className="bg-stone-800/60 p-3 rounded-xl border border-stone-800">
            <span className="text-[11px] text-stone-400 block font-medium">Allocated Staff</span>
            <span className="text-lg font-bold text-white font-mono mt-0.5 block">
              {stats?.totalStaffs || staffs.length}
            </span>
          </div>

          <div className="bg-stone-800/60 p-3 rounded-xl border border-stone-800">
            <span className="text-[11px] text-amber-400 block font-medium">Subjects Allocated</span>
            <span className="text-lg font-bold text-amber-300 font-mono mt-0.5 block">
              {stats?.totalSubjects || subjects.length}
            </span>
          </div>

          <div className="bg-stone-800/60 p-3 rounded-xl border border-stone-800">
            <span className="text-[11px] text-stone-400 block font-medium">Enrolled Students</span>
            <span className="text-lg font-bold text-white font-mono mt-0.5 block">
              {stats?.totalStudents || students.length}
            </span>
          </div>

          <div className="bg-stone-800/60 p-3 rounded-xl border border-stone-800">
            <span className="text-[11px] text-emerald-400 block font-medium">100% Cleared</span>
            <span className="text-lg font-bold text-emerald-300 font-mono mt-0.5 block">
              {stats?.fullyClearedStudents || 0}
            </span>
          </div>

          <div className="bg-stone-800/60 p-3 rounded-xl border border-stone-800">
            <span className="text-[11px] text-rose-400 block font-medium">Active Dues (₹)</span>
            <span className="text-lg font-bold text-rose-300 font-mono mt-0.5 block">
              ₹{stats?.totalDuesRaisedAmount?.toLocaleString() || 0}
            </span>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {formSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center justify-between animate-in fade-in">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{formSuccess}</span>
          </div>
          <button
            type="button"
            onClick={() => setFormSuccess(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold ml-4"
          >
            ×
          </button>
        </div>
      )}

      {formError && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center justify-between animate-in fade-in">
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="font-medium">{formError}</span>
          </div>
          <button
            type="button"
            onClick={() => setFormError(null)}
            className="text-rose-700 hover:text-rose-900 font-bold ml-4"
          >
            ×
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-stone-200 space-x-1 overflow-x-auto pb-0.5 text-xs font-bold">
        <button
          type="button"
          onClick={() => { setActiveTab('students'); setSearchQuery(''); }}
          className={`flex items-center space-x-2 py-3 px-4 border-b-2 transition whitespace-nowrap ${
            activeTab === 'students'
              ? 'border-stone-900 text-stone-900 bg-white'
              : 'border-transparent text-stone-500 hover:text-stone-800 hover:bg-stone-50'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>Students Directory ({students.length})</span>
        </button>

        <button
          type="button"
          onClick={() => { setActiveTab('hods'); setSearchQuery(''); }}
          className={`flex items-center space-x-2 py-3 px-4 border-b-2 transition whitespace-nowrap ${
            activeTab === 'hods'
              ? 'border-stone-900 text-stone-900 bg-white'
              : 'border-transparent text-stone-500 hover:text-stone-800 hover:bg-stone-50'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>Department HODs ({hods.length})</span>
        </button>

        <button
          type="button"
          onClick={() => { setActiveTab('staffs'); setSearchQuery(''); }}
          className={`flex items-center space-x-2 py-3 px-4 border-b-2 transition whitespace-nowrap ${
            activeTab === 'staffs'
              ? 'border-stone-900 text-stone-900 bg-white'
              : 'border-transparent text-stone-500 hover:text-stone-800 hover:bg-stone-50'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Allocated Staff ({staffs.length})</span>
        </button>

        <button
          type="button"
          onClick={() => { setActiveTab('departments'); setSearchQuery(''); }}
          className={`flex items-center space-x-2 py-3 px-4 border-b-2 transition whitespace-nowrap ${
            activeTab === 'departments'
              ? 'border-stone-900 text-stone-900 bg-white'
              : 'border-transparent text-stone-500 hover:text-stone-800 hover:bg-stone-50'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Departments ({departments.length})</span>
        </button>

        <button
          type="button"
          id="admin-tab-subjects"
          onClick={() => { setActiveTab('subjects'); setSearchQuery(''); }}
          className={`flex items-center space-x-2 py-3 px-4 border-b-2 transition whitespace-nowrap ${
            activeTab === 'subjects'
              ? 'border-stone-900 text-stone-900 bg-white'
              : 'border-transparent text-stone-500 hover:text-stone-800 hover:bg-stone-50'
          }`}
        >
          <BookOpen className="w-4 h-4 text-amber-600" />
          <span>Subjects &amp; Allocation ({subjects.length})</span>
        </button>

        <button
          type="button"
          onClick={() => { setActiveTab('clearances'); setSearchQuery(''); }}
          className={`flex items-center space-x-2 py-3 px-4 border-b-2 transition whitespace-nowrap ${
            activeTab === 'clearances'
              ? 'border-stone-900 text-stone-900 bg-white'
              : 'border-transparent text-stone-500 hover:text-stone-800 hover:bg-stone-50'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Clearance Records ({clearances.length})</span>
        </button>

        <button
          type="button"
          onClick={() => { setActiveTab('logs'); setSearchQuery(''); }}
          className={`flex items-center space-x-2 py-3 px-4 border-b-2 transition whitespace-nowrap ${
            activeTab === 'logs'
              ? 'border-stone-900 text-stone-900 bg-white'
              : 'border-transparent text-stone-500 hover:text-stone-800 hover:bg-stone-50'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Security Audit Logs</span>
        </button>
      </div>

      {/* TAB 1: STUDENTS DIRECTORY (Full CRUD) */}
      {activeTab === 'students' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-stone-200">
            <div className="flex items-center space-x-2 flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search students by roll no, name, or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-900 placeholder:text-stone-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-900"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <div className="w-60">
                <SelectOrTypeInput
                  id="filter-clearance-dept"
                  value={selectedDeptFilter}
                  onChange={(val) => setSelectedDeptFilter(val)}
                  options={[
                    { value: '', label: 'All Departments' },
                    ...departments.map((d) => ({
                      value: d.id,
                      label: `${d.name} (${d.code})`,
                      subLabel: d.code,
                    })),
                  ]}
                  placeholder="All Departments"
                  typePlaceholder="Filter by department..."
                  defaultValue=""
                />
              </div>

              <button
                type="button"
                onClick={() => setShowBulkModal(true)}
                className="inline-flex items-center space-x-1 px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg text-xs font-bold transition"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>CSV Import</span>
              </button>

              <button
                type="button"
                onClick={() => setShowAddStudentModal(true)}
                className="inline-flex items-center space-x-1 px-3 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-bold transition shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Student</span>
              </button>
            </div>
          </div>

          {/* Students Table */}
          <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-stone-200 text-xs text-left">
                <thead className="bg-stone-50 text-stone-600 font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Roll No / User ID</th>
                    <th className="px-4 py-3">Student Name</th>
                    <th className="px-4 py-3">Department</th>
                    <th className="px-4 py-3">Login Password</th>
                    <th className="px-4 py-3">Hostel / Type</th>
                    <th className="px-4 py-3">Clearance Progress</th>
                    <th className="px-4 py-3 text-right">Actions (Edit / Delete)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 bg-white">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-stone-400">
                        No students found matching your criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((s) => {
                      const clr = clearances.find((c) => c.studentId === s.id);
                      const percent = clr && clr.totalCheckpoints > 0 ? Math.round((clr.clearedCheckpoints / clr.totalCheckpoints) * 100) : 0;
                      const hasDue = clr && clr.totalDueAmount > 0;
                      const isComplete = clr && clr.overallStatus === 'COMPLETED';
                      const isRevealed = Boolean(revealedPasswords[s.id]);

                      return (
                        <tr key={s.id} className="hover:bg-stone-50/60 transition">
                          <td className="px-4 py-3 font-mono font-bold text-stone-900">
                            {s.rollNo || s.username}
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-bold text-stone-900 block">{s.name}</span>
                            <span className="text-[11px] text-stone-500">{s.email}</span>
                          </td>
                          <td className="px-4 py-3 text-stone-700">
                            <span className="font-semibold">{s.departmentName}</span>
                            <span className="block text-[10px] text-stone-400 font-mono">Sem {s.semester || 8} • {s.batchYear}</span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center space-x-1.5">
                              <span className="font-mono text-[11px] bg-stone-100 px-2 py-0.5 rounded text-stone-800">
                                {isRevealed ? s.password : '••••••••'}
                              </span>
                              <button
                                type="button"
                                onClick={() => togglePasswordVisibility(s.id)}
                                className="text-stone-400 hover:text-stone-700 p-0.5"
                                title={isRevealed ? 'Hide Password' : 'Show Password'}
                              >
                                {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded ${
                              s.isHosteler ? 'bg-indigo-50 text-indigo-800 border border-indigo-200' : 'bg-stone-100 text-stone-700'
                            }`}>
                              {s.isHosteler ? 'Hosteler' : 'Day Scholar'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="w-36">
                              <div className="flex items-center justify-between text-[10px] mb-1">
                                <span className={hasDue ? 'text-rose-600 font-bold' : isComplete ? 'text-emerald-700 font-bold' : 'text-stone-600'}>
                                  {isComplete ? '100% Cleared' : hasDue ? `Due: ₹${clr?.totalDueAmount}` : `${clr?.clearedCheckpoints || 0}/${clr?.totalCheckpoints || 0} Cleared`}
                                </span>
                                <span className="font-mono">{percent}%</span>
                              </div>
                              <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full transition-all ${
                                    hasDue ? 'bg-rose-500' : isComplete ? 'bg-emerald-500' : 'bg-amber-500'
                                  }`}
                                  style={{ width: `${percent}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end space-x-1">
                              {clr && (
                                <button
                                  type="button"
                                  onClick={() => setInspectingClearance(clr)}
                                  className="p-1 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded transition"
                                  title="Inspect & Edit Clearance Checkpoints"
                                >
                                  <FileText className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {isComplete && clr && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setAutoPrintCert(true);
                                    setSelectedCertClearance(clr);
                                  }}
                                  className="inline-flex items-center px-2 py-1 bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200 rounded text-[10px] font-bold transition shadow-2xs cursor-pointer active:scale-95"
                                  title="View & Print Official Certificate"
                                >
                                  <Printer className="w-3 h-3 mr-1 text-amber-700" />
                                  <span>Print Cert</span>
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => setEditingUser(s)}
                                className="p-1 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded transition"
                                title="Edit Student & Password"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteUser(s.id, s.name)}
                                className="p-1 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                                title="Delete Student"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: HODs (Full CRUD) */}
      {activeTab === 'hods' && (
        <div className="space-y-4">
          <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-xs">
            <div className="p-4 bg-stone-50 border-b border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                  Appointed Department Heads (HODs)
                </h3>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  Admin appoints HODs with full department oversight. HODs allocate staff and endorse student clearance.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddHodModal(true)}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-stone-900 text-white rounded-lg text-xs font-bold hover:bg-stone-800 transition shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Appoint HOD</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-stone-200 text-xs text-left">
                <thead className="bg-stone-50 text-stone-600 font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="px-4 py-3">HOD Name</th>
                    <th className="px-4 py-3">Assigned Department</th>
                    <th className="px-4 py-3">Username (Login ID)</th>
                    <th className="px-4 py-3">Password</th>
                    <th className="px-4 py-3">Allocated Staff</th>
                    <th className="px-4 py-3 text-right">Actions (Edit / Delete)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 bg-white">
                  {filteredHods.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-stone-400">
                        No HODs registered yet. Click "Appoint HOD" above.
                      </td>
                    </tr>
                  ) : (
                    filteredHods.map((h) => {
                      const allocatedCount = staffs.filter((st) => st.departmentId === h.departmentId).length;
                      const isRevealed = Boolean(revealedPasswords[h.id]);

                      return (
                        <tr key={h.id} className="hover:bg-stone-50/60 transition">
                          <td className="px-4 py-3">
                            <span className="font-bold text-stone-900 block">{h.name}</span>
                            <span className="text-[11px] text-stone-500">{h.email}</span>
                          </td>
                          <td className="px-4 py-3 font-semibold text-stone-800">
                            {h.departmentName}
                          </td>
                          <td className="px-4 py-3 font-mono font-bold text-stone-900">
                            {h.username}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center space-x-1.5">
                              <span className="font-mono text-[11px] bg-stone-100 px-2 py-0.5 rounded text-stone-800">
                                {isRevealed ? h.password : '••••••••'}
                              </span>
                              <button
                                type="button"
                                onClick={() => togglePasswordVisibility(h.id)}
                                className="text-stone-400 hover:text-stone-700 p-0.5"
                                title={isRevealed ? 'Hide Password' : 'Show Password'}
                              >
                                {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
                              {allocatedCount} Staff Members
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end space-x-1">
                              <button
                                type="button"
                                onClick={() => setEditingUser(h)}
                                className="p-1 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded transition"
                                title="Edit HOD & Password"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteUser(h.id, h.name)}
                                className="p-1 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                                title="Remove HOD"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ALLOCATED STAFF (Full CRUD) */}
      {activeTab === 'staffs' && (
        <div className="space-y-4">
          <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-xs">
            <div className="p-4 bg-stone-50 border-b border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                  Staff Members Allocated Across Departments
                </h3>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  Allocated staff members verify student checkpoints, endorse clearances, or raise lab/library dues.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddStaffModal(true)}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-stone-900 text-white rounded-lg text-xs font-bold hover:bg-stone-800 transition shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Allocate Staff</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-stone-200 text-xs text-left">
                <thead className="bg-stone-50 text-stone-600 font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Staff ID (Login ID)</th>
                    <th className="px-4 py-3">Staff Name</th>
                    <th className="px-4 py-3">Designation &amp; Clearance Scope</th>
                    <th className="px-4 py-3">Department</th>
                    <th className="px-4 py-3">Password</th>
                    <th className="px-4 py-3 text-right">Actions (Edit / Delete)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 bg-white">
                  {filteredStaffs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-stone-400">
                        No staff members allocated yet. Click "Allocate Staff" to assign staff.
                      </td>
                    </tr>
                  ) : (
                    filteredStaffs.map((st) => {
                      const isRevealed = Boolean(revealedPasswords[st.id]);
                      return (
                        <tr key={st.id} className="hover:bg-stone-50/60 transition">
                          <td className="px-4 py-3 font-mono font-bold text-stone-900">
                            {st.staffId || st.username}
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-bold text-stone-900 block">{st.name}</span>
                            <span className="text-[11px] text-stone-500">{st.email}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-semibold text-stone-800 block">{st.designation}</span>
                            <span className="text-[10px] text-stone-500">{st.clearanceScope}</span>
                          </td>
                          <td className="px-4 py-3 text-stone-700">
                            {st.departmentName || 'Central Office'}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center space-x-1.5">
                              <span className="font-mono text-[11px] bg-stone-100 px-2 py-0.5 rounded text-stone-800">
                                {isRevealed ? st.password : '••••••••'}
                              </span>
                              <button
                                type="button"
                                onClick={() => togglePasswordVisibility(st.id)}
                                className="text-stone-400 hover:text-stone-700 p-0.5"
                                title={isRevealed ? 'Hide Password' : 'Show Password'}
                              >
                                {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end space-x-1">
                              <button
                                type="button"
                                onClick={() => setEditingUser(st)}
                                className="p-1 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded transition"
                                title="Edit Staff & Password"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteUser(st.id, st.name)}
                                className="p-1 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                                title="Revoke Staff"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: DEPARTMENTS (Full CRUD) */}
      {activeTab === 'departments' && (
        <div className="space-y-4">
          <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-xs">
            <div className="p-4 bg-stone-50 border-b border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                  Academic Departments &amp; Faculty Divisions
                </h3>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  Configure department codes, program descriptions, and assign executive Head of Department (HOD).
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDepartmentModalData({ open: true, dept: null })}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-stone-900 text-white rounded-lg text-xs font-bold hover:bg-stone-800 transition shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Department</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-stone-200 text-xs text-left">
                <thead className="bg-stone-50 text-stone-600 font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Code</th>
                    <th className="px-4 py-3">Department Name</th>
                    <th className="px-4 py-3">Assigned Head (HOD)</th>
                    <th className="px-4 py-3">Enrolled Students</th>
                    <th className="px-4 py-3">Allocated Staff</th>
                    <th className="px-4 py-3 text-right">Actions (Edit / Delete)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 bg-white">
                  {departments.map((d) => {
                    const studentCount = students.filter((s) => s.departmentId === d.id).length;
                    const staffCount = staffs.filter((st) => st.departmentId === d.id).length;

                    return (
                      <tr key={d.id} className="hover:bg-stone-50/60 transition">
                        <td className="px-4 py-3 font-mono font-bold text-stone-900">
                          {d.code}
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-bold text-stone-900 block">{d.name}</span>
                          <span className="text-[11px] text-stone-500">{d.description || 'No description provided'}</span>
                        </td>
                        <td className="px-4 py-3">
                          {d.hodName ? (
                            <div>
                              <span className="font-semibold text-stone-900 block">{d.hodName}</span>
                              <span className="text-[10px] text-stone-500">{d.hodEmail}</span>
                            </div>
                          ) : (
                            <span className="italic text-stone-400">Not Assigned</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-900 border border-amber-200">
                            {studentCount} Students
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-50 text-indigo-900 border border-indigo-200">
                            {staffCount} Staff
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end space-x-1">
                            <button
                              type="button"
                              onClick={() => setDepartmentModalData({ open: true, dept: d })}
                              className="p-1 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded transition"
                              title="Edit Department"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteDepartment(d.id, d.name)}
                              className="p-1 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                              title="Delete Department"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB: SUBJECTS & FACULTY ALLOCATION */}
      {activeTab === 'subjects' && (
        <div className="space-y-4">
          {/* Action & Filter Bar */}
          <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs space-y-3">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              {/* Search Bar */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search subject code, title, or allocated faculty..."
                  className="w-full pl-9 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:bg-white"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  id="add-subject-btn"
                  onClick={() => {
                    setEditingSubject(null);
                    setShowSubjectModal(true);
                  }}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-bold transition shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5 text-amber-400" />
                  <span>Add Subject &amp; Allocate</span>
                </button>
              </div>
            </div>

            {/* Filter Pills / Dropdowns */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-stone-100 text-xs">
              <span className="text-stone-400 text-[11px] font-semibold flex items-center mr-1">
                <Filter className="w-3 h-3 mr-1" />
                Filters:
              </span>

              {/* Department Filter with SelectOrTypeInput */}
              <div className="w-56">
                <SelectOrTypeInput
                  id="filter-subj-dept"
                  value={selectedDeptFilter}
                  onChange={(val) => setSelectedDeptFilter(val)}
                  options={[
                    { value: '', label: `All Departments (${departments.length})` },
                    ...departments.map((d) => ({
                      value: d.id,
                      label: `${d.code} - ${d.name}`,
                      subLabel: d.code,
                    })),
                  ]}
                  placeholder="All Departments"
                  typePlaceholder="Filter by department..."
                  defaultValue=""
                />
              </div>

              {/* Semester Filter with SelectOrTypeInput */}
              <div className="w-44">
                <SelectOrTypeInput
                  id="filter-subj-semester"
                  value={subjectSemesterFilter !== '' ? String(subjectSemesterFilter) : ''}
                  onChange={(val) => setSubjectSemesterFilter(val ? Number(val) : '')}
                  options={[
                    { value: '', label: 'All Semesters (1 - 8)' },
                    ...[1, 2, 3, 4, 5, 6, 7, 8].map((s) => ({
                      value: String(s),
                      label: `Semester ${s}`,
                    })),
                  ]}
                  placeholder="All Semesters"
                  typePlaceholder="Filter semester..."
                  defaultValue=""
                />
              </div>

              {/* Reset Filters Button */}
              {(selectedDeptFilter || subjectSemesterFilter !== '' || subjectAllocationFilter !== 'all' || searchQuery) && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDeptFilter('');
                    setSubjectSemesterFilter('');
                    setSubjectAllocationFilter('all');
                    setSearchQuery('');
                  }}
                  className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-semibold transition"
                  title="Reset all filters"
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-1" />
                  <span>Reset Filters</span>
                </button>
              )}

              {/* Allocation Filter */}
              <div className="inline-flex rounded-lg border border-stone-200 bg-stone-50 p-0.5 text-xs font-semibold ml-auto">
                <button
                  type="button"
                  onClick={() => setSubjectAllocationFilter('all')}
                  className={`px-2.5 py-1 rounded-md transition ${
                    subjectAllocationFilter === 'all'
                      ? 'bg-white text-stone-900 shadow-xs'
                      : 'text-stone-500 hover:text-stone-800'
                  }`}
                >
                  All ({subjects.length})
                </button>
                <button
                  type="button"
                  onClick={() => setSubjectAllocationFilter('allocated')}
                  className={`px-2.5 py-1 rounded-md transition ${
                    subjectAllocationFilter === 'allocated'
                      ? 'bg-white text-emerald-800 shadow-xs'
                      : 'text-stone-500 hover:text-stone-800'
                  }`}
                >
                  Allocated ({subjects.filter((s) => s.assignedStaffId).length})
                </button>
                <button
                  type="button"
                  onClick={() => setSubjectAllocationFilter('unassigned')}
                  className={`px-2.5 py-1 rounded-md transition ${
                    subjectAllocationFilter === 'unassigned'
                      ? 'bg-white text-amber-800 shadow-xs'
                      : 'text-stone-500 hover:text-stone-800'
                  }`}
                >
                  Vacant ({subjects.filter((s) => !s.assignedStaffId).length})
                </button>
              </div>
            </div>
          </div>

          {/* Guidance Banner */}
          <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-amber-950 text-xs flex items-start space-x-2.5">
            <BookOpen className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold block">Academic Course &amp; Staff Allocation Directorate</strong>
              Admin can create theory and practical subjects for all semesters and assign teachers/lab in-charges. Allocated staff oversee coursework, laboratory equipment, and validate student clearance checkpoints.
            </div>
          </div>

          {/* Subjects Table */}
          <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-stone-600">
                <thead className="bg-stone-50 border-b border-stone-200 font-bold text-stone-700 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="px-4 py-3">Subject Code &amp; Type</th>
                    <th className="px-4 py-3">Course Title &amp; Credits</th>
                    <th className="px-4 py-3">Department &amp; Sem</th>
                    <th className="px-4 py-3">Allocated Faculty In-Charge</th>
                    <th className="px-4 py-3 text-right">Actions (Allocate / Edit / Delete)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 bg-white">
                  {subjects
                    .filter((s) => {
                      const matchesSearch =
                        !searchQuery.trim() ||
                        s.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (s.assignedStaffName && s.assignedStaffName.toLowerCase().includes(searchQuery.toLowerCase())) ||
                        (s.departmentCode && s.departmentCode.toLowerCase().includes(searchQuery.toLowerCase()));

                      const matchesDept = !selectedDeptFilter || s.departmentId === selectedDeptFilter;
                      const matchesSemester = subjectSemesterFilter === '' || s.semester === Number(subjectSemesterFilter);
                      const matchesAllocation =
                        subjectAllocationFilter === 'all'
                          ? true
                          : subjectAllocationFilter === 'allocated'
                          ? Boolean(s.assignedStaffId)
                          : !s.assignedStaffId;

                      return matchesSearch && matchesDept && matchesSemester && matchesAllocation;
                    })
                    .map((subj) => {
                      const dept = departments.find((d) => d.id === subj.departmentId);

                      return (
                        <tr key={subj.id} className="hover:bg-stone-50/60 transition">
                          <td className="px-4 py-3">
                            <div className="flex items-center space-x-2">
                              <span className="font-mono font-bold text-stone-900 text-sm">{subj.code}</span>
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  subj.type === 'PRACTICAL'
                                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                    : subj.type === 'PROJECT'
                                    ? 'bg-purple-50 text-purple-800 border border-purple-200'
                                    : 'bg-blue-50 text-blue-800 border border-blue-200'
                                }`}
                              >
                                {subj.type}
                              </span>
                            </div>
                          </td>

                          <td className="px-4 py-3">
                            <span className="font-bold text-stone-900 block">{subj.name}</span>
                            <div className="flex items-center space-x-2 text-[11px] text-stone-500 mt-0.5">
                              <span>Credits: {subj.credits ?? 3}</span>
                              {subj.batchYear && <span>• Batch: {subj.batchYear}</span>}
                            </div>
                          </td>

                          <td className="px-4 py-3">
                            <span className="font-bold text-stone-900 block">
                              {dept ? dept.code : subj.departmentCode || 'Dept'}
                            </span>
                            <span className="text-[11px] text-stone-500">Semester {subj.semester}</span>
                          </td>

                          <td className="px-4 py-3">
                            {subj.assignedStaffId ? (
                              <div className="flex items-center space-x-2.5">
                                <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold text-xs">
                                  {subj.assignedStaffName ? subj.assignedStaffName.charAt(0).toUpperCase() : 'F'}
                                </div>
                                <div>
                                  <div className="font-bold text-stone-900">{subj.assignedStaffName}</div>
                                  <div className="text-[10px] text-stone-500">
                                    {subj.assignedStaffDesignation || 'Faculty In-Charge'}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-semibold">
                                <AlertCircle className="w-3 h-3 text-amber-600" />
                                <span>Unassigned (Vacant)</span>
                              </div>
                            )}
                          </td>

                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end space-x-1.5">
                              <button
                                type="button"
                                onClick={() => setAllocatingSubject(subj)}
                                className="inline-flex items-center px-2 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded text-[11px] font-semibold transition"
                                title="Allocate or Change Faculty"
                              >
                                <UserCheck className="w-3 h-3 mr-1 text-amber-600" />
                                <span>{subj.assignedStaffId ? 'Change Faculty' : 'Allocate'}</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingSubject(subj);
                                  setShowSubjectModal(true);
                                }}
                                className="p-1 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded transition"
                                title="Edit Subject Details"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteSubject(subj.id, subj.code, subj.name)}
                                className="p-1 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                                title="Delete Subject"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                  {subjects.filter((s) => {
                    const matchesSearch =
                      !searchQuery.trim() ||
                      s.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      (s.assignedStaffName && s.assignedStaffName.toLowerCase().includes(searchQuery.toLowerCase())) ||
                      (s.departmentCode && s.departmentCode.toLowerCase().includes(searchQuery.toLowerCase()));
                    const matchesDept = !selectedDeptFilter || s.departmentId === selectedDeptFilter;
                    const matchesSemester = subjectSemesterFilter === '' || s.semester === Number(subjectSemesterFilter);
                    const matchesAllocation =
                      subjectAllocationFilter === 'all'
                        ? true
                        : subjectAllocationFilter === 'allocated'
                        ? Boolean(s.assignedStaffId)
                        : !s.assignedStaffId;
                    return matchesSearch && matchesDept && matchesSemester && matchesAllocation;
                  }).length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-stone-400">
                        <BookOpen className="w-8 h-8 mx-auto mb-2 text-stone-300" />
                        <p className="font-semibold text-stone-700">No subjects found</p>
                        <p className="text-xs text-stone-500 mt-1">
                          No course matching your search or filters. Click &quot;Add Subject &amp; Allocate&quot; to register a new course.
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: CLEARANCE RECORDS & CHECKPOINT INSPECTOR */}
      {activeTab === 'clearances' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-stone-200">
            <div className="relative flex-1 max-w-md">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search clearances by student name or roll no..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-900"
              />
            </div>

            <div className="flex items-center space-x-2">
              <div className="w-60">
                <SelectOrTypeInput
                  id="filter-users-dept"
                  value={selectedDeptFilter}
                  onChange={(val) => setSelectedDeptFilter(val)}
                  options={[
                    { value: '', label: 'All Departments' },
                    ...departments.map((d) => ({
                      value: d.id,
                      label: `${d.name} (${d.code})`,
                      subLabel: d.code,
                    })),
                  ]}
                  placeholder="All Departments"
                  typePlaceholder="Filter by department..."
                  defaultValue=""
                />
              </div>
            </div>
          </div>

          <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-stone-200 text-xs text-left">
                <thead className="bg-stone-50 text-stone-600 font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Roll No</th>
                    <th className="px-4 py-3">Student Name</th>
                    <th className="px-4 py-3">Department</th>
                    <th className="px-4 py-3">Checkpoints Progress</th>
                    <th className="px-4 py-3">Dues Total</th>
                    <th className="px-4 py-3">Overall Status</th>
                    <th className="px-4 py-3 text-right">Inspect Checkpoints</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 bg-white">
                  {filteredClearances.map((c) => {
                    const percent = Math.round((c.clearedCheckpoints / c.totalCheckpoints) * 100);
                    return (
                      <tr key={c.id} className="hover:bg-stone-50/60 transition">
                        <td className="px-4 py-3 font-mono font-bold text-stone-900">
                          {c.studentRollNo}
                        </td>
                        <td className="px-4 py-3 font-bold text-stone-900">
                          {c.studentName}
                        </td>
                        <td className="px-4 py-3 text-stone-700">
                          {c.studentDepartmentName}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-stone-900">
                              {c.clearedCheckpoints}/{c.totalCheckpoints}
                            </span>
                            <span className="text-[10px] text-stone-500 font-mono">({percent}%)</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono">
                          <span className={c.totalDueAmount > 0 ? 'text-rose-600 font-bold' : 'text-emerald-700 font-bold'}>
                            ₹{c.totalDueAmount.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {c.overallStatus === 'COMPLETED' ? (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Completed</span>
                            </span>
                          ) : c.overallStatus === 'HAS_DUES' ? (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
                              <AlertCircle className="w-3 h-3 text-rose-600" />
                              <span>Has Dues</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              <Clock className="w-3 h-3 text-amber-600" />
                              <span>In Progress</span>
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            {c.overallStatus === 'COMPLETED' && (
                              <button
                                type="button"
                                onClick={() => {
                                  setAutoPrintCert(true);
                                  setSelectedCertClearance(c);
                                }}
                                className="inline-flex items-center space-x-1 px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded text-xs font-bold transition shadow-2xs cursor-pointer active:scale-95"
                                title="Print Official No-Due Certificate"
                              >
                                <Printer className="w-3 h-3 text-stone-950" />
                                <span>Print Cert</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => setInspectingClearance(c)}
                              className="inline-flex items-center space-x-1 px-2.5 py-1 bg-stone-900 hover:bg-stone-800 text-white rounded text-xs font-bold transition cursor-pointer"
                            >
                              <FileText className="w-3 h-3" />
                              <span>Inspect &amp; Edit</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: SECURITY AUDIT LOGS */}
      {activeTab === 'logs' && (
        <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-xs">
          <div className="p-4 bg-stone-50 border-b border-stone-200">
            <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
              Immutable System Activity &amp; Audit Trail
            </h3>
            <p className="text-[11px] text-stone-500 mt-0.5">
              Tracks every creation, edit, due settlement, clearance sign-off, and administrative action.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-stone-200 text-xs text-left">
              <thead className="bg-stone-50 text-stone-600 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Actor / Role</th>
                  <th className="px-4 py-3">Audit Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-mono text-[11px]">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-stone-50">
                    <td className="px-4 py-2.5 text-stone-500">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-4 py-2.5 font-bold text-stone-900">
                      {log.action}
                    </td>
                    <td className="px-4 py-2.5 text-stone-700">
                      {log.performedBy} ({log.performedByRole})
                    </td>
                    <td className="px-4 py-2.5 text-stone-800 font-sans">
                      {log.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADD HOD MODAL */}
      {showAddHodModal && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200 animate-in fade-in zoom-in duration-150">
            <h3 className="text-base font-bold text-stone-900 pb-3 border-b border-stone-100">
              Appoint Department Head (HOD)
            </h3>
            <form onSubmit={handleAddHod} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-stone-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. K. Ramanathan"
                  value={hodName}
                  onChange={(e) => setHodName(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Username (Login ID)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. hod_cse"
                    value={hodUsername}
                    onChange={(e) => setHodUsername(e.target.value.toLowerCase())}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-900 font-mono"
                  />
                </div>
                <div>
                  <SelectOrTypeInput
                    id="add-hod-dept-select"
                    label="Department"
                    value={hodDeptId}
                    onChange={(val) => setHodDeptId(val)}
                    options={departments.map((d) => ({
                      value: d.id,
                      label: `${d.name} (${d.code})`,
                      subLabel: d.code,
                    }))}
                    placeholder="Select department..."
                    typePlaceholder="Type custom department..."
                    defaultValue={departments[0]?.id || ''}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Official Email</label>
                  <input
                    type="email"
                    required
                    placeholder="hod@college.edu"
                    value={hodEmail}
                    onChange={(e) => setHodEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Contact Phone</label>
                  <input
                    type="text"
                    placeholder="+91 98765 43210"
                    value={hodPhone}
                    onChange={(e) => setHodPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-900"
                  />
                </div>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <label className="block font-bold text-amber-950 mb-1">Initial Password</label>
                <input
                  type="text"
                  required
                  value={hodPassword}
                  onChange={(e) => setHodPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-amber-300 rounded-lg font-mono text-stone-900"
                />
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => {
                    setHodName('');
                    setHodUsername('');
                    setHodEmail('');
                    setHodPassword('hod123');
                    setHodDeptId(departments[0]?.id || '');
                    setHodPhone('');
                  }}
                  className="inline-flex items-center space-x-1 px-3 py-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-lg transition"
                  title="Reset form fields"
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-1" />
                  <span>Reset Form</span>
                </button>

                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowAddHodModal(false)}
                    className="px-4 py-2 text-stone-600 hover:text-stone-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-stone-900 text-white font-bold rounded-lg hover:bg-stone-800"
                  >
                    Appoint HOD
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD STUDENT MODAL */}
      {showAddStudentModal && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-stone-200 animate-in fade-in zoom-in duration-150 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-stone-900 pb-3 border-b border-stone-100">
              Register Student &amp; Provision Clearance Record
            </h3>
            <form onSubmit={handleAddStudent} className="mt-4 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Roll Number (Login ID)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 21CS101"
                    value={studRollNo}
                    onChange={(e) => setStudRollNo(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg font-mono font-bold text-stone-900 uppercase"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">University Register No</label>
                  <input
                    type="text"
                    placeholder="e.g. 710021104001"
                    value={studRegNo}
                    onChange={(e) => setStudRegNo(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Student Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Karthik Raja S"
                  value={studName}
                  onChange={(e) => setStudName(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <SelectOrTypeInput
                    id="add-student-dept-select"
                    label="Department"
                    value={studDeptId}
                    onChange={(val) => setStudDeptId(val)}
                    options={departments.map((d) => ({
                      value: d.id,
                      label: `${d.name} (${d.code})`,
                      subLabel: d.code,
                    }))}
                    placeholder="Select department..."
                    typePlaceholder="Type custom department..."
                    defaultValue={departments[0]?.id || ''}
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Batch / Academic Year</label>
                  <input
                    type="text"
                    required
                    value={studBatch}
                    onChange={(e) => setStudBatch(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    placeholder="student@college.edu"
                    value={studEmail}
                    onChange={(e) => setStudEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="+91 98765 43210"
                    value={studPhone}
                    onChange={(e) => setStudPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-900"
                  />
                </div>
              </div>

              {/* Password Allocation */}
              <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl">
                <label className="block font-bold text-amber-950 mb-1">
                  Student Login Password (Admin Assigned)
                </label>
                <input
                  type="text"
                  required
                  value={studPassword}
                  onChange={(e) => setStudPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-amber-300 rounded-lg font-mono text-stone-900 font-bold"
                />
                <p className="text-[10px] text-amber-800 mt-1">
                  The student can immediately log in by typing their Roll No (e.g. <b>{studRollNo || '21CS101'}</b>) and this password.
                </p>
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="stud-hostel-check"
                  checked={studHosteler}
                  onChange={(e) => setStudHosteler(e.target.checked)}
                  className="rounded border-stone-300 text-stone-900"
                />
                <label htmlFor="stud-hostel-check" className="text-stone-800 font-semibold cursor-pointer">
                  Student resides in College Hostel (Enables Hostel &amp; Mess clearance checkpoint)
                </label>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => {
                    setStudName('');
                    setStudRollNo('');
                    setStudRegNo('');
                    setStudEmail('');
                    setStudPassword('student123');
                    setStudDeptId(departments[0]?.id || '');
                    setStudDegree('B.E. Computer Science');
                    setStudBatch('2021 - 2025');
                    setStudSemester(8);
                    setStudHosteler(false);
                    setStudPhone('');
                  }}
                  className="inline-flex items-center space-x-1 px-3 py-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-lg transition"
                  title="Reset form fields"
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-1" />
                  <span>Reset Form</span>
                </button>

                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowAddStudentModal(false)}
                    className="px-4 py-2 text-stone-600 hover:text-stone-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-stone-900 text-white font-bold rounded-lg hover:bg-stone-800"
                  >
                    Register Student
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV BULK IMPORT MODAL */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 animate-in fade-in zoom-in duration-150">
            <h3 className="text-base font-bold text-stone-900 pb-3 border-b border-stone-100">
              Bulk Student CSV Registration
            </h3>
            <p className="text-xs text-stone-500 mt-2">
              Paste CSV lines in format: <code className="bg-stone-100 px-1 py-0.5 rounded font-mono">RollNo, Name, Email, DeptCode, Password</code>
            </p>
            <form onSubmit={handleBulkImport} className="mt-4 space-y-3.5 text-xs">
              <textarea
                rows={6}
                required
                placeholder="21CS105, Meena Devi, meena@college.edu, CSE, student123&#10;21CS106, Vikram Raj, vikram@college.edu, CSE, student123&#10;21EC101, Sneha Priya, sneha@college.edu, ECE, student123"
                value={bulkCsv}
                onChange={(e) => setBulkCsv(e.target.value)}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg font-mono text-stone-900"
              />
              <div className="flex justify-end space-x-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowBulkModal(false)}
                  className="px-4 py-2 text-stone-600 hover:text-stone-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-stone-900 text-white font-bold rounded-lg hover:bg-stone-800"
                >
                  Import All Students
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT USER MODAL (STUDENT, HOD, OR STAFF) */}
      {editingUser && (
        <EditUserModal
          user={editingUser}
          departments={departments}
          token={token!}
          onClose={() => setEditingUser(null)}
          onSaved={(updated) => {
            setFormSuccess(`User ${updated.name} updated successfully.`);
            fetchData();
          }}
        />
      )}

      {/* ADD / EDIT DEPARTMENT MODAL */}
      {departmentModalData.open && (
        <DepartmentModal
          department={departmentModalData.dept}
          hods={hods}
          token={token!}
          onClose={() => setDepartmentModalData({ open: false, dept: null })}
          onSaved={(dept) => {
            setFormSuccess(`Department ${dept.name} (${dept.code}) saved successfully.`);
            fetchData();
          }}
        />
      )}

      {/* ALLOCATE STAFF MODAL */}
      {showAddStaffModal && (
        <AddStaffModal
          departments={departments}
          token={token!}
          onClose={() => setShowAddStaffModal(false)}
          onSaved={(st) => {
            setFormSuccess(`Staff member ${st.name} allocated successfully.`);
            fetchData();
          }}
        />
      )}

      {/* SUBJECT ADD / EDIT MODAL */}
      <SubjectModal
        isOpen={showSubjectModal}
        onClose={() => {
          setShowSubjectModal(false);
          setEditingSubject(null);
        }}
        onSaved={() => {
          setFormSuccess(editingSubject ? `Subject ${editingSubject.code} updated successfully.` : 'New subject added & faculty allocated successfully.');
          setShowSubjectModal(false);
          setEditingSubject(null);
          fetchData();
        }}
        subjectToEdit={editingSubject}
        departments={departments}
        staffList={staffs}
      />

      {/* QUICK ALLOCATE FACULTY MODAL */}
      <AllocateStaffModal
        isOpen={Boolean(allocatingSubject)}
        onClose={() => setAllocatingSubject(null)}
        onAllocated={() => {
          setFormSuccess(`Faculty allocated to course ${allocatingSubject?.code} successfully.`);
          setAllocatingSubject(null);
          fetchData();
        }}
        subject={allocatingSubject}
        staffList={staffs}
      />

      {/* CLEARANCE DETAIL & CHECKPOINTS INSPECTOR MODAL */}
      {inspectingClearance && (
        <ClearanceDetailModal
          clearance={inspectingClearance}
          token={token!}
          onClose={() => setInspectingClearance(null)}
          onUpdated={(updated) => {
            setInspectingClearance(updated);
            fetchData();
          }}
        />
      )}

      {/* CERTIFICATE MODAL */}
      {selectedCertClearance && (
        <NoDueCertificate
          clearance={selectedCertClearance}
          autoPrint={autoPrintCert}
          onClose={() => {
            setSelectedCertClearance(null);
            setAutoPrintCert(false);
          }}
        />
      )}
    </div>
  );
};
