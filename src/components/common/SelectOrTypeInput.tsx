import React, { useState, useEffect } from 'react';
import { Edit3, ListFilter, X, Plus, RotateCcw } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  subLabel?: string;
}

export interface SelectOrTypeInputProps {
  id?: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  typePlaceholder?: string;
  required?: boolean;
  allowCustom?: boolean;
  showReset?: boolean;
  defaultValue?: string;
  onReset?: () => void;
  className?: string;
  selectClassName?: string;
  inputClassName?: string;
  helpText?: string;
  suggestions?: string[];
  customLabel?: string;
  dropdownLabel?: string;
  disabled?: boolean;
}

export const SelectOrTypeInput: React.FC<SelectOrTypeInputProps> = ({
  id,
  label,
  value,
  onChange,
  options,
  placeholder = '-- Select an option --',
  typePlaceholder = 'Type custom value or add new...',
  required = false,
  allowCustom = true,
  showReset = true,
  defaultValue = '',
  onReset,
  className = '',
  selectClassName = '',
  inputClassName = '',
  helpText,
  suggestions = [],
  customLabel = 'Type custom / Add new',
  dropdownLabel = 'Choose from list',
  disabled = false,
}) => {
  // Check if value is already a custom value (not present in options list and not empty)
  const isValueInOptions = options.some((opt) => opt.value === value);
  const [isCustom, setIsCustom] = useState<boolean>(Boolean(value && !isValueInOptions));

  useEffect(() => {
    // If external value changes and isn't in options, switch to custom mode
    if (value && !options.some((opt) => opt.value === value)) {
      setIsCustom(true);
    }
  }, [value, options]);

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedVal = e.target.value;
    if (selectedVal === '__TYPE_CUSTOM__') {
      setIsCustom(true);
      onChange('');
    } else {
      onChange(selectedVal);
    }
  };

  const handleToggleMode = () => {
    if (isCustom) {
      setIsCustom(false);
      const matched = options.find((opt) => opt.value === value);
      if (!matched) {
        onChange(defaultValue || options[0]?.value || '');
      }
    } else {
      setIsCustom(true);
    }
  };

  const handleReset = () => {
    if (onReset) {
      onReset();
    } else {
      onChange(defaultValue);
      setIsCustom(false);
    }
  };

  const isModified = value !== defaultValue;

  return (
    <div className={`space-y-1.5 ${className}`}>
      {/* Label, Reset & Mode Switcher */}
      <div className="flex items-center justify-between">
        {label && (
          <label htmlFor={id} className="block font-bold text-stone-700 text-xs">
            {label} {required && <span className="text-rose-500">*</span>}
          </label>
        )}
        <div className="flex items-center space-x-1 ml-auto">
          {showReset && isModified && !disabled && (
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center space-x-1 text-[11px] font-medium text-stone-500 hover:text-stone-800 bg-stone-100 hover:bg-stone-200/90 px-1.5 py-0.5 rounded transition"
              title="Reset selection"
            >
              <RotateCcw className="w-2.5 h-2.5 text-stone-500" />
              <span>Reset</span>
            </button>
          )}
          {allowCustom && !disabled && (
            <button
              type="button"
              onClick={handleToggleMode}
              className="inline-flex items-center space-x-1 text-[11px] font-semibold text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200/90 px-2 py-0.5 rounded transition border border-stone-200"
              title={isCustom ? dropdownLabel : customLabel}
            >
              {isCustom ? (
                <>
                  <ListFilter className="w-3 h-3 text-indigo-600 mr-1" />
                  <span>{dropdownLabel}</span>
                </>
              ) : (
                <>
                  <Edit3 className="w-3 h-3 text-amber-600 mr-1" />
                  <span>{customLabel}</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Input or Select */}
      {isCustom ? (
        <div className="relative">
          <input
            id={id}
            type="text"
            required={required}
            disabled={disabled}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={typePlaceholder}
            autoFocus
            className={`w-full px-3 py-2 pr-8 bg-white border border-amber-400/90 rounded-lg text-stone-900 text-xs shadow-2xs focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 ${inputClassName}`}
          />
          {value && (
            <button
              type="button"
              onClick={() => onChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-0.5 rounded"
              title="Clear text"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ) : (
        <div className="relative">
          <select
            id={id}
            required={required}
            disabled={disabled}
            value={value}
            onChange={handleSelectChange}
            className={`w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-stone-900 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-800 ${selectClassName}`}
          >
            {placeholder && <option value="">{placeholder}</option>}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label} {opt.subLabel ? `(${opt.subLabel})` : ''}
              </option>
            ))}
            {allowCustom && (
              <option value="__TYPE_CUSTOM__" className="font-semibold text-amber-800 bg-amber-50">
                + ✍️ Type new / custom option...
              </option>
            )}
          </select>
        </div>
      )}

      {/* Suggestion pills if provided */}
      {isCustom && suggestions.length > 0 && (
        <div className="flex flex-wrap items-center gap-1 pt-1">
          <span className="text-[10px] text-stone-400 font-medium">Quick suggestions:</span>
          {suggestions.map((sug) => (
            <button
              key={sug}
              type="button"
              onClick={() => onChange(sug)}
              className="inline-flex items-center px-1.5 py-0.5 text-[10px] rounded font-medium bg-stone-100 hover:bg-stone-200 text-stone-700 transition"
            >
              <Plus className="w-2.5 h-2.5 mr-0.5 text-stone-500" />
              {sug}
            </button>
          ))}
        </div>
      )}

      {helpText && <p className="text-[10px] text-stone-500 mt-0.5">{helpText}</p>}
    </div>
  );
};
