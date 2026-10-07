// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { locales } from '../../../i18n/locales';
import { api, ApiError } from '../../../lib/api';
import RecruiterApp from '../RecruiterApp';
import { blockedState, fill } from '../shared';
import { trial } from './fixtures';

// Clerk hands out the same getToken on every render; the fake must too
const auth = vi.hoisted(() => ({
  userId: 'user_1',
  isLoaded: true,
  getToken: async () => 'token',
}));
vi.mock('@clerk/astro/react', () => ({ useAuth: () => auth }));
vi.mock('../ScreeningView', () => ({ default: () => <div data-testid="screening" /> }));
vi.mock('../../../lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../lib/api')>();
  return {
    ...actual,
    api: {
      recruiterStatus: vi.fn(),
      recruiterCheckout: vi.fn(),
      recruiterPortal: vi.fn(),
      listScreenings: vi.fn(),
      createScreening: vi.fn(),
      deleteScreening: vi.fn(),
    },
  };
});

const mocked = vi.mocked(api);
const t = locales.es.recruiter;
const assign = vi.fn();

const summary = {
  id: 's1',
  title: 'Backend engineer',
  language: 'es',
  candidates: 12,
  top_score: 91,
  created_at: '2026-10-01T00:00:00Z',
  expires_at: '2026-12-30T00:00:00Z',
};

