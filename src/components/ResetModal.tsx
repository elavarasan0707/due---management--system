import React, { useState } from 'react';
import { RefreshCw, AlertTriangle, CheckCircle, RotateCcw, Trash2, Database } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface ResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResetComplete?: () => void;
}

export const ResetModal: React.FC<ResetModalProps> = ({ isOpen, onClose, onResetComplete }) => {
  const { token } = useAuth();
  const [mode, setMode] = useState<'demo' | 'clear_dues' | 'wipe'>('demo');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleReset = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch('/api/system/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ mode }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Reset failed');
      }

      setMessage(data.message || 'System reset successfully.');
      if (onResetComplete) {
        setTimeout(() => {
          onResetComplete();
          onClose();
        }, 1200);
      }
    } catch (err: any) {
      setError(err.message || 'Error executing reset');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-lg w-full border border-stone-200 shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
            <RefreshCw className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-stone-900">System Reset &amp; Re-Initialization</h3>
            <p className="text-xs text-stone-500">Reset system database or restore default institutional data</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 font-medium flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {message && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 font-medium flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{message}</span>
          </div>
        )}

        <div className="space-y-3 my-4">
          <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
            Select Reset Action
          </label>

          {/* Option 1: Clean Seed */}
          <div
            onClick={() => setMode('demo')}
            className={`p-3.5 rounded-lg border cursor-pointer transition flex items-start space-x-3 ${
              mode === 'demo'
                ? 'border-stone-900 bg-stone-50 ring-1 ring-stone-900'
                : 'border-stone-200 hover:border-stone-300'
            }`}
          >
            <Database className="w-4 h-4 mt-0.5 text-indigo-600 shrink-0" />
            <div>
              <div className="text-xs font-bold text-stone-900">Clean Institutional Initial State</div>
              <p className="text-xs text-stone-500 mt-0.5">
                Initializes standard core engineering departments (CSE, ECE, EEE, MECH, IT, CIVIL) with clean database and Master Administrator. Ready for live college setup.
              </p>
            </div>
          </div>

          {/* Option 2: Clear Dues Only */}
          <div
            onClick={() => setMode('clear_dues')}
            className={`p-3.5 rounded-lg border cursor-pointer transition flex items-start space-x-3 ${
              mode === 'clear_dues'
                ? 'border-stone-900 bg-stone-50 ring-1 ring-stone-900'
                : 'border-stone-200 hover:border-stone-300'
            }`}
          >
            <RotateCcw className="w-4 h-4 mt-0.5 text-amber-600 shrink-0" />
            <div>
              <div className="text-xs font-bold text-stone-900">Reset All Clearances to Pending</div>
              <p className="text-xs text-stone-500 mt-0.5">
                Keeps all enrolled students, HODs and staff, but clears all raised fines and approvals back to the initial checklist state.
              </p>
            </div>
          </div>

          {/* Option 3: Wipe All */}
          <div
            onClick={() => setMode('wipe')}
            className={`p-3.5 rounded-lg border cursor-pointer transition flex items-start space-x-3 ${
              mode === 'wipe'
                ? 'border-rose-600 bg-rose-50/50 ring-1 ring-rose-600'
                : 'border-stone-200 hover:border-stone-300'
            }`}
          >
            <Trash2 className="w-4 h-4 mt-0.5 text-rose-600 shrink-0" />
            <div>
              <div className="text-xs font-bold text-rose-900">Factory Wipe (Keep Admin Only)</div>
              <p className="text-xs text-stone-500 mt-0.5">
                Wipes all records. Only the Chief Administrator login remains active so you can configure everything from scratch.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-2 pt-4 border-t border-stone-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-800 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={handleReset}
            className="px-4 py-2 bg-stone-900 text-white rounded-lg text-xs font-bold hover:bg-stone-800 disabled:opacity-50 transition flex items-center space-x-1.5"
          >
            {loading ? (
              <span>Executing Reset...</span>
            ) : (
              <span>Confirm &amp; Execute Reset</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
