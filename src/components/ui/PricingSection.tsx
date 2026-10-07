import RecruiterAsk from '../recruiter/RecruiterAsk';
import React, { useState } from 'react';
import { useAuth } from '@clerk/astro/react';
import { useUiTranslations } from '../../i18n/utils';
import { locales } from '../../i18n/locales';
import useProStatus from '../../hooks/useProStatus';
import { api } from '../../lib/api';

export default function PricingSection({
  lang = 'es',
  isStandalonePage = false,
}: {
  lang?: keyof typeof locales;
  isStandalonePage?: boolean;
}) {
  const { userId, getToken } = useAuth();
  const { isPro } = useProStatus();
  const [loadingPlan, setLoadingPlan] = useState<'7' | '30' | 'lifetime' | null>(null);
  const [promoCode, setPromoCode] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoMessage, setPromoMessage] = useState<{
    text: string;
    type: 'success' | 'error';
  } | null>(null);
  const clickCountRef = React.useRef(0);
  const [secretRevealed, setSecretRevealed] = useState(false);
  const t = useUiTranslations(lang);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pricing = (t('pricing') || {}) as Record<string, any>;
  const langPrefix = lang === 'es' ? '' : `/${lang}`;

  const billing = (locales[lang] || locales.es).billing;
  const currentPlanLabel = billing.currentPlan;

  const handleAction = async (planType: '7' | '30' | 'lifetime') => {
    if (!userId) {
      window.location.href = `${langPrefix}/sign-in`;
      return;
    }

    if (isPro) return;

    try {
      setLoadingPlan(planType);
      const token = await getToken();
      const data = await api.createCheckoutSession(planType, token);

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Stripe Checkout Error:', error);
      alert(billing.paymentError);
    } finally {
      setLoadingPlan(null);
    }
  };

  const handleRedeemPromo = async () => {
    if (!promoCode.trim()) return;
    setPromoLoading(true);
    setPromoMessage(null);
    try {
      const token = await getToken();
      const res = await api.redeemPromo(promoCode.trim(), token);
      if (res && res.success) {
        setPromoMessage({ text: billing.promoSuccess, type: 'success' });
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    } catch (error: unknown) {
      setPromoMessage({
        text: (error as { message?: string }).message || billing.promoInvalid,
        type: 'error',
      });
    } finally {
      setPromoLoading(false);
    }
  };

  const handleTitleClick = () => {
    if (!isStandalonePage) return;
    clickCountRef.current += 1;
    if (clickCountRef.current >= 5) {
      setSecretRevealed(true);
    }
  };

  return (
    <section
      id="pricing"
      className="mx-auto mt-32 w-full max-w-6xl border-t border-white/5 px-4 py-20"
    >
      <div className="mb-16 text-center">
        {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions */}
        <h2
          className="mb-4 cursor-default text-4xl font-bold tracking-tight text-white select-none"
          onClick={handleTitleClick}
        >
          {pricing.title}
        </h2>
        <p className="text-slate-400">{pricing.description}</p>
      </div>

      <div className="grid grid-cols-1 items-stretch gap-6 md:grid-cols-4">
        {/* Free Tier */}
        <div className="flex flex-col rounded-2xl border border-slate-800 bg-slate-900/30 p-8 text-left">
          <h3 className="mb-2 text-lg font-bold text-slate-300">{pricing.plans.free.name}</h3>
          <div className="mb-6">
            <span className="text-3xl font-bold text-white">{pricing.plans.free.price}</span>
          </div>
          <ul className="mb-8 flex-1 space-y-4 text-sm text-slate-400">
            {pricing.plans.free.features.map((feature: string, i: number) => (
              <li
                key={i}
                className={`flex items-center gap-2 ${feature.includes('❌') || feature.includes('(No') || feature.includes('(Não') ? 'text-slate-600' : ''}`}
              >
                {feature.includes('❌') || feature.includes('(No') || feature.includes('(Não')
                  ? ''
                  : '✅ '}{' '}
                {feature}
              </li>
            ))}
          </ul>
          <a
            href={`${langPrefix}/app/editor`}
            className="w-full rounded-xl bg-slate-800 py-3 text-center font-bold text-white transition-colors hover:bg-slate-700"
          >
            {isPro ? currentPlanLabel : pricing.plans.free.action}
          </a>
        </div>

        {/* 7 Day Tier */}
        <div className="flex flex-col rounded-2xl border border-slate-800 bg-slate-900/50 p-8 text-left">
          <h3 className="mb-2 text-lg font-bold text-white">{pricing.plans.sprint.name}</h3>
          <div className="mb-6">
            <span className="text-3xl font-bold text-white">{pricing.plans.sprint.price}</span>
            <span className="text-xs text-slate-500">{pricing.plans.sprint.duration}</span>
          </div>
          <ul className="mb-8 flex-1 space-y-4 text-sm text-slate-300">
            {pricing.plans.sprint.features.map((feature: string, i: number) => (
              <li key={i} className="flex items-center gap-2">
                ✅ {feature}
              </li>
            ))}
          </ul>
          <button
            onClick={() => handleAction('7')}
            disabled={loadingPlan !== null || isPro}
            className="w-full rounded-xl bg-slate-700 py-3 text-center font-bold text-white transition-colors hover:bg-slate-600 disabled:opacity-50"
          >
            {loadingPlan === '7'
              ? pricing.loading
              : isPro
                ? currentPlanLabel
                : pricing.plans.sprint.action}
          </button>
        </div>

        {/* 30 Day Tier - Featured */}
        <div className="relative flex flex-col rounded-2xl border-2 border-blue-500 bg-blue-500/5 p-8 text-left shadow-2xl shadow-blue-500/10">
          <span className="absolute -top-3 left-6 rounded-full bg-blue-500 px-3 py-1 text-[10px] font-bold tracking-widest text-white uppercase">
            {pricing.recommended}
          </span>
          <h3 className="mb-2 text-lg font-bold text-white">{pricing.plans.active.name}</h3>
          <div className="mb-6">
            <span className="text-3xl font-bold text-white">{pricing.plans.active.price}</span>
            <span className="text-xs text-slate-500">{pricing.plans.active.duration}</span>
          </div>
          <ul className="mb-8 flex-1 space-y-4 text-sm text-slate-200">
            {pricing.plans.active.features.map((feature: string, i: number) => (
              <li
                key={i}
                className={`flex items-center gap-2 ${i < 2 ? 'font-bold text-blue-400' : ''}`}
              >
                {i === 0 ? '💎 ' : i === 1 ? '✨ ' : '✅ '} {feature}
              </li>
            ))}
          </ul>
          <button
            onClick={() => handleAction('30')}
            disabled={loadingPlan !== null || isPro}
            className="w-full rounded-xl bg-blue-600 py-3 text-center font-bold text-white shadow-lg shadow-blue-600/20 transition-colors hover:bg-blue-500 disabled:opacity-50"
          >
            {loadingPlan === '30'
              ? pricing.loading
              : isPro
                ? currentPlanLabel
                : pricing.plans.active.action}
          </button>
        </div>

        {/* Lifetime Tier */}
        <div className="flex flex-col rounded-2xl border border-slate-800 bg-slate-900/50 p-8 text-left">
          <h3 className="mb-2 text-lg font-bold text-white">{pricing.plans.lifetime.name}</h3>
          <div className="mb-6">
            <span className="text-3xl font-bold text-white">{pricing.plans.lifetime.price}</span>
            <span className="text-xs text-slate-500">{pricing.plans.lifetime.duration}</span>
          </div>
          <ul className="mb-8 flex-1 space-y-4 text-sm text-slate-300">
            {pricing.plans.lifetime.features.map((feature: string, i: number) => (
              <li
                key={i}
                className={`flex items-center gap-2 ${i < 2 ? 'font-bold text-blue-400' : ''}`}
              >
                {i === 0 ? '🔥 ' : i === 1 ? '🚀 ' : '✅ '} {feature}
              </li>
            ))}
          </ul>
          <button
            onClick={() => handleAction('lifetime')}
            disabled={loadingPlan !== null || isPro}
            className="w-full rounded-xl bg-slate-800 py-3 text-center font-bold text-white transition-colors hover:bg-slate-700 disabled:opacity-50"
          >
            {loadingPlan === 'lifetime'
              ? pricing.loading
              : isPro
                ? currentPlanLabel
                : pricing.plans.lifetime.action}
          </button>
        </div>
      </div>

      {/* Promo Code Section (Hidden by default) */}
      {isStandalonePage && secretRevealed && (
        <div className="animate-in fade-in zoom-in-95 mx-auto mt-12 max-w-lg rounded-xl border border-slate-700 bg-slate-800/50 p-6 shadow-xl transition-all duration-500">
          <h4 className="mb-2 text-sm font-bold text-white">{billing.promoTitle}</h4>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder={billing.promoPlaceholder}
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
              className="w-full flex-1 rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
            <button
              disabled={promoLoading || !promoCode.trim() || isPro}
              onClick={handleRedeemPromo}
              className="rounded-lg bg-slate-700 px-6 py-2 text-sm font-bold text-white transition-colors hover:bg-slate-600 disabled:opacity-50"
            >
              {promoLoading ? '...' : billing.promoRedeem}
            </button>
          </div>
          {promoMessage && (
            <p
              className={`mt-2 text-xs font-semibold ${promoMessage.type === 'success' ? 'text-green-400' : 'text-red-400'}`}
            >
              {promoMessage.text}
            </p>
          )}
        </div>
      )}

      {/* Feature Comparison Table */}
      <div className="mt-20 overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-400">
          <thead className="border-b border-white/5 text-xs text-slate-500 uppercase">
            <tr>
              <th className="py-4 font-medium">{pricing.table.feature}</th>
              <th className="py-4 text-center font-medium">{pricing.table.basic}</th>
              <th className="py-4 text-center font-medium text-blue-400">{pricing.table.pro}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            <tr>
              <td className="py-4">{pricing.table.rows.limit}</td>
              <td className="py-4 text-center">{billing.freeLimit}</td>
              <td className="py-4 text-center text-white">{pricing.table.rows.limitValues}</td>
            </tr>
            <tr>
              <td className="py-4">{pricing.table.rows.ai}</td>
              <td className="py-4 text-center">{billing.freeAi}</td>
              <td className="py-4 text-center text-white">{pricing.table.rows.aiValue}</td>
            </tr>
            <tr>
              <td className="py-4">{pricing.table.rows.cover}</td>
              <td className="py-4 text-center">❌</td>
              <td className="py-4 text-center text-emerald-400 text-white">✅</td>
            </tr>
            <tr>
              <td className="py-4">{pricing.table.rows.ats}</td>
              <td className="py-4 text-center">❌</td>
              <td className="py-4 text-center text-emerald-400 text-white">✅</td>
            </tr>
            <tr>
              <td className="py-4">{pricing.table.rows.links}</td>
              <td className="py-4 text-center">{pricing.table.rows.linksFree}</td>
              <td className="py-4 text-center text-white">{pricing.table.rows.linksPro}</td>
            </tr>
            <tr>
              <td className="py-4">{pricing.table.rows.interview}</td>
              <td className="py-4 text-center">❌</td>
              <td className="py-4 text-center text-white">{pricing.table.rows.interviewValue}</td>
            </tr>
            <tr>
              <td className="py-4">{pricing.table.rows.pdf}</td>
              <td className="py-4 text-center">✅</td>
              <td className="py-4 text-center text-white">✅ {pricing.table.rows.watermark}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <RecruiterAsk lang={lang} className="mt-10 text-center" />
    </section>
  );
}
