import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useAuth } from '@clerk/astro/react';
import { api, isApiError, type CVRecord, type RewriteAction } from '../../../../lib/api';
import type { ImportResult } from '../../../../lib/import';
import { importedTitle, missingNotice } from '../../../../lib/import/messages';
import {
  migrateLegacyDraft,
  readDraft,
  removeDraft,
  writeDraft,
  type CVDraft,
} from '../../../../lib/cvDraft';
import {
  DEFAULT_SECTION_ORDER,
  initialCVData,
  isMarkdownContent,
  type CVContent,
  type CVData,
  type CVLang,
} from '../../../../types/cv';
import { generateMarkdown } from '../../../../utils/markdownGenerator';
import { parseMarkdownToCV } from '../../../../utils/markdownParser';
import type { CvTheme } from '../../../../templates';
import { DEFAULT_THEME_ID, getThemeById, themes } from '../../../../templates';
import type { Translation } from '../../../../i18n/locales';
import { localePrefixFromPath } from '../../../../i18n/utils';

// Rewrite actions a free user may try a few times a week (the backend enforces the number)
const FREE_AI_ACTIONS: RewriteAction[] = ['enhance', 'optimize'];
const HISTORY_LIMIT = 50;
const HISTORY_DEBOUNCE_MS = 800;

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';
type ToastType = 'success' | 'error' | 'info';

const getUrlId = (): string | null =>
  typeof window === 'undefined' ? null : new URLSearchParams(window.location.search).get('id');

/** Editor URL in the current locale, e.g. /en/app/editor?id=... */
const editorUrl = (id?: string | null) =>
  `${localePrefixFromPath()}/app/editor${id ? `?id=${id}` : ''}`;

const validThemeId = (id: string | null | undefined) =>
  themes.some((theme) => theme.id === id) ? (id as string) : DEFAULT_THEME_ID;

// The old single-draft storage kept the theme's CSS next to an id that could disagree with it.
// What the user actually saw was the CSS, so that decides.
const resolveLegacyTheme = (storedId: string | null, storedCss: string | null) => {
  const byCss = storedCss ? themes.find((theme) => theme.css === storedCss) : undefined;
  return byCss ? byCss.id : validThemeId(storedId);
};

const loadInitialState = () => {
  migrateLegacyDraft(resolveLegacyTheme);
  const urlId = getUrlId();
  return { urlId, draft: readDraft(urlId) };
};

