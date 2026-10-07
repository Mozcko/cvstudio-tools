import { useState, useRef, useEffect } from 'react';
import { themes, type CvTheme } from '../../templates';
import type { Translation } from '../../i18n/locales';

interface Props {
  currentTheme: string;
  onSelect: (theme: CvTheme) => void;
  t: Translation;
}

export default function ThemeSelector({ currentTheme, onSelect, t }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeTheme = themes.find((theme) => theme.id === currentTheme) || themes[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 transition-all hover:border-slate-600 hover:bg-slate-700 hover:text-white"
        title={t.themes.change}
      >
        <span
          className="h-2.5 w-2.5 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.3)]"
          style={{ backgroundColor: activeTheme.color }}
        ></span>
        <span className="hidden sm:inline">{activeTheme.name}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className={`h-4 w-4 text-slate-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="animate-in fade-in zoom-in-95 absolute right-0 z-50 mt-2 w-48 origin-top-right overflow-hidden rounded-xl border border-slate-700 bg-slate-800 shadow-xl shadow-black/50 duration-100">
          <div className="custom-scrollbar max-h-75 overflow-y-auto p-1">
            <div className="mb-1 border-b border-slate-700/50 px-3 py-2 text-[10px] font-bold tracking-wider text-slate-500 uppercase">
              {t.themes.select}
            </div>
            {themes.map((theme) => (
              <button
                key={theme.id}
                onClick={() => {
                  onSelect(theme);
                  setIsOpen(false);
                }}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-xs transition-colors ${currentTheme === theme.id ? 'bg-blue-600/10 text-blue-400' : 'text-slate-400 hover:bg-slate-700 hover:text-slate-200'}`}
              >
                <span
                  className={`h-2.5 w-2.5 rounded-full ${currentTheme === theme.id ? 'ring-2 ring-blue-500 ring-offset-1 ring-offset-slate-800' : ''}`}
                  style={{ backgroundColor: theme.color }}
                ></span>
                {theme.name}
                {currentTheme === theme.id && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="ml-auto h-3.5 w-3.5"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
