import React, { useState, useEffect } from 'react';
import { Department, User } from '../../types';
import { X, Building2, Save, AlertCircle, RotateCcw } from 'lucide-react';
import { SelectOrTypeInput, SelectOption } from '../common/SelectOrTypeInput';

interface DepartmentModalProps {
  department?: Department | null; // If null, mode is Add
  hods: User[];
  token: string;
  onClose: () => void;
  onSaved: (dept: Department) => void;
}

export const DepartmentModal: React.FC<DepartmentModalProps> = ({
  department,
  hods,
  token,
  onClose,
  onSaved,
}) => {
  const isEditing = Boolean(department);
  const [code, setCode] = useState(department?.code || '');
  const [name, setName] = useState(department?.name || '');
  const [description, setDescription] = useState(department?.description || '');
  const [hodId, setHodId] = useState(department?.hodId || '');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setCode(department?.code || '');
    setName(department?.name || '');
    setDescription(department?.description || '');
    setHodId(department?.hodId || '');
    setError(null);
  };

  useEffect(() => {
    resetForm();
  }, [department]);

  const hodOptions: SelectOption[] = [
    { value: '', label: 'No HOD Assigned (Vacant)' },
    ...hods.map((h) => ({
      value: h.id,
      label: h.name,
      subLabel: h.username,
    })),
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const url = isEditing ? `/api/departments/${department!.id}` : '/api/departments';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          code: code.trim().toUpperCase(),
          name: name.trim(),
          description: description.trim(),
          hodId: isEditing ? hodId : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save department');
      }

      onSaved(data);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error saving department');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200 animate-in fade-in zoom-in duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-stone-100">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-stone-100 text-stone-900 rounded-xl">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900">
                {isEditing ? 'Edit Department' : 'Add New Department'}
              </h3>
              <p className="text-xs text-stone-500">
                {isEditing ? 'Update department code, title and leadership' : 'Register a new academic department'}
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

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          <div>
            <label className="block font-bold text-stone-700 mb-1">Department Code</label>
            <input
              type="text"
              required
              placeholder="e.g. CSE, ECE, MECH, AIDS, IT"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg font-mono font-bold text-stone-900 focus:bg-white focus:ring-1 focus:ring-stone-900 uppercase"
            />
          </div>

          <div>
            <label className="block font-bold text-stone-700 mb-1">Department Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Computer Science and Engineering"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-900 focus:bg-white focus:ring-1 focus:ring-stone-900"
            />
          </div>

          <div>
            <label className="block font-bold text-stone-700 mb-1">Description / Notes</label>
            <textarea
              rows={3}
              placeholder="Brief description of department labs and academic division"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-900 focus:bg-white focus:ring-1 focus:ring-stone-900"
            />
          </div>

          {isEditing && (
            <div>
              <SelectOrTypeInput
                id="dept-hod-select"
                label="Assigned Department HOD"
                value={hodId}
                onChange={(val) => setHodId(val)}
                options={hodOptions}
                placeholder="-- Select or type HOD --"
                typePlaceholder="Type custom HOD name..."
                defaultValue={department?.hodId || ''}
              />
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-stone-100">
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex items-center space-x-1 px-3 py-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-lg transition"
              title="Reset form"
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
                <span>{saving ? 'Saving...' : 'Save Department'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