export function useCVLogic(t: Translation, lang: CVLang) {
  const { getToken, userId, isLoaded } = useAuth();
  // While Clerk is still loading nobody is treated as a guest
  const isGuest = isLoaded && !userId;

  const [initial] = useState(loadInitialState);

  // The CV id comes from the URL (?id=...). null = a draft that was never saved.
  const [resumeId, setResumeId] = useState<string | null>(initial.urlId);
  const [rawData, setRawData] = useState<CVData>(initial.draft?.data ?? initialCVData);
  const [activeThemeId, setActiveThemeId] = useState<string>(
    initial.draft ? validThemeId(initial.draft.themeId) : DEFAULT_THEME_ID
  );
  const [resumeTitle, setResumeTitle] = useState<string>(initial.draft?.title ?? '');
  const [editMode, setEditMode] = useState<'form' | 'code'>(initial.draft?.mode ?? 'form');
  // Markdown as typed by the user; only meaningful in code mode
  const [codeMarkdown, setCodeMarkdown] = useState<string>(
    initial.draft?.mode === 'code' ? initial.draft.markdown : ''
  );
  const [isDirty, setIsDirty] = useState(initial.draft?.dirty ?? false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  // Set by Reset: autosave must not push the sample data over the cloud copy on its own
  const [autosavePaused, setAutosavePaused] = useState(false);
  const [isInitializing, setIsInitializing] = useState(!!initial.urlId);
  const [isPro, setIsPro] = useState(false);
  // Enhance / Optimize runs a non-Pro user has left this week (0 until the profile loads)
  const [freeAi, setFreeAi] = useState<{ remaining: number; resetsAt: string | null }>({
    remaining: 0,
    resetsAt: null,
  });
  const [isAiProcessing, setIsAiProcessing] = useState(false);

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalConfig, setAuthModalConfig] = useState<{
    title?: string;
    description?: string;
    mode?: 'auth' | 'upgrade';
  }>({});
  const [isAtsModalOpen, setIsAtsModalOpen] = useState(false);
  const [isCoverLetterOpen, setIsCoverLetterOpen] = useState(false);
  const [isOptimizeModalOpen, setIsOptimizeModalOpen] = useState(false);
  const [isChoiceModalOpen, setIsChoiceModalOpen] = useState(false);
  const [pendingAiData, setPendingAiData] = useState<{
    data: CVData;
    action: RewriteAction;
    lang: CVLang;
  } | null>(null);
  const [toasts, setToasts] = useState<{ id: string; message: string; type: ToastType }[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const triggerAuthModal = useCallback(
    (title?: string, description?: string, mode: 'auth' | 'upgrade' = 'auth') => {
      setAuthModalConfig({ title, description, mode });
      setIsAuthModalOpen(true);
    },
    []
  );

  // ── History (undo / redo) ────────────────────────────────────────────────
  const [past, setPast] = useState<CVData[]>([]);
  const [future, setFuture] = useState<CVData[]>([]);
  const historyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // State before the current burst of edits; becomes one undo step when the burst ends
  const burstStartRef = useRef<CVData | null>(null);

  // Latest values, for callbacks that must not go stale (save race detection, messages)
  const currentDataRef = useRef<CVData>(rawData);
  const currentMarkdownRef = useRef<string>('');
  const currentTitleRef = useRef<string>('');
  const currentThemeRef = useRef<string>(activeThemeId);
  const tRef = useRef<Translation>(t);

  // ── Derived data ─────────────────────────────────────────────────────────
  const cvData = useMemo<CVData>(() => {
    const stored: Partial<CVData['personal']> = rawData?.personal || {};
    const personal: CVData['personal'] = {
      name: stored.name ?? '',
      role: stored.role ?? '',
      summary: stored.summary ?? '',
      email: stored.email ?? '',
      phone: stored.phone ?? '',
      city: stored.city ?? '',
      socials: Array.isArray(stored.socials) ? stored.socials : [],
    };

    const sectionOrder = rawData?.sectionOrder;
    let finalOrder: string[];
    if (!Array.isArray(sectionOrder) || sectionOrder.length === 0) {
      finalOrder = [...DEFAULT_SECTION_ORDER];
    } else {
      const currentOrder = sectionOrder.map((s: string) => String(s).toLowerCase());
      const missingDefaults = DEFAULT_SECTION_ORDER.filter((s) => !currentOrder.includes(s));
      finalOrder = [...currentOrder, ...missingDefaults];
    }

    return {
      ...rawData,
      personal,
      experience: Array.isArray(rawData?.experience) ? rawData.experience : [],
      education: Array.isArray(rawData?.education) ? rawData.education : [],
      skills: Array.isArray(rawData?.skills) ? rawData.skills : [],
      certifications: Array.isArray(rawData?.certifications) ? rawData.certifications : [],
      languages: typeof rawData?.languages === 'string' ? rawData.languages : '',
      interests: typeof rawData?.interests === 'string' ? rawData.interests : '',
      projects: Array.isArray(rawData?.projects) ? rawData.projects : [],
      customSections: Array.isArray(rawData?.customSections) ? rawData.customSections : [],
      sectionOrder: finalOrder,
    };
  }, [rawData]);

  const generatedMarkdown = useMemo(() => generateMarkdown(cvData, lang), [cvData, lang]);
  // In form mode the document is derived from the data; in code mode the user owns it
  const markdown = editMode === 'form' ? generatedMarkdown : codeMarkdown;
  // The stylesheet always follows the theme id, so the two can never disagree
  const customCSS = getThemeById(activeThemeId).css;
  const cvLanguage = rawData?.language || lang.toUpperCase();

  useEffect(() => {
    currentDataRef.current = rawData;
    currentMarkdownRef.current = markdown;
    currentTitleRef.current = resumeTitle;
    currentThemeRef.current = activeThemeId;
    tRef.current = t;
  }, [rawData, markdown, resumeTitle, activeThemeId, t]);

  // ── Local draft ──────────────────────────────────────────────────────────
  const draftId = isGuest ? null : resumeId;

  const applyDraft = useCallback((draft: CVDraft | null) => {
    setRawData(draft?.data ?? initialCVData);
    setActiveThemeId(draft ? validThemeId(draft.themeId) : DEFAULT_THEME_ID);
    setResumeTitle(draft?.title ?? '');
    setEditMode(draft?.mode ?? 'form');
    setCodeMarkdown(draft?.mode === 'code' ? draft.markdown : '');
    setIsDirty(draft?.dirty ?? false);
    setPast([]);
    setFuture([]);
  }, []);

  useEffect(() => {
    if (isInitializing || !isLoaded) return;
    writeDraft(draftId, {
      data: rawData,
      themeId: activeThemeId,
      title: resumeTitle,
      mode: editMode,
      markdown: editMode === 'code' ? codeMarkdown : '',
      dirty: isDirty,
      updatedAt: Date.now(),
    });
  }, [
    isInitializing,
    isLoaded,
    draftId,
    rawData,
    activeThemeId,
    resumeTitle,
    editMode,
    codeMarkdown,
    isDirty,
  ]);

  // ── Pro status ───────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchProStatus = async () => {
      if (!isLoaded || !userId) return;
      try {
        const token = await getToken();
        const profile = await api.getUserProfile(token);
        setIsPro(profile.is_pro);
        const quota = profile.usage?.free_ai;
        setFreeAi({ remaining: quota?.remaining ?? 0, resetsAt: quota?.resets_at ?? null });
      } catch (err: unknown) {
        console.error(err);
      }
    };
    fetchProStatus();
  }, [isLoaded, userId, getToken]);

  // ── Initial load ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isLoaded) return;
    let cancelled = false;

    const applyServerRecord = (record: CVRecord) => {
      let content: CVContent = record.content;
      if (typeof content === 'string') {
        try {
          content = JSON.parse(content);
        } catch (e) {
          console.error('Failed to parse cv content string', e);
        }
      }

      if (isMarkdownContent(content)) {
        setCodeMarkdown(content.markdown || '');
        setEditMode('code');
      } else {
        setRawData({ ...(content as CVData), language: record.language || 'ES' });
        setEditMode('form');
      }
      setResumeTitle(record.title || '');
      setActiveThemeId(validThemeId(record.theme));
      setPast([]);
      setFuture([]);
      setIsDirty(false);
      setSaveStatus('saved');
    };

    const startFresh = () => {
      setResumeId(null);
      applyDraft(readDraft(null));
      setSaveStatus('idle');
    };

    const init = async () => {
      const urlId = getUrlId();
      if (!urlId) {
        setIsInitializing(false);
        return;
      }

      if (!userId) {
        // A signed-out visitor followed a link to a saved CV: show their own draft and ask
        // them to sign in, instead of waiting forever for a request that cannot be made.
        startFresh();
        setIsInitializing(false);
        triggerAuthModal(tRef.current.messages.authTitle, tRef.current.messages.signInToOpen);
        return;
      }

      try {
        const token = await getToken();
        const record = await api.getCV(urlId, token);
        if (cancelled) return;

        const localDraft = readDraft(urlId);
        if (localDraft?.dirty) {
          // Unsaved local changes win; the next (auto)save sends them
          applyDraft(localDraft);
          setSaveStatus('idle');
        } else {
          applyServerRecord(record);
        }
        setResumeId(record.id);
      } catch (err: unknown) {
        if (cancelled) return;
        console.error(err);
        if (isApiError(err, 404) || isApiError(err, 403) || isApiError(err, 422)) {
          // Unknown id (or not ours): drop it and continue with the unsaved draft
          removeDraft(urlId);
          startFresh();
          window.history.replaceState(null, '', editorUrl());
          showToast(tRef.current.messages.notFound, 'info');
        } else {
          // Network or server trouble: keep whatever local copy we have
          showToast(tRef.current.messages.genericError, 'error');
        }
      } finally {
        if (!cancelled) setIsInitializing(false);
      }
    };

    init();
    return () => {
      cancelled = true;
    };
  }, [isLoaded, userId, getToken, applyDraft, showToast, triggerAuthModal]);

  // ── Editing ──────────────────────────────────────────────────────────────
  const markEdited = useCallback(() => {
    setIsDirty(true);
    setSaveStatus('idle');
    setAutosavePaused(false);
  }, []);

  const flushBurst = (): CVData | null => {
    if (historyTimeoutRef.current) clearTimeout(historyTimeoutRef.current);
    historyTimeoutRef.current = null;
    const snapshot = burstStartRef.current;
    burstStartRef.current = null;
    return snapshot;
  };

  const handleDataChange = useCallback(
    (newData: CVData) => {
      // Remember the state before this burst of edits; one undo step per burst
      if (burstStartRef.current === null) burstStartRef.current = currentDataRef.current;
      if (historyTimeoutRef.current) clearTimeout(historyTimeoutRef.current);
      historyTimeoutRef.current = setTimeout(() => {
        const snapshot = burstStartRef.current;
        burstStartRef.current = null;
        historyTimeoutRef.current = null;
        if (snapshot) setPast((prev) => [...prev, snapshot].slice(-HISTORY_LIMIT));
      }, HISTORY_DEBOUNCE_MS);

      setFuture([]);
      currentDataRef.current = newData;
      setRawData(newData);
      markEdited();
    },
    [markEdited]
  );

  /** Past including an edit burst that has not been committed to history yet. */
  const pastWithPendingBurst = (): CVData[] => {
    const pending = flushBurst();
    return pending ? [...past, pending] : past;
  };

  const pushImmediateHistory = (stateToSave: CVData) => {
    setPast([...pastWithPendingBurst(), stateToSave].slice(-HISTORY_LIMIT));
    setFuture([]);
  };

  const handleUndo = () => {
    const fullPast = pastWithPendingBurst();
    if (fullPast.length === 0) return;
    const previous = fullPast[fullPast.length - 1];
    setFuture([rawData, ...future]);
    setRawData(previous);
    setPast(fullPast.slice(0, -1));
    markEdited();
  };

  const handleRedo = () => {
    if (future.length === 0) return;
    const next = future[0];
    setPast([...pastWithPendingBurst(), rawData].slice(-HISTORY_LIMIT));
    setRawData(next);
    setFuture(future.slice(1));
    markEdited();
  };

  const handleThemeChange = (theme: CvTheme) => {
    setActiveThemeId(theme.id);
    markEdited();
  };

  const handleMarkdownChange = (newMarkdown: string) => {
    setCodeMarkdown(newMarkdown);
    markEdited();
  };

  const handleTitleChange = (newTitle: string) => {
    setResumeTitle(newTitle);
    markEdited();
  };

  /**
   * Intercept mode switching: when going code → form, parse the current
   * markdown into CVData. If parsing fails, stay in code mode and warn.
   */
  const handleSetEditMode = (mode: 'form' | 'code') => {
    if (mode === editMode) return;

    if (mode === 'code') {
      setCodeMarkdown(generatedMarkdown);
      setEditMode('code');
      return;
    }

    const parseResult = parseMarkdownToCV(codeMarkdown);
    const normalize = (s: string) => s.replace(/\s+/g, ' ').trim();
    const lossless =
      parseResult.success &&
      parseResult.data !== null &&
      normalize(generateMarkdown(parseResult.data, lang)) === normalize(codeMarkdown);

    if (lossless && parseResult.data) {
      pushImmediateHistory(rawData);
      setRawData({ ...parseResult.data, language: rawData.language || lang.toUpperCase() });
      setEditMode('form');
    } else {
      showToast(t.header.parseError, 'error');
      console.warn('Lossy markdown translation detected. Staying in code mode.');
    }
  };

  const handleReset = () => {
    if (confirm(t.actions.confirmReset)) {
      pushImmediateHistory(rawData);
      setRawData({ ...initialCVData, language: rawData.language });
      setActiveThemeId(DEFAULT_THEME_ID);
      setEditMode('form');
      setIsDirty(true);
      setSaveStatus('idle');
      // Do not let autosave overwrite the saved CV with sample data on its own:
      // it resumes after the next edit, or the user can save explicitly.
      setAutosavePaused(true);
    }
  };

  // ── Saving ───────────────────────────────────────────────────────────────
  const showLimitModal = useCallback(() => {
    triggerAuthModal(t.messages.limitTitle, t.messages.limitDescription, 'upgrade');
  }, [t, triggerAuthModal]);

  const handleSave = useCallback(async () => {
    if (!isLoaded) return;
    if (isGuest) {
      triggerAuthModal(t.messages.authTitle, t.messages.authDescription);
      return;
    }
    if (saveStatus === 'saving' || (!isDirty && saveStatus === 'saved')) return;

    // Capture what is being saved to detect edits made while the request is in flight
    const dataBeingSaved = rawData;
    const markdownBeingSaved = markdown;
    const titleBeingSaved = resumeTitle;
    const themeBeingSaved = activeThemeId;

    setSaveStatus('saving');

    let finalTitle = titleBeingSaved;
    let content: CVContent = cvData;

    if (editMode === 'code') {
      content = { mode: 'markdown', markdown: markdownBeingSaved };
      if (!finalTitle) {
        const h1Match = markdownBeingSaved.match(/^#\s+(.*)/);
        finalTitle = h1Match ? h1Match[1].trim() : 'Markdown CV';
      }
    } else if (!finalTitle) {
      finalTitle = cvData.personal.role || cvData.personal.name || 'Mi CV';
    }

    const body = { title: finalTitle, content, language: cvLanguage, theme: themeBeingSaved };

    const create = async (token: string | null) => {
      const created = await api.createCV(body, token);
      // The draft now belongs to the new id; the effect above stores it under that key
      removeDraft(resumeId);
      setResumeId(created.id);
      window.history.replaceState(null, '', editorUrl(created.id));
    };

    try {
      const token = await getToken();

      if (resumeId) {
        try {
          await api.updateCV(resumeId, body, token);
        } catch (err: unknown) {
          // The id no longer exists (or is not ours): keep the work by saving it as a new CV
          if (isApiError(err, 404) || isApiError(err, 403)) await create(token);
          else throw err;
        }
      } else {
        await create(token);
      }

      if (!titleBeingSaved) setResumeTitle(finalTitle);
      setAutosavePaused(false);

      // Only clear isDirty if nothing changed while we were saving
      const changedSinceStart =
        currentDataRef.current !== dataBeingSaved ||
        currentMarkdownRef.current !== markdownBeingSaved ||
        currentTitleRef.current !== titleBeingSaved ||
        currentThemeRef.current !== themeBeingSaved;

      if (changedSinceStart) {
        // Back to idle so the next autosave picks up the newer edits
        setSaveStatus('idle');
      } else {
        setIsDirty(false);
        setSaveStatus('saved');
      }

      showToast(t.messages.saved);
    } catch (error) {
      console.error('Save error:', error);
      // 'error' also stops autosave from retrying until the user edits again
      setSaveStatus('error');
      if (isApiError(error, 403)) showLimitModal();
      else showToast(t.messages.saveError, 'error');
    }
  }, [
    isLoaded,
    isGuest,
    saveStatus,
    isDirty,
    rawData,
    cvData,
    markdown,
    resumeTitle,
    activeThemeId,
    editMode,
    cvLanguage,
    resumeId,
    getToken,
    showToast,
    showLimitModal,
    triggerAuthModal,
    t,
  ]);

  // ── AI ───────────────────────────────────────────────────────────────────
  /** Message for a free user who has no Enhance / Optimize runs left this week. */
  const freeAiUsedUpMessage = (resetsAt: string | null): string => {
    const date = resetsAt ? new Date(resetsAt) : null;
    return date && !Number.isNaN(date.getTime())
      ? t.messages.freeAiUsedUpUntil.replace(
          '{date}',
          date.toLocaleDateString(lang, { weekday: 'long', day: 'numeric', month: 'long' })
        )
      : t.messages.freeAiUsedUp;
  };

  /**
   * Returns false (after telling the user why) when AI cannot be used. Enhance and Optimize
   * have a small weekly allowance for free users; everything else needs Pro.
   */
  const canUseAi = (action?: RewriteAction): boolean => {
    if (isGuest) {
      triggerAuthModal(t.messages.authTitle, t.messages.authDescription);
      return false;
    }
    if (isPro) return true;

    const hasFreeAllowance = action !== undefined && FREE_AI_ACTIONS.includes(action);
    if (hasFreeAllowance && freeAi.remaining > 0) return true;

    triggerAuthModal(
      t.messages.upgradeTitle,
      hasFreeAllowance ? freeAiUsedUpMessage(freeAi.resetsAt) : t.messages.upgradeDescription,
      'upgrade'
    );
    return false;
  };

  const reportAiError = (error: unknown, fallbackMessage: string) => {
    console.error(error);
    if (isApiError(error, 403)) {
      // The server is the authority on Pro status (a pass may have just expired) and on
      // the free allowance (it may have been used from another tab)
      setIsPro(false);
      setFreeAi((current) => ({ ...current, remaining: 0 }));
      triggerAuthModal(t.messages.upgradeTitle, t.messages.upgradeDescription, 'upgrade');
    } else if (isApiError(error, 429)) {
      showToast(t.messages.aiRateLimited, 'error');
    } else {
      showToast(fallbackMessage, 'error');
    }
  };

  const handleAiAction = async (action: RewriteAction, providedJd?: string) => {
    if (!canUseAi(action)) return;
    setIsAiProcessing(true);
    try {
      const token = await getToken();
      const response = await api.rewriteCV(
        {
          cv_content: cvData,
          action,
          target_language: lang,
          job_description: providedJd || undefined,
        },
        token
      );
      const aiData = response.cv as Partial<CVData>;
      if (!aiData || typeof aiData.personal !== 'object' || aiData.personal === null) {
        throw new Error('Invalid AI response');
      }
      if (typeof response.free_remaining === 'number') {
        const remaining = response.free_remaining;
        setFreeAi((current) => ({ ...current, remaining }));
        showToast(t.messages.freeAiLeft.replace('{n}', String(remaining)), 'info');
      }

      // Merge defensively: anything the model dropped or emptied keeps the user's value
      const text = (value: unknown, fallback: string) =>
        typeof value === 'string' && value ? value : fallback;
      const list = <T>(value: unknown, fallback: T[] | undefined): T[] =>
        Array.isArray(value) && value.length > 0 ? (value as T[]) : fallback || [];

      const aiPersonal = aiData.personal as Partial<CVData['personal']>;
      const finalAiCvData: CVData = {
        ...cvData,
        personal: {
          ...cvData.personal,
          name: text(aiPersonal.name, cvData.personal.name),
          role: text(aiPersonal.role, cvData.personal.role),
          email: text(aiPersonal.email, cvData.personal.email),
          phone: text(aiPersonal.phone, cvData.personal.phone),
          city: text(aiPersonal.city, cvData.personal.city),
          summary: text(aiPersonal.summary, cvData.personal.summary),
          socials: list(aiPersonal.socials, cvData.personal.socials),
        },
        experience: list(aiData.experience, cvData.experience),
        education: list(aiData.education, cvData.education),
        skills: list(aiData.skills, cvData.skills),
        certifications: list(aiData.certifications, cvData.certifications),
        languages: text(aiData.languages, cvData.languages),
        interests: text(aiData.interests, cvData.interests),
        projects: list(aiData.projects, cvData.projects),
        customSections: list(aiData.customSections, cvData.customSections),
        // Section order is the user's choice, never the model's
        sectionOrder: cvData.sectionOrder,
      };

      setPendingAiData({ data: finalAiCvData, action, lang });
      setIsChoiceModalOpen(true);
    } catch (error) {
      reportAiError(error, t.messages.aiError);
    } finally {
      setIsAiProcessing(false);
    }
  };

  const handleChoiceApplied = async (choice: 'overwrite' | 'copy') => {
    if (!pendingAiData) return;
    const { data: finalAiCvData, action, lang: aiLang } = pendingAiData;
    const targetLanguage = action === 'translate' ? aiLang.toUpperCase() : cvLanguage;
    const aiCv: CVData = { ...finalAiCvData, language: targetLanguage };

    try {
      if (choice === 'copy') {
        const token = await getToken();

        // Do not lose pending edits of the CV we are leaving
        if (isDirty && resumeId) {
          try {
            await api.updateCV(
              resumeId,
              {
                title: resumeTitle,
                content: editMode === 'code' ? { mode: 'markdown', markdown } : cvData,
                language: cvLanguage,
                theme: activeThemeId,
              },
              token
            );
            removeDraft(resumeId);
          } catch (e) {
            console.warn(e);
          }
        }

        const copyTitle = `${resumeTitle || 'CV'} (AI)`;
        const created = await api.createCV(
          { title: copyTitle, content: aiCv, language: targetLanguage, theme: activeThemeId },
          token
        );

        setResumeId(created.id);
        setResumeTitle(copyTitle);
        setRawData(aiCv);
        setEditMode('form');
        setPast([]);
        setFuture([]);
        setIsDirty(false);
        setSaveStatus('saved');
        window.history.replaceState(null, '', editorUrl(created.id));
        showToast(t.messages.copyCreated);
      } else {
        pushImmediateHistory(rawData);
        setRawData(aiCv);
        setEditMode('form');
        markEdited();
        showToast(t.messages.applied);
      }
    } catch (error) {
      console.error(error);
      if (isApiError(error, 403)) showLimitModal();
      else showToast(t.messages.genericError, 'error');
    } finally {
      setIsChoiceModalOpen(false);
      setPendingAiData(null);
    }
  };

  // ── Import ───────────────────────────────────────────────────────────────
  /** Token for calls made outside this hook; null for guests. */
  const getAuthToken = useCallback(
    async (): Promise<string | null> => (isGuest ? null : getToken()),
    [isGuest, getToken]
  );

  /** Replaces the open CV with imported data. One undo step brings the previous CV back. */
  const handleImport = (result: ImportResult, fileName: string) => {
    pushImmediateHistory(rawData);
    setRawData(result.data);
    setEditMode('form');
    if (!resumeTitle.trim()) setResumeTitle(importedTitle(t, result, fileName));
    markEdited();
    showToast(t.import.success);
    const notice = missingNotice(t, result);
    if (notice) showToast(notice, 'info');
  };

  const handleAtsAnalysis = async (jd: string) => {
    if (!canUseAi()) return null;
    try {
      const token = await getToken();
      return await api.simulateATS(cvData, jd, lang, token);
    } catch (error) {
      reportAiError(error, t.messages.atsError);
      return null;
    }
  };

  const handleGenerateCoverLetter = async (jd: string): Promise<string | null> => {
    if (!canUseAi()) return null;
    try {
      const token = await getToken();
      const response = await api.generateCoverLetter(cvData, jd, lang, token);
      return response.cover_letter || null;
    } catch (error) {
      reportAiError(error, t.messages.coverLetterError);
      return null;
    }
  };

  // Autosave only for CVs that already exist in the cloud, and only from the 'idle' state:
  // after a failed save the status stays 'error' until the next edit, so a broken connection
  // does not produce a retry (and an error toast) every few seconds.
  const shouldAutosave =
    !!resumeId && !isGuest && !autosavePaused && isDirty && saveStatus === 'idle';

  return {
    cvData,
    handleDataChange,
    activeThemeId,
    handleThemeChange,
    customCSS,
    markdown,
    setMarkdown: handleMarkdownChange,
    editMode,
    setEditMode: handleSetEditMode,
    isAiProcessing,
    handleAiAction,
    saveStatus,
    handleSave,
    handleReset,
    resumeTitle,
    setResumeTitle: handleTitleChange,
    resumeId,
    isDirty,
    autosavePaused,
    shouldAutosave,
    isAtsModalOpen,
    setIsAtsModalOpen,
    handleAtsAnalysis,
    isCoverLetterOpen,
    setIsCoverLetterOpen,
    isOptimizeModalOpen,
    setIsOptimizeModalOpen,
    isChoiceModalOpen,
    setIsChoiceModalOpen,
    handleChoiceApplied,
    handleGenerateCoverLetter,
    handleImport,
    getAuthToken,
    handleUndo,
    handleRedo,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
    isGuest,
    isPro,
    freeAiRemaining: isPro ? null : freeAi.remaining,
    isAuthModalOpen,
    setIsAuthModalOpen,
    triggerAuthModal,
    authModalConfig,
    toasts,
    removeToast,
    isInitializing,
  };
}
