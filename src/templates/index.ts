// @ts-nocheck
import basicCss from './basic.css?raw';
import modernCss from './modern.css?raw';
import minimalCss from './minimal.css?raw';
// Nuevos imports
import renderClassicCss from './render_classic.css?raw';
import modernSplitCss from './modern_split.css?raw';

export interface CvTheme {
    id: string;
    name: string;
    css: string;
    color: string; // Color para el icono
}

export const themes: CvTheme[] = [
    {
        id: 'basic',
        name: 'Básico',
        css: basicCss,
        color: '#64748b' 
    },
    {
        id: 'render-classic',
        name: 'RenderCV (LaTeX)',
        css: renderClassicCss,
        color: '#000000'
    },
    {
        id: 'modern-split',
        name: 'Moderno Dividido',
        css: modernSplitCss,
        color: '#2563eb'
    },
    {
        id: 'modern',
        name: 'Elegante',
        css: modernCss,
        color: '#0f172a'
    },
    {
        id: 'minimal',
        name: 'Minimalista',
        css: minimalCss,
        color: '#525252' 
    }
];

export const getThemeById = (id: string) => themes.find(t => t.id === id) || themes[0];