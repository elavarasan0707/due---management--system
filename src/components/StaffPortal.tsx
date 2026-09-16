import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { StudentClearanceRecord, ClearanceItem, Subject } from '../types';
import {
  CheckCircle2,
  AlertTriangle,
  Search,
  Filter,
  DollarSign,
  Check,
  X,
  BookOpen,
  User,
  GraduationCap,
  Calendar,
  Building2,
  ExternalLink,
  Clock,
  Sparkles,
  ArrowRight,
  RotateCcw
} from 'lucide-react';

interface StudentSubjectEntry {
  clr: StudentClearanceRecord;
  item: ClearanceItem;
  subject?: Subject;
}

export const StaffPortal: React.FC = () => {
  const { token, user } = useAuth();

  const [clearances, setClearances] = useState<StudentClearanceRecord[]>([]);
  const [assignedSubjects, setAssignedSubjects] = useState<Subject[]>([]);
  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'DUE_RAISED'>('ALL');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('ALL');

  // Modal: Student Subject No-Due Approval
  const [selectedStudentForApproval, setSelectedStudentForApproval] = useState<StudentSubjectEntry | null>(null);
  const [modalActionTab, setModalActionTab] = useState<'APPROVE' | 'RAISE_DUE'>('APPROVE');
  const [modalRemarks, setModalRemarks] = useState('');
  const [modalDueAmount, setModalDueAmount] = useState('250');
  const [modalDueReason, setModalDueReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchClearancesAndSubjects = async () => {
    try {
      setLoading(true);
      const headers = { Authorization: `Bearer ${token}` };

      const [clrRes, mySubjRes, allSubjRes] = await Promise.all([
        fetch('/api/clearances', { headers }),
        user?.id ? fetch(`/api/subjects?staffId=${user.id}`, { headers }) : Promise.resolve(null),
        fetch('/api/subjects', { headers }),
      ]);

      if (clrRes.ok) {
        const clrData: StudentClearanceRecord[] = await clrRes.json();
        setClearances(clrData);
      }

      let mySubjs: Subject[] = [];
      if (mySubjRes && mySubjRes.ok) {
        mySubjs = await mySubjRes.json();
      }

      if (allSubjRes && allSubjRes.ok) {
        const all: Subject[] = await allSubjRes.json();
        setAllSubjects(all);

        // Also check if any subject in all matches staff by name or code
        if (mySubjs.length === 0 && user) {
          const matched = all.filter(
            (s) =>
              (s.assignedStaffId && (s.assignedStaffId === user.id || s.assignedStaffId === user.staffId)) ||
              (s.assignedStaffName && s.assignedStaffName.toLowerCase() === user.name.toLowerCase())
          );
          if (matched.length > 0) {
            mySubjs = matched;
          }
        }
      }

      setAssignedSubjects(mySubjs);
      if (mySubjs.length > 0 && selectedSubjectFilter === 'ALL') {
        // Keep 'ALL' or set default
      }
    } catch (e) {
      console.error('Error loading staff clearances & subjects:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClearancesAndSubjects();
  }, [token, user?.id]);

  // Execute approval or fine action
  const handleExecuteAction = async (params: {
    studentClearanceId: string;
    itemId: string;
    action: 'APPROVE' | 'RAISE_DUE' | 'CLEAR_DUE';
    dueAmount?: number;
    dueReason?: string;
    remarks?: string;
    studentName: string;
  }) => {
    try {
      setIsSubmitting(true);
      const res = await fetch('/api/clearances/action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          studentClearanceId: params.studentClearanceId,
          itemId: params.itemId,
          action: params.action,
          dueAmount: params.dueAmount,
          dueReason: params.dueReason,
          remarks:
            params.remarks ||
            (params.action === 'APPROVE'
              ? `Approved by ${user?.name} (${user?.designation || 'Faculty'})`
              : params.action === 'CLEAR_DUE'
              ? `Due cleared by ${user?.name}`
              : `Due raised by ${user?.name}`),
        }),
      });

      if (!res.ok) {
        const d = await res.json();
        alert(d.error || 'Failed to update clearance action');
        return;
      }

      const actionText =
        params.action === 'APPROVE'
          ? 'No-Due Approved'
          : params.action === 'CLEAR_DUE'
          ? 'Due Cleared & Approved'
          : `Due of ₹${params.dueAmount} Issued`;

      setActionSuccess(`${actionText} successfully for ${params.studentName}.`);
      setSelectedStudentForApproval(null);
      setModalRemarks('');
      setModalDueReason('');
      fetchClearancesAndSubjects();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open modal for a specific student
  const openStudentModal = (entry: StudentSubjectEntry) => {
    setSelectedStudentForApproval(entry);
    setModalActionTab(entry.item.status === 'DUE_RAISED' ? 'RAISE_DUE' : 'APPROVE');
    setModalRemarks(entry.item.remarks || '');
    setModalDueAmount(entry.item.dueAmount ? String(entry.item.dueAmount) : '250');
    setModalDueReason(entry.item.dueReason || '');
  };

  // Build the list of student subject entries for this staff member
  const studentSubjectEntries: StudentSubjectEntry[] = [];

  clearances.forEach((clr) => {
    if (assignedSubjects.length > 0) {
      // Show student entries for each assigned subject
      assignedSubjects.forEach((subj) => {
        // Find subject checkpoint
        const item = clr.items.find(
          (i) =>
            i.subjectId === subj.id ||
            i.checkpointKey === `subj_${subj.id}` ||
            (i.subjectCode && i.subjectCode.toUpperCase() === subj.code.toUpperCase())
        );

        if (item) {
          studentSubjectEntries.push({
            clr,
            item,
            subject: subj,
          });
        }
      });
    } else {
      // Fallback if no specific subject assigned yet: look for department/scope items
      const staffId = user?.id;
      const staffCode = (user?.staffId || '').toUpperCase();
      const staffName = (user?.name || '').toLowerCase();
      const scope = (user?.clearanceScope || '').toLowerCase();

      clr.items.forEach((item) => {
        let isRelevant = false;
        if (item.assignedStaffId && (item.assignedStaffId === staffId || item.assignedStaffId.toUpperCase() === staffCode)) {
          isRelevant = true;
        } else if (item.assignedStaffName && item.assignedStaffName.toLowerCase() === staffName) {
          isRelevant = true;
        } else if (scope && item.assignedScope && item.assignedScope.toLowerCase().includes(scope)) {
          isRelevant = true;
        } else if (user?.departmentId && item.departmentId === user.departmentId && item.assignedRole === 'STAFF') {
          isRelevant = true;
        }

        if (isRelevant) {
          studentSubjectEntries.push({
            clr,
            item,
            subject: allSubjects.find((s) => s.id === item.subjectId),
          });
        }
      });
    }
  });

  // Filter entries
  const filteredEntries = studentSubjectEntries.filter(({ clr, item, subject }) => {
    // Subject filter
    if (selectedSubjectFilter !== 'ALL') {
      if (subject?.id !== selectedSubjectFilter && item.subjectId !== selectedSubjectFilter) {
        return false;
      }
    }

    // Status filter
    if (statusFilter !== 'ALL') {
      if (item.status !== statusFilter) return false;
    }

    // Search query: roll no, student name, or register no
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchRoll = clr.studentRollNo.toLowerCase().includes(q);
      const matchName = clr.studentName.toLowerCase().includes(q);
      const matchReg = (clr.studentRegisterNo || '').toLowerCase().includes(q);
      const matchSubj = (item.title || '').toLowerCase().includes(q) || (subject?.code || '').toLowerCase().includes(q);
      if (!matchRoll && !matchName && !matchReg && !matchSubj) return false;
    }

    return true;
  });

  const totalAssignedStudents = studentSubjectEntries.length;
  const pendingCount = studentSubjectEntries.filter((e) => e.item.status === 'PENDING').length;
  const approvedCount = studentSubjectEntries.filter((e) => e.item.status === 'APPROVED').length;
  const duesCount = studentSubjectEntries.filter((e) => e.item.status === 'DUE_RAISED').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Staff Identity Banner */}
      <div className="bg-white border border-stone-200 rounded-xl p-6 mb-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                FACULTY / COURSE STAFF PORTAL
              </span>
              <span className="text-xs font-mono text-stone-500 font-semibold">
                ID: {user?.staffId || user?.username}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-stone-900 mt-1.5 flex items-center gap-2">
              <span>Student Subject No-Due Clearances</span>
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 mt-1">
              Faculty: <strong className="text-stone-900">{user?.name}</strong> • Designation:{' '}
              <strong>{user?.designation || 'Faculty'}</strong> • Dept:{' '}
              <strong>{user?.departmentName || 'Engineering'}</strong>
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-2 bg-stone-50 p-3 rounded-xl border border-stone-200 text-xs text-center">
            <div className="px-2">
              <span className="text-stone-500 block text-[11px]">Total Enrolled</span>
              <span className="font-bold text-stone-900 text-base">{totalAssignedStudents}</span>
            </div>
            <div className="border-l border-stone-200 px-2">
              <span className="text-stone-500 block text-[11px]">Pending Review</span>
              <span className="font-bold text-amber-600 text-base">{pendingCount}</span>
            </div>
            <div className="border-l border-stone-200 px-2">
              <span className="text-stone-500 block text-[11px]">Approved</span>
              <span className="font-bold text-emerald-700 text-base">{approvedCount}</span>
            </div>
          </div>
        </div>

        {/* Assigned Subjects Highlight Bar */}
        {assignedSubjects.length > 0 ? (
          <div className="mt-4 pt-4 border-t border-stone-100">
            <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
              <span className="text-xs font-bold text-stone-800 flex items-center">
                <BookOpen className="w-3.5 h-3.5 mr-1.5 text-indigo-600" />
                Your Assigned Subject(s) ({assignedSubjects.length}):
              </span>
              <span className="text-[11px] text-stone-500">
                Click a subject to filter student queue
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSelectedSubjectFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                  selectedSubjectFilter === 'ALL'
                    ? 'bg-indigo-700 text-white shadow-xs'
                    : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                }`}
              >
                <span>All My Subjects</span>
                <span className={`px-1.5 py-0.2 text-[10px] rounded-full ${selectedSubjectFilter === 'ALL' ? 'bg-indigo-800 text-indigo-100' : 'bg-stone-200 text-stone-700'}`}>
                  {studentSubjectEntries.length}
                </span>
              </button>

              {assignedSubjects.map((subj) => {
                const countForSubj = studentSubjectEntries.filter(
                  (e) => e.subject?.id === subj.id || e.item.subjectId === subj.id
                ).length;
                const isSelected = selectedSubjectFilter === subj.id;

                return (
                  <button
                    key={subj.id}
                    type="button"
                    onClick={() => setSelectedSubjectFilter(subj.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-700 text-white shadow-xs'
                        : 'bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-200'
                    }`}
                  >
                    <span className="font-mono text-indigo-400 group-hover:text-white mr-0.5">
                      {subj.code}:
                    </span>
                    <span>{subj.name}</span>
                    <span className={`px-1.5 py-0.2 text-[10px] rounded-full ${isSelected ? 'bg-indigo-800 text-indigo-100' : 'bg-stone-200 text-stone-700'}`}>
                      {countForSubj}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                No specific course subjects are currently assigned to your staff profile. Department clearance checkpoints are displayed below.
              </span>
            </div>
          </div>
        )}
      </div>

      {actionSuccess && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex items-center justify-between shadow-2xs">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionSuccess(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold px-2 py-0.5"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between mb-6">
        <div className="relative w-full sm:w-88">
          <Search className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Register No, Roll No, or Student Name..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-stone-200 rounded-lg text-stone-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 shadow-2xs"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-stone-400" />
          <div className="flex bg-stone-100 p-1 rounded-lg text-xs">
            {(['ALL', 'PENDING', 'APPROVED', 'DUE_RAISED'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-md font-semibold transition ${
                  statusFilter === st
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                {st === 'ALL'
                  ? `All (${studentSubjectEntries.length})`
                  : st === 'PENDING'
                  ? `Pending (${pendingCount})`
                  : st === 'APPROVED'
                  ? `Approved (${approvedCount})`
                  : `Dues (${duesCount})`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Clearance Review Cards / Table */}
      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 bg-stone-50 border-b border-stone-200 flex items-center justify-between">
          <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
            Student Subject No-Due Queue ({filteredEntries.length})
          </h3>
          <span className="text-[11px] text-stone-500">
            Tip: Click the <strong className="text-indigo-700">Register Number</strong> to open approval window
          </span>
        </div>

        <div className="divide-y divide-stone-100 text-xs">
          {filteredEntries.length === 0 ? (
            <div className="p-12 text-center text-stone-400">
              <BookOpen className="w-8 h-8 mx-auto mb-2 text-stone-300" />
              <p className="font-semibold">No students found matching current filters.</p>
              <p className="text-[11px] text-stone-400 mt-1">Try clearing search query or switching subject tabs.</p>
            </div>
          ) : (
            filteredEntries.map((entry) => {
              const { clr, item, subject } = entry;
              const subjCode = item.subjectCode || subject?.code;
              const subjName = item.subjectName || subject?.name;

              return (
                <div
                  key={`${clr.id}_${item.id}`}
                  className="p-4 hover:bg-stone-50/80 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Interactive Register Number Button */}
                      <button
                        type="button"
                        onClick={() => openStudentModal(entry)}
                        className="inline-flex items-center space-x-1.5 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-900 rounded-md font-mono font-bold text-xs shadow-2xs transition cursor-pointer group"
                        title="Click to review and approve No-Due for this student"
                      >
                        <span className="text-stone-500 font-sans font-normal text-[10px]">Reg:</span>
                        <span className="group-hover:underline text-indigo-700 font-bold">{clr.studentRegisterNo}</span>
                        <ExternalLink className="w-3 h-3 text-indigo-500 group-hover:text-indigo-700 shrink-0" />
                      </button>

                      <span className="font-mono font-semibold text-stone-700">
                        Roll: {clr.studentRollNo}
                      </span>
                      <span className="text-stone-300">•</span>
                      <button
                        type="button"
                        onClick={() => openStudentModal(entry)}
                        className="font-bold text-stone-900 hover:text-indigo-700 text-sm transition text-left cursor-pointer"
                      >
                        {clr.studentName}
                      </button>
                      <span className="text-[11px] text-stone-500">
                        ({clr.studentDepartmentName})
                      </span>
                    </div>

                    {/* Subject info & metadata */}
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-stone-600">
                      <span className="inline-flex items-center px-2 py-0.5 bg-stone-100 text-stone-800 rounded font-semibold border border-stone-200">
                        <BookOpen className="w-3 h-3 mr-1 text-indigo-600" />
                        {subjCode ? `${subjCode} - ${subjName}` : item.title}
                      </span>
                      <span>Batch: {clr.batchYear}</span>
                      <span>•</span>
                      <span>Sem: {clr.semester}</span>
                      <span>•</span>
                      <span>Degree: {clr.degree}</span>
                    </div>

                    {/* Status Display */}
                    {item.status === 'APPROVED' && (
                      <div className="mt-1 text-[11px] text-emerald-800 bg-emerald-50/70 border border-emerald-200/80 px-2.5 py-1 rounded-md inline-flex items-center space-x-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>
                          <strong>Subject No-Due Cleared</strong> by {item.clearedByUserName || user?.name}
                          {item.clearedAt ? ` on ${new Date(item.clearedAt).toLocaleDateString()}` : ''}
                        </span>
                        {item.remarks && (
                          <span className="text-stone-500 text-[10px]">({item.remarks})</span>
                        )}
                      </div>
                    )}

                    {item.status === 'DUE_RAISED' && (
                      <div className="mt-1 text-[11px] text-rose-900 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-md inline-flex items-center space-x-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                        <span>
                          <strong>Fine Raised: ₹{item.dueAmount}</strong> — {item.dueReason}
                        </span>
                      </div>
                    )}

                    {item.status === 'PENDING' && (
                      <div className="mt-1 text-[11px] text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-md inline-flex items-center space-x-1.5">
                        <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>No-Due approval pending for this subject</span>
                      </div>
                    )}
                  </div>

                  {/* Quick Action Buttons */}
                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => openStudentModal(entry)}
                      className="px-3 py-1.5 rounded-lg border border-stone-300 hover:bg-stone-100 text-stone-700 font-bold transition text-xs flex items-center space-x-1 cursor-pointer"
                    >
                      <User className="w-3.5 h-3.5 text-stone-500" />
                      <span>Review Details</span>
                    </button>

                    {item.status === 'PENDING' && (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            handleExecuteAction({
                              studentClearanceId: clr.id,
                              itemId: item.id,
                              action: 'APPROVE',
                              studentName: clr.studentName,
                            })
                          }
                          disabled={isSubmitting}
                          className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition shadow-xs cursor-pointer text-xs"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Approve No-Due</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedStudentForApproval(entry);
                            setModalActionTab('RAISE_DUE');
                          }}
                          className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-800 font-bold transition cursor-pointer text-xs"
                        >
                          <DollarSign className="w-3.5 h-3.5" />
                          <span>Raise Due</span>
                        </button>
                      </>
                    )}

                    {item.status === 'DUE_RAISED' && (
                      <button
                        type="button"
                        onClick={() =>
                          handleExecuteAction({
                            studentClearanceId: clr.id,
                            itemId: item.id,
                            action: 'CLEAR_DUE',
                            studentName: clr.studentName,
                          })
                        }
                        disabled={isSubmitting}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-stone-900 text-white font-bold hover:bg-stone-800 transition text-xs cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Settle &amp; Clear</span>
                      </button>
                    )}

                    {item.status === 'APPROVED' && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs">
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                        Approved
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* MODAL: STUDENT PARTICULAR NO-DUE APPROVAL MODAL */}
      {selectedStudentForApproval && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-stone-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-stone-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-base shadow-xs">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold tracking-tight">Student Subject No-Due Review</h3>
                  <p className="text-xs text-stone-300">
                    Review and authorize clearance for this enrolled student
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStudentForApproval(null)}
                className="p-1.5 rounded-lg hover:bg-stone-800 text-stone-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Student Profile Card */}
            <div className="p-6 bg-stone-50 border-b border-stone-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-stone-200/80">
                <div>
                  <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider block">
                    Student Information
                  </span>
                  <h2 className="text-lg font-bold text-stone-900">
                    {selectedStudentForApproval.clr.studentName}
                  </h2>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-stone-500 block">Register Number</span>
                  <span className="font-mono text-base font-black text-indigo-900 bg-indigo-100/70 border border-indigo-200 px-2.5 py-0.5 rounded-md inline-block">
                    {selectedStudentForApproval.clr.studentRegisterNo}
                  </span>
                </div>
              </div>

              {/* Particulars Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mt-3">
                <div>
                  <span className="text-[11px] text-stone-500 block">Roll No</span>
                  <span className="font-mono font-bold text-stone-900">
                    {selectedStudentForApproval.clr.studentRollNo}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-stone-500 block">Department</span>
                  <span className="font-semibold text-stone-900">
                    {selectedStudentForApproval.clr.studentDepartmentName}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-stone-500 block">Degree / Sem</span>
                  <span className="font-semibold text-stone-900">
                    {selectedStudentForApproval.clr.degree} • Sem {selectedStudentForApproval.clr.semester}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-stone-500 block">Batch</span>
                  <span className="font-semibold text-stone-900">
                    {selectedStudentForApproval.clr.batchYear}
                  </span>
                </div>
              </div>

              {/* Subject details card */}
              <div className="mt-4 p-3 bg-white rounded-lg border border-stone-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block mb-1">
                  Subject Under Review
                </span>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <BookOpen className="w-4 h-4 text-indigo-600" />
                    <span className="font-bold text-stone-900 text-xs">
                      {selectedStudentForApproval.item.subjectCode || selectedStudentForApproval.subject?.code} -{' '}
                      {selectedStudentForApproval.item.subjectName || selectedStudentForApproval.subject?.name || selectedStudentForApproval.item.title}
                    </span>
                  </div>
                  <span className="text-[11px] text-stone-500">
                    Allocated Faculty: <strong>{user?.name}</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Current Status Box */}
            <div className="px-6 pt-4">
              <div className="text-xs font-bold text-stone-700 mb-2">Current Clearance Status:</div>
              {selectedStudentForApproval.item.status === 'APPROVED' ? (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <span className="font-bold">No-Due Approved</span>
                      <span className="block text-[11px] text-emerald-700">
                        Cleared by {selectedStudentForApproval.item.clearedByUserName || user?.name}
                        {selectedStudentForApproval.item.clearedAt ? ` on ${new Date(selectedStudentForApproval.item.clearedAt).toLocaleString()}` : ''}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 bg-emerald-200 text-emerald-900 rounded">
                    Verified
                  </span>
                </div>
              ) : selectedStudentForApproval.item.status === 'DUE_RAISED' ? (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900">
                  <div className="flex items-center space-x-2 mb-1">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span className="font-bold text-rose-900">
                      Active Fine / Due: ₹{selectedStudentForApproval.item.dueAmount}
                    </span>
                  </div>
                  <p className="text-[11px] text-rose-700 ml-6">
                    Reason: {selectedStudentForApproval.item.dueReason}
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    Clearance is currently <strong>PENDING</strong> for this subject. Review coursework, lab records, or library materials before granting approval.
                  </span>
                </div>
              )}
            </div>

            {/* Approval Action Form */}
            <div className="p-6 space-y-4">
              {/* Action Tabs */}
              <div className="flex bg-stone-100 p-1 rounded-xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setModalActionTab('APPROVE')}
                  className={`flex-1 py-2 rounded-lg transition flex items-center justify-center space-x-1.5 cursor-pointer ${
                    modalActionTab === 'APPROVE'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <Check className="w-4 h-4" />
                  <span>Grant No-Due Approval</span>
                </button>
                <button
                  type="button"
                  onClick={() => setModalActionTab('RAISE_DUE')}
                  className={`flex-1 py-2 rounded-lg transition flex items-center justify-center space-x-1.5 cursor-pointer ${
                    modalActionTab === 'RAISE_DUE'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <DollarSign className="w-4 h-4" />
                  <span>Raise Fine / Due</span>
                </button>
              </div>

              {modalActionTab === 'APPROVE' ? (
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">
                      Faculty Endorsement Remarks (Optional)
                    </label>
                    <input
                      type="text"
                      value={modalRemarks}
                      onChange={(e) => setModalRemarks(e.target.value)}
                      placeholder="e.g. Lab record verified, no outstanding assignments or lab equipment"
                      className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg text-stone-900 text-xs"
                    />
                  </div>

                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-[11px] text-emerald-800">
                    <p className="font-semibold">
                      Clicking &quot;Confirm &amp; Grant No-Due Approval&quot; will immediately mark this student&apos;s subject clearance as APPROVED and update the institutional records for HOD sign-off.
                    </p>
                  </div>

                  <div className="flex items-center justify-end space-x-2 pt-2 border-t border-stone-100">
                    <button
                      type="button"
                      onClick={() => setSelectedStudentForApproval(null)}
                      className="px-4 py-2 text-stone-600 hover:text-stone-800 font-bold text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() =>
                        handleExecuteAction({
                          studentClearanceId: selectedStudentForApproval.clr.id,
                          itemId: selectedStudentForApproval.item.id,
                          action: 'APPROVE',
                          remarks: modalRemarks,
                          studentName: selectedStudentForApproval.clr.studentName,
                        })
                      }
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition shadow-xs flex items-center space-x-1.5 cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>Confirm &amp; Grant No-Due Approval</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">
                      Due / Fine Amount (₹ INR)
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center font-bold text-stone-500">
                        ₹
                      </span>
                      <input
                        type="number"
                        min="1"
                        required
                        value={modalDueAmount}
                        onChange={(e) => setModalDueAmount(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-stone-900 font-mono font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-stone-700 mb-1">
                      Reason / Unsettled Subject Item
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={modalDueReason}
                      onChange={(e) => setModalDueReason(e.target.value)}
                      placeholder="e.g. Lab component / kit not returned, observation manual missing, library subject book overdue"
                      className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg text-stone-900 text-xs"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-stone-100">
                    {selectedStudentForApproval.item.status === 'DUE_RAISED' && (
                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() =>
                          handleExecuteAction({
                            studentClearanceId: selectedStudentForApproval.clr.id,
                            itemId: selectedStudentForApproval.item.id,
                            action: 'CLEAR_DUE',
                            studentName: selectedStudentForApproval.clr.studentName,
                          })
                        }
                        className="px-3 py-2 bg-stone-900 text-white font-bold rounded-lg text-xs hover:bg-stone-800 transition cursor-pointer"
                      >
                        Settle &amp; Clear Existing Due
                      </button>
                    )}
                    <div className="flex items-center space-x-2 ml-auto">
                      <button
                        type="button"
                        onClick={() => setSelectedStudentForApproval(null)}
                        className="px-4 py-2 text-stone-600 hover:text-stone-800 font-bold text-xs"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={isSubmitting || !modalDueReason}
                        onClick={() =>
                          handleExecuteAction({
                            studentClearanceId: selectedStudentForApproval.clr.id,
                            itemId: selectedStudentForApproval.item.id,
                            action: 'RAISE_DUE',
                            dueAmount: Number(modalDueAmount) || 0,
                            dueReason: modalDueReason,
                            studentName: selectedStudentForApproval.clr.studentName,
                          })
                        }
                        className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition shadow-xs flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <AlertTriangle className="w-4 h-4" />
                        <span>Issue Due / Fine</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
