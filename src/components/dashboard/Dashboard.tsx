import React, { useEffect, useState, useMemo, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import { useAuth } from '@clerk/astro/react';
import { api, isApiError, type CVRecord, type PublicLink } from '../../lib/api';
import { removeDraft } from '../../lib/cvDraft';
import { DEFAULT_THEME_ID, getThemeById } from '../../templates';
import { isMarkdownContent, type CVData, type CVLang } from '../../types/cv';
import useFitScale from '../../hooks/useFitScale';
import { localePrefixFromPath } from '../../i18n/utils';
import { locales, type Translation } from '../../i18n/locales';
import useProStatus from '../../hooks/useProStatus';
import ImportModal from '../editor/ImportModal';
import EmptyState from './EmptyState';
import ShareModal from '../share/ShareModal';
import { rememberOwnLinks } from '../../lib/publicLinks';
import { cvToMarkdown } from '../../utils/cvMarkdown';
import type { ImportResult } from '../../lib/import';
import { importedTitle } from '../../lib/import/messages';

type Resume = CVRecord;

const ResumeCard = ({
  cv,
  onDelete,
  onShare,
  link,
  t,
}: {
  cv: Resume;
  onDelete: (id: string) => void;
  onShare: (cv: Resume) => void;
  link?: PublicLink;
  t: Translation;
}) => {
  const { containerRef, scale } = useFitScale<HTMLDivElement>(undefined, { initialScale: 0.22 });

  const theme = getThemeById(cv.theme || DEFAULT_THEME_ID);
  const scopedCss = theme.css.replace(
    /\.cv-preview-content/g,
    `#cv-preview-${cv.id} .cv-preview-content`
  );

  const markdownContent = useMemo(() => {
    try {
      return cvToMarkdown(cv.content, cv.language);
    } catch (err) {
      console.error('Error generating markdown for card:', err);
      return '';
    }
  }, [cv]);

  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-slate-700 bg-slate-800 p-5 transition-all hover:border-slate-500">
      <div className="mb-4 flex items-start justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/20 text-xs font-bold text-blue-400 uppercase">
          {cv.language || 'ES'}
        </div>
        <div className="text-xs text-slate-500">{new Date(cv.updated_at).toLocaleDateString()}</div>
      </div>
      <h3 className="mb-1 truncate text-xl font-bold text-white">
        {cv.title || t.dashboard.untitled}
      </h3>
      {link && link.is_active && (
        <p className="mb-2 flex flex-wrap items-center gap-2 text-xs" data-testid="link-status">
          <span
            className={`rounded-full px-2 py-0.5 font-bold ${link.paused ? 'bg-amber-500/15 text-amber-400' : 'bg-emerald-500/15 text-emerald-400'}`}
          >
            {t.share.publicTag}
          </span>
          <span className="text-slate-400">
            {t.share.viewsCount.replace('{n}', String(link.views_total))}
          </span>
          {link.views_new > 0 && (
            <span
              className="rounded-full bg-blue-500/20 px-2 py-0.5 font-bold text-blue-300"
              data-testid="new-views"
            >
              {t.share.newViews.replace('{n}', String(link.views_new))}
            </span>
          )}
        </p>
      )}

      <div
        ref={containerRef}
        className="relative mb-6 h-40 overflow-hidden rounded-md border border-slate-700/50 bg-slate-900/50 shadow-sm transition-all group-hover:border-slate-500/50"
      >
        <style>{scopedCss}</style>
        <div
          id={`cv-preview-${cv.id}`}
          className="relative h-full w-full overflow-hidden bg-slate-800"
        >
          <div
            className="cv-preview-content pointer-events-none origin-top-left bg-white shadow-xl select-none"
            style={{
              width: '210mm',
              minHeight: '297mm',
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
            }}
          >
            <ReactMarkdown rehypePlugins={[rehypeRaw]}>{markdownContent}</ReactMarkdown>
          </div>
        </div>
        <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-slate-800 via-transparent to-transparent"></div>
      </div>

      <div className="mt-auto flex gap-2">
        <a
          href={`${localePrefixFromPath()}/app/editor?id=${cv.id}`}
          className="flex flex-1 items-center justify-center rounded-lg bg-slate-700 py-2 text-center text-sm font-medium text-white transition-colors hover:bg-slate-600"
        >
          {t.dashboard.edit}
        </a>
        <button
          onClick={() => onShare(cv)}
          data-testid="share-open"
          className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-700 hover:text-blue-400"
          title={t.share.button}
          aria-label={t.share.button}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="h-5 w-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z"
            />
          </svg>
        </button>
        <button
          onClick={() => onDelete(cv.id)}
          className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-700 hover:text-red-400"
          title={t.dashboard.delete}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="h-5 w-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default function Dashboard({ lang = 'es' }: { lang?: string }) {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loadingResumes, setLoadingResumes] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getToken, userId } = useAuth();
  const { isPro, loading: loadingPro } = useProStatus();
  const t: Translation = locales[lang as keyof typeof locales] || locales.es;

  const [showProBanner, setShowProBanner] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('hide-pro-banner') !== 'true';
    }
    return true;
  });

  const loading = loadingResumes || loadingPro;
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [links, setLinks] = useState<Record<string, PublicLink>>({});
  const [sharing, setSharing] = useState<Resume | null>(null);
  const cvLang = (['es', 'en', 'pt'].includes(lang) ? lang : 'es') as CVLang;

  /** Public links and their view counts. A failure here must not hide the CVs. */
  const loadLinks = useCallback(async (token: string | null) => {
    try {
      const own = await api.listLinks(token);
      setLinks(Object.fromEntries(own.map((link) => [link.cv_id, link])));
      // The owner's own visits to these pages are not counted as views
      rememberOwnLinks(own.map((link) => link.slug));
      // What is on screen now has been seen; views after this are "new" next time
      if (own.some((link) => link.views_new > 0)) await api.markLinksSeen(token);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const loadResumes = useCallback(async () => {
    if (!userId) return;
    try {
      const token = await getToken();
      const data = await api.getCVs(token);
      setResumes(data || []);
      loadLinks(token);
    } catch (err: unknown) {
      console.error(err);
      if (err instanceof Error) setError(err.message);
      else setError(t.dashboard.loadError);
    } finally {
      setLoadingResumes(false);
    }
  }, [getToken, userId, t, loadLinks]);

  useEffect(() => {
    if (userId) {
      const timer = setTimeout(() => {
        loadResumes();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [userId, loadResumes]);

  // A guest draft promoted to the cloud right after sign-in (see GuestSync) should show up
  useEffect(() => {
    const reload = () => loadResumes();
    window.addEventListener('cvstudio:cv-created', reload);
    return () => window.removeEventListener('cvstudio:cv-created', reload);
  }, [loadResumes]);

  const pricingUrl = `${localePrefixFromPath()}/pricing`;
  const limitMessage = t.dashboard.limitReached;

  /** Free plan: tells the user and sends them to pricing when they cannot add another CV. */
  const atCvLimit = () => {
    if (isPro || resumes.length < 3) return false;
    alert(limitMessage);
    window.location.href = pricingUrl;
    return true;
  };

  const handleOpenImport = () => {
    // Checked first so nobody spends an import on a CV they cannot save
    if (!userId || atCvLimit()) return;
    setIsImportOpen(true);
  };

  const handleImported = async (result: ImportResult, fileName: string) => {
    const token = await getToken();
    try {
      const created = await api.createCV(
        {
          title: importedTitle(t, result, fileName),
          content: result.data,
          language: result.data.language || lang.toUpperCase(),
          theme: DEFAULT_THEME_ID,
        },
        token
      );
      window.location.href = `${localePrefixFromPath()}/app/editor?id=${created.id}`;
    } catch (err: unknown) {
      if (isApiError(err, 403)) {
        alert(limitMessage);
        window.location.href = pricingUrl;
        return;
      }
      throw err;
    }
  };

  const handleCreate = async () => {
    if (!userId || atCvLimit()) return;

    const initialData: CVData = {
      personal: {
        name: t.dashboard.newResume.name,
        role: t.dashboard.newResume.role,
        summary: t.dashboard.newResume.summary,
        email: '',
        phone: '',
        city: '',
        socials: [],
      },
      experience: [],
      education: [],
      skills: [],
      certifications: [],
      languages: '',
      interests: '',
    };

    try {
      const token = await getToken();
      const data = await api.createCV(
        {
          title: t.dashboard.newResume.title,
          content: initialData,
          language: lang.toUpperCase(),
          theme: DEFAULT_THEME_ID,
        },
        token
      );

      window.location.href = `${localePrefixFromPath()}/app/editor?id=${data.id}`;
    } catch (err: unknown) {
      if (isApiError(err, 403)) {
        // The server enforces the free-plan limit too
        alert(limitMessage);
        window.location.href = pricingUrl;
        return;
      }
      const errorMsg = err instanceof Error ? err.message : String(err);
      alert(errorMsg);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t.dashboard.confirmDelete)) return;

    try {
      const token = await getToken();
      await api.deleteCV(id, token);
      removeDraft(id);
      setResumes((prev) => prev.filter((r) => r.id !== id));
    } catch (err: unknown) {
      if (err instanceof Error) alert(err.message);
    }
  };

  return (
    <>
      <div>
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h1 className="mb-2 text-3xl font-bold text-white">{t.ui.nav.dashboard}</h1>
            <p className="text-slate-400">{t.dashboard.subtitle}</p>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <a
              href={`${localePrefixFromPath()}/app/interview`}
              data-testid="interview-link"
              className="flex items-center gap-2 rounded-lg border border-slate-600 px-4 py-2 font-bold text-slate-200 transition-colors hover:border-slate-400 hover:text-white"
            >
              🎙️ {t.interview.navLink}
            </a>
            <button
              onClick={handleOpenImport}
              data-testid="import-open"
              className="flex items-center gap-2 rounded-lg border border-slate-600 px-4 py-2 font-bold text-slate-200 transition-colors hover:border-slate-400 hover:text-white"
            >
              {t.import.dashboardButton}
            </button>
            <button
              onClick={handleCreate}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-bold text-white transition-colors hover:bg-blue-500"
            >
              {t.dashboard.create}
            </button>
          </div>
        </div>

        {isPro && showProBanner && (
          <div className="animate-in fade-in slide-in-from-top-2 relative mb-8 flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 duration-300">
            <span className="text-xl">💎</span>
            <div className="flex-1">
              <p className="text-sm font-bold text-amber-500">{t.dashboard.proAccount}</p>
            </div>
            <button
              onClick={() => {
                setShowProBanner(false);
                localStorage.setItem('hide-pro-banner', 'true');
              }}
              className="p-1 text-amber-500/50 transition-colors hover:text-amber-500"
              title={t.dashboard.dismiss}
              aria-label={t.dashboard.dismiss}
            >
              ✕
            </button>
          </div>
        )}

        {loading ? (
          <div className="animate-pulse py-10 text-center text-slate-500">{t.messages.loading}</div>
        ) : error ? (
          <div className="rounded-lg border border-red-900/50 bg-red-900/10 py-10 text-center text-red-400">
            {error}
          </div>
        ) : resumes.length === 0 ? (
          <EmptyState t={t} onCreate={handleCreate} onImport={handleOpenImport} />
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {resumes.map((cv) => (
              <ResumeCard
                key={cv.id}
                cv={cv}
                onDelete={handleDelete}
                onShare={setSharing}
                link={links[cv.id]}
                t={t}
              />
            ))}
          </div>
        )}
      </div>

      {sharing && (
        <ShareModal
          isOpen
          onClose={() => setSharing(null)}
          t={t}
          cvId={sharing.id}
          personName={
            isMarkdownContent(sharing.content)
              ? sharing.title
              : (sharing.content as Partial<CVData>)?.personal?.name || sharing.title
          }
          isMarkdown={isMarkdownContent(sharing.content)}
          isPro={isPro}
          getToken={getToken}
          onChanged={(link) => {
            setLinks((current) => {
              const next = { ...current };
              if (link) next[sharing.id] = link;
              else delete next[sharing.id];
              rememberOwnLinks(Object.values(next).map((item) => item.slug));
              return next;
            });
          }}
        />
      )}

      <ImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        t={t}
        lang={cvLang}
        getToken={getToken}
        onImported={handleImported}
      />
    </>
  );
}
