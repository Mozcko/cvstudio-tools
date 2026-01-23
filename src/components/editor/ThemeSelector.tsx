import React from 'react';
import { themes, type CvTheme } from '../../templates';

interface Props {
    currentTheme: string;
    onSelect: (theme: CvTheme) => void;
}

export default function ThemeSelector({ currentTheme, onSelect }: Props) {
    return (
        <div className="flex items-center gap-1.5 border-l border-slate-700 pl-4 ml-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mr-1 hidden lg:block">
                Tema:
            </span>
            <div className="flex gap-1.5">
                {themes.map((theme) => (
                    <button
                        key={theme.id}
                        onClick={() => onSelect(theme)}
                        className={`
                            w-5 h-5 rounded-full transition-all border border-transparent
                            ${currentTheme === theme.id 
                                ? 'ring-2 ring-blue-500 scale-110 shadow-md shadow-blue-500/20' 
                                : 'hover:scale-110 hover:border-slate-500 opacity-60 hover:opacity-100'
                            }
                        `}
                        style={{ backgroundColor: theme.color }}
                        title={theme.name}
                    />
                ))}
            </div>
        </div>
    );
}