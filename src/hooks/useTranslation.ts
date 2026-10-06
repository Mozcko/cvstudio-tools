import useLocalStorage from './useLocalStorage';
import { locales, type Translation } from '../i18n/locales';
import { getLangFromPath } from '../i18n/utils';

export default function useTranslation() {
  // Guardamos la preferencia 'es', 'en' o 'pt' en localStorage.
  // Sin preferencia guardada, se usa el idioma de la URL (/en/..., /pt/...).
  const [lang, setLang] = useLocalStorage<'es' | 'en' | 'pt'>('app-lang', getLangFromPath());

  // Obtenemos el objeto de traducciones según el idioma seleccionado
  const t: Translation = locales[lang] || locales.es;

  const toggleLang = () => {
    if (lang === 'es') setLang('en');
    else if (lang === 'en') setLang('pt');
    else setLang('es');
  };

  return { t, lang, toggleLang, setLang };
}
