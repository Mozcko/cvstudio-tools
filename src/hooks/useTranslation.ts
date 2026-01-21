import useLocalStorage from './useLocalStorage';
import { locales, type Translation } from '../i18n/locales';

export default function useTranslation() {
  // Guardamos la preferencia 'es' o 'en' en localStorage
  const [lang, setLang] = useLocalStorage<'es' | 'en'>('app-lang', 'es');

  // Obtenemos el objeto de traducciones según el idioma seleccionado
  const t: Translation = locales[lang];

  const toggleLang = () => {
    setLang(lang === 'es' ? 'en' : 'es');
  };

  return { t, lang, toggleLang, setLang };
}