import React from 'react';

interface InputProps {
  label?: string;
  value: string | number | readonly string[] | undefined;
  onChange: (val: string) => void;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
  className?: string;
  required?: boolean;
}

export const Input = ({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  disabled = false,
  className = '',
  required = false,
}: InputProps) => (
  <div className={`w-full ${className}`}>
    {label && (
      <label
        className={`mb-1 block text-xs font-bold tracking-wider uppercase ${disabled ? 'text-slate-600' : 'text-gray-400'}`}
      >
        {label}{' '}
        {required && (
          <span className="text-red-400" title="Obligatorio">
            *
          </span>
        )}
      </label>
    )}
    <input
      type={type}
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className={`w-full rounded border bg-[rgba(51,65,85,0.5)] px-3 py-2 text-sm text-white transition-all outline-none focus:ring-2 focus:ring-blue-500 ${disabled ? 'cursor-not-allowed border-slate-800 text-slate-500' : 'border-slate-600 focus:border-transparent'} ${required && !value ? 'border-l-2 border-l-red-500' : ''}`}
    />
  </div>
);

interface TextAreaProps {
  label?: string;
  value: string;
  onChange: (val: string) => void;
  rows?: number;
}

export const TextArea = ({ label, value, onChange, rows = 3 }: TextAreaProps) => (
  <div className="mb-3">
    <label className="mb-1 block text-xs font-bold tracking-wider text-gray-400 uppercase">
      {label}
    </label>
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={rows}
      className="custom-scrollbar w-full rounded border border-slate-600 bg-[rgba(51,65,85,0.5)] px-3 py-2 font-mono text-sm text-white transition-all outline-none focus:border-transparent focus:ring-2 focus:ring-blue-500"
    />
  </div>
);
