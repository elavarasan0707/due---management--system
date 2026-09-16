import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, StudentClearanceRecord, ClearanceItem } from '../types';
import {
  Users,
  Building2,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  FileCheck,
  Search,
  KeyRound,
  ShieldCheck,
  UserPlus,
  Edit2,
  Eye,
  EyeOff,
  Printer,
  BookOpen
} from 'lucide-react';
import { NoDueCertificate } from './NoDueCertificate';
import { EditUserModal } from './admin/EditUserModal';

export const HodPortal: React.FC = () => {
  const { token, user } = useAuth();

  const [activeTab, setActiveTab] = useState<'staff' | 'students'>('staff');
  const [staffList, setStaffList] = useState<User[]>([]);
  const [clearances, setClearances] = useState<StudentClearanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals & Editing
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<User | null>(null);
  const [selectedCertClearance, setSelectedCertClearance] = useState<StudentClearanceRecord | null>(null);
  const [autoPrintCert, setAutoPrintCert] = useState(false);
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});

  // Form states - Allocate Staff
  const [staffId, setStaffId] = useState('');
  const [staffName, setStaffName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPassword, setStaffPassword] = useState('staff123');
  const [staffDesignation, setStaffDesignation] = useState('Assistant Professor');
  const [staffScope, setStaffScope] = useState('');
  const [staffPhone, setStaffPhone] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const fetchHodData = async () => {
    try {
      setLoading(true);
      const headers = { Authorization: `Bearer ${token}` };

      const [staffRes, clrRes] = await Promise.all([
        fetch('/api/users?role=STAFF', { headers }),
        fetch('/api/clearances', { headers }),
      ]);

      if (staffRes.ok) {
        const allStaff: User[] = await staffRes.json();
        // HOD sees staff for their department
        const myDeptStaff = allStaff.filter(s => s.departmentId === user?.departmentId);
        setStaffList(myDeptStaff);
      }

      if (clrRes.ok) {
        setClearances(await clrRes.json());
      }
    } catch (err) {
      console.error('Error fetching HOD data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHodData();
  }, [token, user]);

  // Handle Allocate Staff
  const handleAllocateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    try {
      const res = await fetch('/api/hod/staff', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          staffId,
          name: staffName,
          email: staffEmail,
          password: staffPassword,
          designation: staffDesignation,
          clearanceScope: staffScope || `${user?.departmentName || 'Department'} Labs & Equipment`,
          phone: staffPhone,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to allocate staff');

      setFormSuccess(`Staff member ${data.name} (${data.staffId}) allocated successfully. They can now log in.`);
      setShowAddStaffModal(false);
      setStaffId('');
      setStaffName('');
      setStaffEmail('');
      setStaffPhone('');
      setStaffScope('');
      fetchHodData();
    } catch (err: any) {
      setFormError(err.message);
    }
  };

  // Remove Staff
  const handleRemoveStaff = async (staffMemberId: string, name: string) => {
    if (!confirm(`Are you sure you want to revoke authorization for staff member "${name}"?`)) return;

    try {
      const res = await fetch(`/api/users/${staffMemberId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const d = await res.json();
        alert(d.error || 'Failed to revoke staff access');
        return;
      }
      fetchHodData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // HOD Final Sign-off
  const handleHodSignoff = async (studentClearanceId: string, itemId: string, action: 'APPROVE' | 'RAISE_DUE') => {
    try {
      let dueAmount = 0;
      let dueReason = '';
      let remarks = 'Approved by Head of Department';

      if (action === 'RAISE_DUE') {
        const amtStr = prompt('Enter Department Due / Fine Amount (₹):', '500');
        if (!amtStr) return;
        dueAmount = Number(amtStr) || 0;
        dueReason = prompt('Enter reason for due (e.g. Incomplete project record, outstanding departmental fine):') || 'Departmental dues pending';
        remarks = dueReason;
      }

      const res = await fetch('/api/clearances/action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          studentClearanceId,
          itemId,
          action,
          dueAmount,
          dueReason,
          remarks,
        }),
      });

      if (!res.ok) {
        const d = await res.json();
        alert(d.error || 'Failed to update clearance');
        return;
      }

      fetchHodData();
    } catch (e: any) {
      alert(e.message);
    }
  };

  // Submit HOD Sign-off and Immediately Open Certificate for Printing
  const handleHodSubmitAndPrint = async (clr: StudentClearanceRecord, hodCheckpointId: string) => {
    try {
      await handleHodSignoff(clr.id, hodCheckpointId, 'APPROVE');
      const updatedClr: StudentClearanceRecord = {
        ...clr,
        items: clr.items.map((i) =>
          i.id === hodCheckpointId
            ? {
                ...i,
                status: 'APPROVED' as const,
                dueAmount: 0,
                clearedByUserId: user?.id,
                clearedByUserName: user?.name,
                clearedByDesignation: 'Head of Department',
                clearedAt: new Date().toISOString(),
              }
            : i
        ),
        clearedCheckpoints: clr.clearedCheckpoints + 1,
        overallStatus: 'COMPLETED' as const,
        certificateIssuedAt: new Date().toISOString(),
        certificateId: clr.certificateId || `NODUE-${clr.studentRollNo}`,
      };
      setAutoPrintCert(true);
      setSelectedCertClearance(updatedClr);
    } catch (err: any) {
      alert('Error updating and printing certificate: ' + err.message);
    }
  };

  // Filter students
  const filteredClearances = clearances.filter((c) =>
    c.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.studentRollNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.studentRegisterNo || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top HOD Banner */}
      <div className="bg-white border border-stone-200 rounded-xl p-6 mb-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                HEAD OF DEPARTMENT
              </span>
              <span className="text-xs text-stone-500 font-mono">
                {user?.departmentName}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-stone-900 mt-1.5">
              Department Portal: {user?.departmentName}
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 mt-1 max-w-2xl">
              Allocate and manage teaching and laboratory staff for clearance validation. Only staff members allocated by you are authorized to log in and sign off on clearances.
            </p>
          </div>

          <div>
            <button
              id="hod-allocate-staff-btn"
              type="button"
              onClick={() => {
                setFormError(null);
                setShowAddStaffModal(true);
              }}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-indigo-700 hover:bg-indigo-600 text-white text-xs font-bold transition shadow-xs"
            >
              <UserPlus className="w-4 h-4" />
              <span>Allocate Department Staff</span>
            </button>
          </div>
        </div>
      </div>

      {formSuccess && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{formSuccess}</span>
          </div>
          <button type="button" onClick={() => setFormSuccess(null)} className="text-emerald-700 hover:text-emerald-900">
            Dismiss
          </button>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
          <span className="text-xs text-stone-500 font-medium">Department Students</span>
          <div className="text-2xl font-bold text-stone-900 mt-1">{clearances.length}</div>
          <span className="text-[11px] text-stone-500">Under your department</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
          <span className="text-xs text-stone-500 font-medium">Allocated Staff</span>
          <div className="text-2xl font-bold text-indigo-700 mt-1">{staffList.length}</div>
          <span className="text-[11px] text-indigo-600 font-medium">Authorized by HOD</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
          <span className="text-xs text-stone-500 font-medium">Fully Cleared Students</span>
          <div className="text-2xl font-bold text-emerald-700 mt-1">
            {clearances.filter((c) => c.overallStatus === 'COMPLETED').length}
          </div>
          <span className="text-[11px] text-emerald-600 font-medium">100% Sign-offs complete</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-stone-200 mb-6 flex gap-4">
        <button
          id="hod-tab-staff"
          type="button"
          onClick={() => setActiveTab('staff')}
          className={`pb-3 text-xs sm:text-sm font-bold transition border-b-2 ${
            activeTab === 'staff'
              ? 'border-indigo-600 text-indigo-900'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          Allocated Staff Members ({staffList.length})
        </button>
        <button
          id="hod-tab-students"
          type="button"
          onClick={() => setActiveTab('students')}
          className={`pb-3 text-xs sm:text-sm font-bold transition border-b-2 ${
            activeTab === 'students'
              ? 'border-indigo-600 text-indigo-900'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          Department Student Clearances ({clearances.length})
        </button>
      </div>

      {/* TAB 1: ALLOCATED STAFF */}
      {activeTab === 'staff' && (
        <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-xs">
          <div className="p-4 bg-stone-50 border-b border-stone-200 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                Staff Members Allocated by {user?.name}
              </h3>
              <p className="text-[11px] text-stone-500 mt-0.5">
                Staff can log in with their allocated credentials and approve clearances within their designated scope.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowAddStaffModal(true)}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-700 text-white rounded-lg text-xs font-bold hover:bg-indigo-600 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Allocate Staff</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-stone-200 text-xs text-left">
              <thead className="bg-stone-50 text-stone-600 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-4 py-3">Staff ID</th>
                  <th className="px-4 py-3">Staff Name</th>
                  <th className="px-4 py-3">Designation</th>
                  <th className="px-4 py-3">Clearance Scope</th>
                  <th className="px-4 py-3">Login Username / Password</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 bg-white">
                {staffList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-stone-400">
                      No staff members allocated yet. Click &ldquo;Allocate Department Staff&rdquo; to add your lab in-charges or class advisors.
                    </td>
                  </tr>
                ) : (
                  staffList.map((st) => (
                    <tr key={st.id} className="hover:bg-stone-50/60 transition">
                      <td className="px-4 py-3 font-mono font-bold text-stone-900">
                        {st.staffId || st.username}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-bold text-stone-900 block">{st.name}</span>
                        <span className="text-[11px] text-stone-500">{st.email}</span>
                      </td>
                      <td className="px-4 py-3 text-stone-700 font-medium">
                        {st.designation}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-50 text-indigo-900 border border-indigo-200">
                          {st.clearanceScope}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-mono text-[11px] bg-stone-100 px-2 py-0.5 rounded text-stone-800">
                            {revealedPasswords[st.id] ? st.password : '••••••••'}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setRevealedPasswords((prev) => ({
                                ...prev,
                                [st.id]: !prev[st.id],
                              }))
                            }
                            className="text-stone-400 hover:text-stone-700 p-0.5"
                            title={revealedPasswords[st.id] ? 'Hide Password' : 'Show Password'}
                          >
                            {revealedPasswords[st.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            type="button"
                            onClick={() => setEditingStaff(st)}
                            className="p-1 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded transition"
                            title="Edit Staff Details & Password"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveStaff(st.id, st.name)}
                            className="p-1 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                            title="Revoke Staff Authorization"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: DEPARTMENT STUDENTS & FINAL HOD SIGN-OFF */}
      {activeTab === 'students' && (
        <div className="space-y-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search student by name or roll no..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-stone-200 rounded-lg text-stone-900 focus:outline-none focus:ring-1 focus:ring-indigo-600"
            />
          </div>

          <div className="space-y-4">
            {filteredClearances.map((clr) => {
              // Check if HOD checkpoint exists
              const hodCheckpoint = clr.items.find((i) => i.assignedRole === 'HOD');
              const isHodApproved = hodCheckpoint?.status === 'APPROVED';
              const isHodDue = hodCheckpoint?.status === 'DUE_RAISED';

              // Check staff items:
              // 1. Subject items
              const subjectCheckpoints = clr.items.filter((i) => i.subjectId);
              const subjectApprovedCount = subjectCheckpoints.filter((i) => i.status === 'APPROVED').length;
              const allSubjectsApproved = subjectCheckpoints.length === 0 || subjectApprovedCount === subjectCheckpoints.length;

              // 2. All staff items (subjects + other dept staff checkpoints)
              const staffCheckpoints = clr.items.filter((i) => i.assignedRole === 'STAFF');
              const staffApprovedCount = staffCheckpoints.filter((i) => i.status === 'APPROVED').length;
              const allStaffApproved = staffCheckpoints.length === 0 || staffApprovedCount === staffCheckpoints.length;

              // Check if all items in clearance are approved
              const allItemsApproved = clr.items.every((i) => i.status === 'APPROVED');
              const canPrintCertificate = clr.overallStatus === 'COMPLETED' || allItemsApproved;

              return (
                <div key={clr.id} className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs space-y-4">
                  {/* Header Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-stone-100 gap-3">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-sm text-stone-900">{clr.studentRollNo}</span>
                        <span className="font-bold text-stone-900 text-sm">{clr.studentName}</span>
                        <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                          Reg: {clr.studentRegisterNo}
                        </span>
                      </div>
                      <span className="text-[11px] text-stone-500 block mt-0.5">
                        Dept: {clr.studentDepartmentName} • Batch: {clr.batchYear} • Sem: {clr.semester} • {clr.degree}
                      </span>
                    </div>

                    <div className="flex items-center flex-wrap gap-2">
                      {/* HOD Endorsement Status & Actions */}
                      {hodCheckpoint && (
                        <div className="flex items-center space-x-2">
                          {isHodApproved ? (
                            <span className="inline-flex items-center text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                              HOD Endorsed
                            </span>
                          ) : (
                            <div className="flex items-center space-x-2">
                              {!allStaffApproved && (
                                <span className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                  Staff review pending
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={() => handleHodSignoff(clr.id, hodCheckpoint.id, 'APPROVE')}
                                className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-xs font-bold transition shadow-xs cursor-pointer flex items-center space-x-1"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Submit HOD Sign-off</span>
                              </button>
                              {allStaffApproved && (
                                <button
                                  type="button"
                                  onClick={() => handleHodSubmitAndPrint(clr, hodCheckpoint.id)}
                                  className="px-3 py-1.5 bg-indigo-700 hover:bg-indigo-600 text-white rounded text-xs font-bold transition shadow-xs cursor-pointer flex items-center space-x-1"
                                  title="Submit HOD endorsement and immediately print No-Due certificate"
                                >
                                  <Printer className="w-3.5 h-3.5" />
                                  <span>Submit &amp; Print</span>
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleHodSignoff(clr.id, hodCheckpoint.id, 'RAISE_DUE')}
                                className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded text-xs font-bold transition cursor-pointer"
                              >
                                Raise Due
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Print Certificate Button */}
                      {canPrintCertificate && (
                        <button
                          type="button"
                          onClick={() => {
                            setAutoPrintCert(true);
                            setSelectedCertClearance(clr);
                          }}
                          className="inline-flex items-center space-x-1 px-3 py-1.5 bg-stone-900 text-white text-xs font-bold rounded-lg hover:bg-stone-800 transition shadow-xs cursor-pointer active:scale-95"
                          title="Print official No-Due certificate"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Print Certificate</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Staff Approvals Status Banner */}
                  <div className={`p-2.5 rounded-lg border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                    allStaffApproved
                      ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                      : 'bg-amber-50/70 border-amber-200 text-amber-950'
                  }`}>
                    <div className="flex items-center space-x-2">
                      {allStaffApproved ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                      )}
                      <div>
                        <span className="font-bold">
                          {allStaffApproved
                            ? `✓ All Staff No-Due Approvals Received (${staffApprovedCount}/${staffCheckpoints.length})`
                            : `Staff Subject & Course Approvals Pending (${staffApprovedCount}/${staffCheckpoints.length} Cleared)`}
                        </span>
                        {subjectCheckpoints.length > 0 && (
                          <span className="text-[11px] block text-stone-600">
                            Course Subjects: {subjectApprovedCount}/${subjectCheckpoints.length} Cleared
                          </span>
                        )}
                      </div>
                    </div>
                    <div>
                      {canPrintCertificate ? (
                        <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                          100% Cleared • Ready to Print
                        </span>
                      ) : allStaffApproved ? (
                        <span className="text-[11px] font-bold text-indigo-800 bg-indigo-100 px-2 py-0.5 rounded">
                          Ready for Final HOD Clearance
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                          Awaiting Course Staff
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Subject Checkpoints Grid */}
                  {subjectCheckpoints.length > 0 && (
                    <div>
                      <div className="text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1.5 flex items-center">
                        <BookOpen className="w-3.5 h-3.5 mr-1 text-indigo-600" />
                        Staff Subject Clearances ({subjectApprovedCount}/{subjectCheckpoints.length})
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {subjectCheckpoints.map((subjItem) => (
                          <div
                            key={subjItem.id}
                            className={`p-2 rounded border text-xs ${
                              subjItem.status === 'APPROVED'
                                ? 'border-emerald-200 bg-emerald-50/60 text-emerald-950'
                                : subjItem.status === 'DUE_RAISED'
                                ? 'border-rose-200 bg-rose-50/60 text-rose-950'
                                : 'border-amber-200 bg-amber-50/40 text-amber-950'
                            }`}
                          >
                            <div className="font-semibold truncate">
                              {subjItem.subjectCode ? `${subjItem.subjectCode} - ` : ''}{subjItem.subjectName || subjItem.title}
                            </div>
                            <div className="flex items-center justify-between mt-1 text-[10px]">
                              <span>
                                {subjItem.status === 'APPROVED'
                                  ? '✓ Cleared'
                                  : subjItem.status === 'DUE_RAISED'
                                  ? `Due ₹${subjItem.dueAmount}`
                                  : 'Pending'}
                              </span>
                              <span className="font-mono text-stone-500">
                                {subjItem.assignedStaffName || subjItem.clearedByUserName || 'Staff'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* All Other Department Checkpoints */}
                  <div>
                    <div className="text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                      Department &amp; Institutional Checkpoints
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                      {clr.items
                        .filter((it) => !it.subjectId)
                        .map((it) => (
                          <div
                            key={it.id}
                            className={`p-2 rounded border text-xs ${
                              it.status === 'APPROVED'
                                ? 'border-emerald-200 bg-emerald-50/50 text-emerald-950'
                                : it.status === 'DUE_RAISED'
                                ? 'border-rose-200 bg-rose-50/50 text-rose-950'
                                : 'border-stone-200 bg-stone-50/50 text-stone-700'
                            }`}
                          >
                            <div className="font-semibold truncate">{it.title}</div>
                            <div className="flex items-center justify-between mt-1 text-[10px]">
                              <span>{it.status === 'APPROVED' ? 'Cleared' : it.status === 'DUE_RAISED' ? `₹${it.dueAmount}` : 'Pending'}</span>
                              <span className="font-mono text-stone-500">{it.clearedByUserName ? it.clearedByUserName.split(' ')[0] : '—'}</span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL: ALLOCATE STAFF */}
      {showAddStaffModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full border border-stone-200 shadow-2xl p-6">
            <h3 className="text-base font-bold text-stone-900 mb-1">Allocate Department Staff</h3>
            <p className="text-xs text-stone-500 mb-4">
              Allocate faculty/lab-in-charges for {user?.departmentName}. Only staff allocated here can sign in.
            </p>

            {formError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded text-xs text-rose-800 font-medium">
                {formError}
              </div>
            )}

            <form onSubmit={handleAllocateStaff} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Staff ID</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. STF-CSE-103"
                    value={staffId}
                    onChange={(e) => setStaffId(e.target.value)}
                    className="w-full p-2 bg-stone-50 border border-stone-300 rounded-lg text-stone-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Designation</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Assistant Professor"
                    value={staffDesignation}
                    onChange={(e) => setStaffDesignation(e.target.value)}
                    className="w-full p-2 bg-stone-50 border border-stone-300 rounded-lg text-stone-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. K. Mohanraj"
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  className="w-full p-2 bg-stone-50 border border-stone-300 rounded-lg text-stone-900"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Assigned Clearance Scope</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Microprocessors Lab / Class Advisor / Department Library"
                  value={staffScope}
                  onChange={(e) => setStaffScope(e.target.value)}
                  className="w-full p-2 bg-stone-50 border border-stone-300 rounded-lg text-stone-900"
                />
                <span className="text-[10px] text-stone-500 mt-0.5 block">
                  Staff will be empowered to approve or raise dues for this scope.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    placeholder="staff@college.edu"
                    value={staffEmail}
                    onChange={(e) => setStaffEmail(e.target.value)}
                    className="w-full p-2 bg-stone-50 border border-stone-300 rounded-lg text-stone-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Temporary Password</label>
                  <input
                    type="text"
                    required
                    value={staffPassword}
                    onChange={(e) => setStaffPassword(e.target.value)}
                    className="w-full p-2 bg-stone-50 border border-stone-300 rounded-lg text-stone-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Phone Number (Optional)</label>
                <input
                  type="tel"
                  placeholder="+91 94441 12233"
                  value={staffPhone}
                  onChange={(e) => setStaffPhone(e.target.value)}
                  className="w-full p-2 bg-stone-50 border border-stone-300 rounded-lg text-stone-900"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowAddStaffModal(false)}
                  className="px-3 py-1.5 text-stone-600 hover:text-stone-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-700 text-white font-bold rounded-lg hover:bg-indigo-600"
                >
                  Confirm Staff Allocation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Staff Modal */}
      {editingStaff && (
        <EditUserModal
          user={editingStaff}
          departments={[]}
          token={token!}
          onClose={() => setEditingStaff(null)}
          onSaved={() => {
            setEditingStaff(null);
            fetchHodData();
          }}
        />
      )}

      {/* Certificate Modal */}
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
