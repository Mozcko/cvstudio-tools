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

export const Input = ({ label, value, onChange, placeholder, type = "text", disabled = false, className = "", required = false }: InputProps) => (
    <div className={`w-full ${className}`}>
      {label && (
        <label className={`block text-xs font-bold mb-1 uppercase tracking-wider ${disabled ? 'text-slate-600' : 'text-gray-400'}`}>
            {label} {required && <span className="text-red-400" title="Obligatorio">*</span>}
        </label>
      )}
      <input 
        type={type} 
        value={value || ''} 
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full bg-slate-700/50 border rounded px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all
            ${disabled ? 'border-slate-800 text-slate-500 cursor-not-allowed' : 'border-slate-600 focus:border-transparent'}
            ${required && !value ? 'border-l-2 border-l-red-500' : ''}`}
      />
    </div>
);

export const TextArea = ({ label, value, onChange, rows = 3 }: any) => (
    <div className="mb-3">
      <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider">{label}</label>
      <textarea 
        value={value} 
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className="w-full bg-slate-700/50 border border-slate-600 rounded px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none font-mono transition-all custom-scrollbar"
      />
    </div>
);