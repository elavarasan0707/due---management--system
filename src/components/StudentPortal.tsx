import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { StudentClearanceRecord, ClearanceItem } from '../types';
import {
  CheckCircle2,
  AlertTriangle,
  Clock,
  Award,
  CreditCard,
  Building,
  GraduationCap,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Printer
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { NoDueCertificate } from './NoDueCertificate';

export const StudentPortal: React.FC = () => {
  const { token, user } = useAuth();

  const [clearance, setClearance] = useState<StudentClearanceRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCertificate, setShowCertificate] = useState(false);
  const [autoPrintCert, setAutoPrintCert] = useState(false);

  // Pay Due Modal
  const [payingItem, setPayingItem] = useState<ClearanceItem | null>(null);
  const [paymentNote, setPaymentNote] = useState('');
  const [payLoading, setPayLoading] = useState(false);
  const [paySuccess, setPaySuccess] = useState<string | null>(null);

  const fetchMyClearance = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/clearances/my', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data: StudentClearanceRecord = await res.json();
        setClearance(data);

        // If completed, trigger confetti once
        if (data.overallStatus === 'COMPLETED') {
          confetti({
            particleCount: 80,
            spread: 60,
            origin: { y: 0.6 },
          });
        }
      }
    } catch (e) {
      console.error('Error fetching student clearance:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyClearance();
  }, [token]);

  const handlePayDue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingItem || !clearance) return;

    try {
      setPayLoading(true);
      const res = await fetch('/api/clearances/pay-due', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          studentClearanceId: clearance.id,
          itemId: payingItem.id,
          transactionNote: paymentNote || `UPI/Card Payment: ₹${payingItem.dueAmount}`,
        }),
      });

      const updated = await res.json();
      if (!res.ok) throw new Error(updated.error || 'Payment settlement failed');

      setClearance(updated);
      setPaySuccess(`Successfully settled ₹${payingItem.dueAmount} for ${payingItem.title}. Clearance updated!`);
      setPayingItem(null);
      setPaymentNote('');

      if (updated.overallStatus === 'COMPLETED') {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setPayLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-stone-900 border-t-transparent"></div>
        <p className="mt-3 text-xs text-stone-500 font-medium">Loading your official clearance record...</p>
      </div>
    );
  }

  if (!clearance) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center">
        <AlertTriangle className="w-10 h-10 text-amber-600 mx-auto mb-3" />
        <h3 className="text-base font-bold text-stone-900">No Clearance Record Found</h3>
        <p className="text-xs text-stone-500 mt-1">
          Your student record has not been linked to a clearance checklist. Please contact College Administration.
        </p>
      </div>
    );
  }

  const percent = Math.round((clearance.clearedCheckpoints / clearance.totalCheckpoints) * 100);
  const isCompleted = clearance.overallStatus === 'COMPLETED';
  const hasDues = clearance.totalDueAmount > 0;

  const deptItems = clearance.items.filter((i) => i.category === 'DEPARTMENT');
  const centralItems = clearance.items.filter((i) => i.category === 'CENTRAL');

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Student Identity Card */}
      <div className="bg-white border border-stone-200 rounded-xl p-6 mb-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-900 border border-amber-200">
                STUDENT CLEARANCE DESK
              </span>
              <span className="text-xs font-mono font-bold text-stone-900 bg-stone-100 px-2 py-0.5 rounded">
                Roll No: {clearance.studentRollNo}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-stone-900 mt-2">
              {clearance.studentName}
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 mt-0.5">
              {clearance.degree} • Department of {clearance.studentDepartmentName}
            </p>
            <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-stone-500">
              <span className="bg-stone-50 border border-stone-200 px-2 py-0.5 rounded">
                Register No: {clearance.studentRegisterNo}
              </span>
              <span className="bg-stone-50 border border-stone-200 px-2 py-0.5 rounded">
                Batch: {clearance.batchYear}
              </span>
              <span className="bg-stone-50 border border-stone-200 px-2 py-0.5 rounded">
                Semester: {clearance.semester}
              </span>
              <span className="bg-stone-50 border border-stone-200 px-2 py-0.5 rounded">
                Status: {clearance.isHosteler ? 'Hosteler' : 'Day Scholar'}
              </span>
            </div>
          </div>

          {/* Progress Box */}
          <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 min-w-[240px]">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-bold text-stone-700">Clearance Status</span>
              <span className="font-bold font-mono text-stone-900 text-sm">{percent}%</span>
            </div>
            <div className="w-full h-2.5 bg-stone-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  isCompleted ? 'bg-emerald-500' : hasDues ? 'bg-rose-500' : 'bg-amber-500'
                }`}
                style={{ width: `${percent}%` }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px]">
              <span className="text-stone-500">
                {clearance.clearedCheckpoints} of {clearance.totalCheckpoints} Cleared
              </span>
              {hasDues ? (
                <span className="text-rose-600 font-bold">Dues: ₹{clearance.totalDueAmount}</span>
              ) : isCompleted ? (
                <span className="text-emerald-700 font-bold">100% Cleared</span>
              ) : (
                <span className="text-amber-700 font-medium">In Review</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {paySuccess && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{paySuccess}</span>
          </div>
          <button type="button" onClick={() => setPaySuccess(null)} className="text-emerald-700 hover:text-emerald-900">
            Dismiss
          </button>
        </div>
      )}

      {/* Outstanding Dues Banner */}
      {hasDues && (
        <div className="mb-6 p-5 bg-rose-50 border border-rose-200 rounded-xl shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 rounded-lg bg-rose-200 text-rose-800 flex items-center justify-center shrink-0 mt-0.5">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-rose-900">
                  Outstanding College Dues: ₹{clearance.totalDueAmount}
                </h3>
                <p className="text-xs text-rose-700 mt-0.5">
                  You have pending dues raised by department or office staff. Once settled, your certificate will become eligible.
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono font-bold bg-white text-rose-900 px-3 py-1.5 rounded-lg border border-rose-300">
                Total Due: ₹{clearance.totalDueAmount}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Completed Certificate Banner */}
      {isCompleted && (
        <div className="mb-8 p-6 bg-gradient-to-r from-amber-50 to-stone-50 border-2 border-amber-300 rounded-2xl shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-amber-400 text-stone-950 flex items-center justify-center font-bold shadow-xs">
                <Award className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center space-x-1.5 text-xs font-bold text-amber-900 uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Institutional Clearance Verified</span>
                </div>
                <h2 className="text-lg font-bold text-stone-900 mt-0.5">
                  Your Official No Due Certificate is Ready!
                </h2>
                <p className="text-xs text-stone-600 mt-0.5">
                  Certificate ID: <span className="font-mono font-bold text-stone-900">{clearance.certificateId}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                id="student-view-certificate-btn"
                type="button"
                onClick={() => {
                  setAutoPrintCert(true);
                  setShowCertificate(true);
                }}
                className="inline-flex items-center space-x-2 px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold rounded-xl transition shadow-sm cursor-pointer active:scale-95"
                title="Click to view and print official certificate"
              >
                <Printer className="w-4 h-4 text-amber-400" />
                <span>View &amp; Print Official Certificate</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clearances Breakdown Section */}
      <div className="space-y-6">
        {/* Group 1: Department Checkpoints */}
        <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-xs">
          <div className="p-4 bg-stone-50 border-b border-stone-200 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Building className="w-4 h-4 text-indigo-700" />
              <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                Department Clearances ({clearance.studentDepartmentName})
              </h3>
            </div>
            <span className="text-[11px] text-stone-500">Class Advisor, Laboratories &amp; HOD</span>
          </div>

          <div className="divide-y divide-stone-100 text-xs">
            {deptItems.map((item) => (
              <div key={item.id} className="p-4 hover:bg-stone-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-stone-900">{item.title}</span>
                    <span className="text-[10px] text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded font-mono">
                      {item.assignedScope}
                    </span>
                  </div>

                  {item.status === 'APPROVED' && (
                    <p className="text-[11px] text-emerald-700 mt-1 flex items-center space-x-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>
                        Verified by {item.clearedByUserName} ({item.clearedByDesignation || 'Department Faculty'})
                      </span>
                    </p>
                  )}

                  {item.status === 'DUE_RAISED' && (
                    <div className="mt-1.5 text-xs text-rose-800 bg-rose-50 p-2 rounded border border-rose-200">
                      <strong>Pending Fine: ₹{item.dueAmount}</strong> — {item.dueReason}
                    </div>
                  )}

                  {item.status === 'PENDING' && (
                    <p className="text-[11px] text-stone-400 mt-1 flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Awaiting verification by department authority</span>
                    </p>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  {item.status === 'APPROVED' ? (
                    <span className="inline-flex items-center px-2.5 py-1 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-xs">
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                      Cleared
                    </span>
                  ) : item.status === 'DUE_RAISED' ? (
                    <button
                      type="button"
                      onClick={() => setPayingItem(item)}
                      className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition shadow-xs cursor-pointer"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Pay ₹{item.dueAmount} Due</span>
                    </button>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-1 rounded bg-stone-100 text-stone-600 font-semibold text-xs">
                      Pending Review
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Group 2: Central College Checkpoints */}
        <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-xs">
          <div className="p-4 bg-stone-50 border-b border-stone-200 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-amber-700" />
              <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                Central College Clearances
              </h3>
            </div>
            <span className="text-[11px] text-stone-500">Library, Accounts, Sports, Hostel</span>
          </div>

          <div className="divide-y divide-stone-100 text-xs">
            {centralItems.map((item) => (
              <div key={item.id} className="p-4 hover:bg-stone-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-stone-900">{item.title}</span>
                  </div>

                  {item.status === 'APPROVED' && (
                    <p className="text-[11px] text-emerald-700 mt-1 flex items-center space-x-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>
                        Verified by {item.clearedByUserName} ({item.clearedByDesignation || 'Authority In-Charge'})
                      </span>
                    </p>
                  )}

                  {item.status === 'DUE_RAISED' && (
                    <div className="mt-1.5 text-xs text-rose-800 bg-rose-50 p-2 rounded border border-rose-200">
                      <strong>Pending Fine: ₹{item.dueAmount}</strong> — {item.dueReason}
                    </div>
                  )}

                  {item.status === 'PENDING' && (
                    <p className="text-[11px] text-stone-400 mt-1 flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Awaiting verification by central office</span>
                    </p>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  {item.status === 'APPROVED' ? (
                    <span className="inline-flex items-center px-2.5 py-1 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-xs">
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                      Cleared
                    </span>
                  ) : item.status === 'DUE_RAISED' ? (
                    <button
                      type="button"
                      onClick={() => setPayingItem(item)}
                      className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition shadow-xs cursor-pointer"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Pay ₹{item.dueAmount} Due</span>
                    </button>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-1 rounded bg-stone-100 text-stone-600 font-semibold text-xs">
                      Pending Review
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MODAL: PAY DUE */}
      {payingItem && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full border border-stone-200 shadow-2xl p-6">
            <h3 className="text-base font-bold text-stone-900 mb-1">Settle Clearance Due</h3>
            <p className="text-xs text-stone-500 mb-4">{payingItem.title}</p>

            <div className="p-3 bg-stone-50 rounded-lg border border-stone-200 mb-4 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-stone-500">Fine Reason:</span>
                <span className="font-semibold text-stone-800">{payingItem.dueReason}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Amount to Settle:</span>
                <span className="font-mono font-bold text-rose-700 text-sm">₹{payingItem.dueAmount}</span>
              </div>
            </div>

            <form onSubmit={handlePayDue} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-stone-700 mb-1">Payment / Transaction Note</label>
                <input
                  type="text"
                  placeholder="e.g. UPI / Google Pay Ref / Bank Ref / Cash at Counter"
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  className="w-full p-2 bg-stone-50 border border-stone-300 rounded-lg text-stone-900"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setPayingItem(null)}
                  className="px-3 py-1.5 text-stone-600 hover:text-stone-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={payLoading}
                  className="px-4 py-1.5 bg-stone-900 text-white font-bold rounded-lg hover:bg-stone-800 disabled:opacity-50 transition flex items-center space-x-1.5"
                >
                  {payLoading ? <span>Processing...</span> : <span>Confirm Payment Settlement</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CERTIFICATE MODAL */}
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
  );
};
