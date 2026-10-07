import { useEffect } from 'react';
import { useAuth } from '@clerk/astro/react';
import { api } from '../../lib/api';
import { readDraft, removeDraft, writeDraft } from '../../lib/cvDraft';
import { DEFAULT_THEME_ID, getThemeById } from '../../templates';
import { initialCVData } from '../../types/cv';
import { locales } from '../../i18n/locales';
import { getLangFromPath } from '../../i18n/utils';

/**
 * Promotes what a visitor wrote as a guest (the `new` local draft) to a cloud CV right
 * after they sign in. Renders nothing.
 */
export default function GuestSync() {
  const { getToken, userId, isLoaded } = useAuth();

  useEffect(() => {
    const syncGuestData = async () => {
      if (!isLoaded || !userId) return;

      // Inside the editor the draft is on screen and the user saves it themselves;
      // promoting it here as well would create a duplicate.
      if (/\/app\/editor\/?$/.test(window.location.pathname)) return;

      const draft = readDraft(null);
      if (!draft || !draft.dirty) return;

      // Nothing worth keeping if it is still the untouched sample CV
      if (draft.mode === 'form' && JSON.stringify(draft.data) === JSON.stringify(initialCVData)) {
        return;
      }

      try {
        const token = await getToken();
        const themeId = getThemeById(draft.themeId || DEFAULT_THEME_ID).id;

        const created = await api.createCV(
          {
            title:
              draft.title ||
              draft.data.personal?.role ||
              locales[getLangFromPath()].dashboard.untitled,
            content:
              draft.mode === 'code' ? { mode: 'markdown', markdown: draft.markdown } : draft.data,
            language: draft.data.language || 'ES',
            theme: themeId,
          },
          token
        );

        // The draft now belongs to the saved CV
        writeDraft(created.id, { ...draft, themeId, dirty: false, updatedAt: Date.now() });
        removeDraft(null);
        window.dispatchEvent(
          new CustomEvent('cvstudio:cv-created', { detail: { id: created.id } })
        );
      } catch (error) {
        // Most likely the free-plan limit: keep the local draft so nothing is lost
        console.error('Could not promote the guest draft:', error);
      }
    };

    syncGuestData();
  }, [isLoaded, userId, getToken]);

  return null;
}