beforeEach(() => {
  vi.clearAllMocks();
  mocked.recruiterStatus.mockResolvedValue(trial());
  mocked.listScreenings.mockResolvedValue([]);
  vi.stubGlobal('location', { pathname: '/app/recruiter', search: '', assign });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('helpers', () => {
  it('fill replaces known placeholders and leaves the rest', () => {
    expect(fill('{used} de {limit} {x}', { used: 3, limit: 10 })).toBe('3 de 10 {x}');
  });

  it('blockedState names why evaluating is refused', () => {
    expect(blockedState(null)).toBeNull();
    expect(blockedState(trial())).toBeNull();
    expect(blockedState(trial({ can_evaluate: false }))).toBe('trialOver');
    expect(blockedState(trial({ can_evaluate: false, status: 'active', plan: 'starter' }))).toBe(
      'quota'
    );
    expect(blockedState(trial({ can_evaluate: false, status: 'past_due' }))).toBe('pastDue');
    expect(blockedState(trial({ can_evaluate: false, status: 'canceled' }))).toBe('ended');
  });
});

describe('RecruiterApp home', () => {
  it('shows the trial allowance, the form and an empty list', async () => {
    render(<RecruiterApp lang="es" />);

    expect(await screen.findByText('2 de 10 CVs de la prueba gratuita')).toBeTruthy();
    expect(screen.getByText(t.app.planNames.trial)).toBeTruthy();
    expect(screen.getByTestId('new-screening')).toBeTruthy();
    expect(screen.getByTestId('no-screenings')).toBeTruthy();
    // Plans stay folded away until asked for, and there is nothing to manage yet
    expect(screen.queryByTestId('recruiter-plans')).toBeNull();
    expect(screen.queryByText(t.app.manage)).toBeNull();
  });

  it('creates a screening and opens it', async () => {
    mocked.createScreening.mockResolvedValue({ id: 'new-1' } as never);
    render(<RecruiterApp lang="es" />);
    const button = await screen.findByRole('button', { name: t.app.create });
    expect((button as HTMLButtonElement).disabled).toBe(true);

    fireEvent.change(screen.getByLabelText(t.app.role), { target: { value: ' Backend ' } });
    fireEvent.change(screen.getByLabelText(t.app.job), { target: { value: 'x'.repeat(60) } });
    fireEvent.change(screen.getByLabelText(t.app.language), { target: { value: 'en' } });
    fireEvent.click(button);

    await waitFor(() => expect(assign).toHaveBeenCalledWith('/app/recruiter?id=new-1'));
    expect(mocked.createScreening).toHaveBeenCalledWith(
      { title: 'Backend', job_description: 'x'.repeat(60), language: 'en' },
      'token'
    );
  });

  it('tells the recruiter when a screening cannot be created', async () => {
    mocked.createScreening.mockRejectedValue(new ApiError('nope', 500));
    render(<RecruiterApp lang="es" />);
    fireEvent.change(await screen.findByLabelText(t.app.role), { target: { value: 'Backend' } });
    fireEvent.change(screen.getByLabelText(t.app.job), { target: { value: 'x'.repeat(60) } });
    fireEvent.click(screen.getByRole('button', { name: t.app.create }));

    expect((await screen.findByRole('alert')).textContent).toBe(t.errors.create);
    expect(assign).not.toHaveBeenCalled();
  });

  it('once the trial is used: no form, the plans, and checkout leaves for Stripe', async () => {
    mocked.recruiterStatus.mockResolvedValue(
      trial({ can_evaluate: false, used: 10, remaining: 0 })
    );
    mocked.recruiterCheckout.mockResolvedValue({ url: 'https://checkout.example/session' });
    render(<RecruiterApp lang="es" />);

    expect((await screen.findByTestId('recruiter-blocked')).textContent).toBe(
      t.app.states.trialOver
    );
    expect(screen.queryByTestId('new-screening')).toBeNull();
    fireEvent.click(
      screen.getByRole('button', { name: `${t.landing.choose} ${t.landing.plans.pro.name}` })
    );

    await waitFor(() => expect(assign).toHaveBeenCalledWith('https://checkout.example/session'));
    expect(mocked.recruiterCheckout).toHaveBeenCalledWith('pro', 'token');
  });

  it('a subscriber sees usage, renewal and the billing portal, not the plans', async () => {
    mocked.recruiterStatus.mockResolvedValue(
      trial({
        plan: 'starter',
        status: 'active',
        used: 37,
        limit: 100,
        remaining: 63,
        period_end: '2026-11-01T00:00:00Z',
        has_billing: true,
      })
    );
    mocked.recruiterPortal.mockResolvedValue({ url: 'https://billing.example/portal' });
    render(<RecruiterApp lang="es" />);

    expect(await screen.findByText('37 de 100 CVs este mes')).toBeTruthy();
    expect(screen.queryByTestId('recruiter-plans')).toBeNull();
    expect(screen.queryByText(t.app.seePlans)).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: t.app.manage }));

    await waitFor(() => expect(assign).toHaveBeenCalledWith('https://billing.example/portal'));
  });

  it('says so when the payment page cannot be opened', async () => {
    mocked.recruiterCheckout.mockRejectedValue(new ApiError('down', 503));
    render(<RecruiterApp lang="es" />);
    fireEvent.click(await screen.findByRole('button', { name: t.app.seePlans }));
    fireEvent.click(
      screen.getByRole('button', { name: `${t.landing.choose} ${t.landing.plans.starter.name}` })
    );

    expect((await screen.findByRole('alert')).textContent).toBe(t.errors.checkout);
  });

  it('lists screenings and deletes one after confirming', async () => {
    mocked.listScreenings.mockResolvedValue([summary, { ...summary, id: 's2', title: 'Design' }]);
    mocked.deleteScreening.mockResolvedValue(undefined as never);
    const confirm = vi.fn().mockReturnValueOnce(false).mockReturnValue(true);
    vi.stubGlobal('confirm', confirm);
    render(<RecruiterApp lang="es" />);

    expect(await screen.findAllByTestId('screening-row')).toHaveLength(2);
    expect(screen.getAllByText(/12 candidatos · Mejor puntuación: 91/)).toHaveLength(2);
    const remove = screen.getAllByRole('button', { name: t.app.delete })[0];

    fireEvent.click(remove);
    expect(mocked.deleteScreening).not.toHaveBeenCalled();
    fireEvent.click(remove);

    await waitFor(() => expect(screen.getAllByTestId('screening-row')).toHaveLength(1));
    expect(mocked.deleteScreening).toHaveBeenCalledWith('s1', 'token');
    expect(screen.getByText('Design')).toBeTruthy();
  });

  it('reports a failed load', async () => {
    mocked.listScreenings.mockRejectedValue(new ApiError('down', 500));
    render(<RecruiterApp lang="es" />);
    expect((await screen.findByRole('alert')).textContent).toBe(t.errors.load);
  });

  it('opens a screening when the address names one', async () => {
    vi.stubGlobal('location', { pathname: '/app/recruiter', search: '?id=s1', assign });
    render(<RecruiterApp lang="xx" />);
    expect(screen.getByTestId('screening')).toBeTruthy();
    expect(screen.queryByTestId('recruiter-home')).toBeNull();
  });
});
