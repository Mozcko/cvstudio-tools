import React, { useEffect, useState } from 'react';
import {
  api,
  isApiError,
  type LinkStats,
  type PublicLink,
  type PublicLinkSettings,
} from '../../lib/api';
import type { Translation } from '../../i18n/locales';
import { localePrefixFromPath } from '../../i18n/utils';
import { normalizeSlug, publicUrl, slugProblem, suggestSlug } from '../../lib/publicLinks';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  t: Translation;
  cvId: string;
  /** The person's name, used to suggest a link name. */
  personName: string;
  /** Contact details cannot be hidden field by field in a hand-written Markdown CV. */
  isMarkdown?: boolean;
  isPro: boolean;
  getToken: () => Promise<string | null>;
  /** Called with the link after every change (null when it was deleted). */
  onChanged?: (link: PublicLink | null) => void;
}

const toggleRow =
  'flex cursor-pointer items-center justify-between gap-3 py-2 text-sm text-slate-200';

export default function ShareModal({
  isOpen,
  onClose,
  t,
  cvId,
  personName,
  isMarkdown = false,
  isPro,
  getToken,
  onChanged,
}: ShareModalProps) {
  const [loading, setLoading] = useState(true);
  const [link, setLink] = useState<PublicLink | null>(null);
  const [stats, setStats] = useState<LinkStats | null>(null);
  const [form, setForm] = useState<PublicLinkSettings>({
    slug: '',
    is_active: true,
    show_email: true,
    show_phone: false,
    indexable: false,
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ kind: 'ok' | 'error' | 'limit'; text: string } | null>(
    null
  );
  const [copied, setCopied] = useState(false);

  // Load the CV's link (if it has one) each time the dialog opens
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setMessage(null);
      setStats(null);
      try {
        const token = await getToken();
        const own = (await api.listLinks(token)).find((item) => item.cv_id === cvId) || null;
        if (cancelled) return;
        setLink(own);
        setForm(
          own
            ? {
                slug: own.slug,
                is_active: own.is_active,
                show_email: own.show_email,
                show_phone: own.show_phone,
                indexable: own.indexable,
              }
            : {
                slug: suggestSlug(personName),
                is_active: true,
                show_email: true,
                show_phone: false,
                indexable: false,
              }
        );
        if (own) {
          const loaded = await api.linkStats(cvId, token);
          if (!cancelled) setStats(loaded);
        }
      } catch (error) {
        console.error(error);
        if (!cancelled) setMessage({ kind: 'error', text: t.share.error });
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [isOpen, cvId, personName, getToken, t]);

  if (!isOpen) return null;

  const slug = normalizeSlug(form.slug);
  const nameProblem = slugProblem(slug);
  const url = link ? publicUrl(link) : '';
  const online = !!link && link.is_active && !link.paused;

  const save = async () => {
    if (nameProblem || saving) return;
    setSaving(true);
    setMessage(null);
    try {
      const token = await getToken();
      const saved = await api.saveLink(cvId, { ...form, slug }, token);
      setLink(saved);
      setForm((current) => ({ ...current, slug: saved.slug }));
      setMessage({ kind: 'ok', text: t.share.saved });
      onChanged?.(saved);
      if (!stats) setStats(await api.linkStats(cvId, token));
    } catch (error) {
      if (isApiError(error, 403)) setMessage({ kind: 'limit', text: t.share.limit });
      else if (isApiError(error, 422)) setMessage({ kind: 'error', text: t.share.problems.format });
      else setMessage({ kind: 'error', text: t.share.error });
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!link || !window.confirm(t.share.confirmRemove)) return;
    setSaving(true);
    try {
      await api.deleteLink(cvId, await getToken());
      setLink(null);
      setStats(null);
      setMessage(null);
      onChanged?.(null);
    } catch (error) {
      console.error(error);
      setMessage({ kind: 'error', text: t.share.error });
    } finally {
      setSaving(false);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error(error);
    }
  };

  const toggle = (key: 'is_active' | 'show_email' | 'show_phone' | 'indexable', label: string) => (
    <label className={toggleRow}>
      <span>{label}</span>
      <input
        type="checkbox"
        className="h-4 w-4 accent-blue-500"
        checked={form[key]}
        onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.checked }))}
      />
    </label>
  );

  const peak = stats?.daily ? Math.max(1, ...stats.daily.map((day) => day.views)) : 1;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
        onClick={onClose}
        onKeyDown={(event) => event.key === 'Enter' && onClose()}
        role="button"
        tabIndex={0}
        aria-label={t.actions.close}
      />

      <div
        className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl md:p-8"
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-title"
        data-testid="share-modal"
      >
        <h2 id="share-title" className="mb-1 text-2xl font-bold text-white">
          {t.share.title}
        </h2>
        <p className="mb-5 text-sm text-slate-400">{t.share.description}</p>

        {loading ? (
          <p className="animate-pulse py-8 text-center text-slate-500">{t.messages.loading}</p>
        ) : (
          <>
            {link && (
              <div
                className={`mb-5 rounded-xl border p-3 ${online ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-amber-500/30 bg-amber-500/10'}`}
              >
                {online ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <a
                      href={`${url}?preview=1`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="min-w-0 flex-1 truncate text-sm font-medium text-emerald-300 underline"
                      data-testid="share-url"
                    >
                      {url.replace(/^https?:\/\//, '')}
                    </a>
                    <button
                      type="button"
                      onClick={copy}
                      className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-700"
                    >
                      {copied ? t.share.copied : t.share.copy}
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-amber-300">
                    {link.paused ? t.share.paused : t.share.off}
                  </p>
                )}
              </div>
            )}

            <div className="mb-4">
              <label
                htmlFor="share-slug"
                className="mb-1 block text-xs font-bold tracking-wider text-slate-400 uppercase"
              >
                {t.share.name}
              </label>
              <div className="flex items-center rounded-lg border border-slate-600 bg-slate-950 focus-within:border-blue-500">
                <span className="pl-3 text-sm whitespace-nowrap text-slate-500">
                  /u/{link ? link.key : '…'}/
                </span>
                <input
                  id="share-slug"
                  className="w-full bg-transparent px-1 py-2 text-sm text-white outline-none"
                  value={form.slug}
                  maxLength={40}
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, slug: event.target.value.toLowerCase() }))
                  }
                />
              </div>
              <p
                className={`mt-1 text-xs ${nameProblem ? 'text-red-400' : 'text-slate-500'}`}
                data-testid="share-name-state"
              >
                {nameProblem ? t.share.problems[nameProblem] : t.share.nameHint}
              </p>
            </div>

            <div className="mb-4 divide-y divide-slate-800 rounded-xl border border-slate-700 px-4">
              {toggle('is_active', t.share.active)}
              {toggle('show_email', t.share.showEmail)}
              {toggle('show_phone', t.share.showPhone)}
              {toggle('indexable', t.share.indexable)}
            </div>
            <p className="mb-4 text-xs text-slate-500">
              {t.share.publicNote} {isMarkdown && t.share.markdownNote}
            </p>

            {message && (
              <div
                role={message.kind === 'ok' ? 'status' : 'alert'}
                data-testid="share-message"
                className={`mb-4 rounded-lg border px-3 py-2 text-sm ${
                  message.kind === 'ok'
                    ? 'border-emerald-900/50 bg-emerald-900/10 text-emerald-300'
                    : 'border-red-900/50 bg-red-900/10 text-red-300'
                }`}
              >
                <p>{message.text}</p>
                {message.kind === 'limit' && (
                  <a
                    href={`${localePrefixFromPath()}/pricing`}
                    className="mt-1 inline-block font-bold underline"
                  >
                    {t.messages.upgrade}
                  </a>
                )}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={save}
                disabled={saving || !!nameProblem}
                data-testid="share-save"
                className="rounded-lg bg-blue-600 px-5 py-2.5 font-bold text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {link ? t.share.save : t.share.publish}
              </button>
              {link && (
                <button
                  type="button"
                  onClick={remove}
                  disabled={saving}
                  className="text-sm font-medium text-red-300 underline hover:text-red-200"
                >
                  {t.share.remove}
                </button>
              )}
            </div>

            {link && stats && (
              <section className="mt-6 border-t border-slate-800 pt-5" data-testid="share-stats">
                <h3 className="mb-3 text-sm font-bold text-white">{t.share.statsTitle}</h3>
                <div className="mb-4 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-slate-800 p-3 text-center">
                    <p className="text-2xl font-black text-white tabular-nums">
                      {stats.views_total}
                    </p>
                    <p className="text-xs text-slate-400">{t.share.views}</p>
                  </div>
                  <div className="rounded-xl bg-slate-800 p-3 text-center">
                    <p className="text-2xl font-black text-white tabular-nums">
                      {stats.visitors_total}
                    </p>
                    <p className="text-xs text-slate-400">{t.share.visitors}</p>
                  </div>
                </div>

                {stats.daily && stats.referrers ? (
                  stats.views_total === 0 ? (
                    <p className="text-sm text-slate-500">{t.share.noViews}</p>
                  ) : (
                    <>
                      <p className="mb-1 text-xs font-bold tracking-wider text-slate-500 uppercase">
                        {t.share.last30}
                      </p>
                      <div className="mb-4 flex h-16 items-end gap-px" aria-hidden="true">
                        {stats.daily.map((day) => (
                          <div
                            key={day.day}
                            title={`${day.day}: ${day.views}`}
                            className="flex-1 rounded-t bg-blue-500/80"
                            style={{
                              height: `${Math.max(day.views ? 8 : 2, (day.views / peak) * 100)}%`,
                            }}
                          />
                        ))}
                      </div>
                      <p className="mb-1 text-xs font-bold tracking-wider text-slate-500 uppercase">
                        {t.share.sources}
                      </p>
                      <ul className="space-y-1 text-sm text-slate-300">
                        {stats.referrers.map((referrer) => (
                          <li
                            key={referrer.host ?? 'direct'}
                            className="flex justify-between gap-3"
                          >
                            <span className="truncate">{referrer.host ?? t.share.direct}</span>
                            <span className="text-slate-400 tabular-nums">{referrer.views}</span>
                          </li>
                        ))}
                      </ul>
                    </>
                  )
                ) : (
                  !isPro && (
                    <p className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs text-amber-300">
                      {t.share.proStats}{' '}
                      <a href={`${localePrefixFromPath()}/pricing`} className="font-bold underline">
                        {t.messages.upgrade}
                      </a>
                    </p>
                  )
                )}
              </section>
            )}
          </>
        )}

        <button
          onClick={onClose}
          className="mt-6 w-full rounded-xl border border-slate-700 py-2.5 text-sm font-bold text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
        >
          {t.actions.close}
        </button>
      </div>
    </div>
  );
}
