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
    id: 'hardvard',
    name: 'Harvard classic',
    css: renderClassicCss,
    color: '#000000',
  },
  {
    id: 'basic',
    name: 'Basic',
    css: basicCss,
    color: '#64748b',
  },

  {
    id: 'modern-split',
    name: 'Modern Split',
    css: modernSplitCss,
    color: '#2563eb',
  },
  {
    id: 'modern',
    name: 'Elegant',
    css: modernCss,
    color: '#0f172a',
  },
  {
    id: 'minimal',
    name: 'Minimal',
    css: minimalCss,
    color: '#525252',
  },
];

export const getThemeById = (id: string) => themes.find((t) => t.id === id) || themes[0];
