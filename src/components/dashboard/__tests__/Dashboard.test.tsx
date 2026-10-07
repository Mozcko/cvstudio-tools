// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { locales } from '../../../i18n/locales';
import { api } from '../../../lib/api';
import { initialCVData } from '../../../types/cv';
import Dashboard from '../Dashboard';

// Clerk hands out the same getToken on every render; the fake must too
const auth = vi.hoisted(() => ({
  userId: 'user_1',
  isLoaded: true,
  getToken: async () => 'token',
}));
vi.mock('@clerk/astro/react', () => ({ useAuth: () => auth }));
vi.mock('../../../hooks/useProStatus', () => ({
  default: () => ({ isPro: false, isPremium: false, plan: 'free', usage: null, loading: false }),
}));
vi.mock('../../../lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../lib/api')>();
  return { ...actual, api: { getCVs: vi.fn(), createCV: vi.fn(), deleteCV: vi.fn() } };
});

const mocked = vi.mocked(api);

const cv = (id: string) => ({
  id,
  title: `CV ${id}`,
  content: initialCVData,
  language: 'ES',
  theme: null,
  updated_at: '2026-10-01T00:00:00Z',
});

beforeEach(() => {
  vi.clearAllMocks();
  // The CV thumbnails measure themselves; jsdom has no ResizeObserver
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  );
  // Navigation after creating a CV is not implemented in jsdom
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('Dashboard empty state', () => {
  it.each(['es', 'en', 'pt'] as const)('greets a user with no CVs (%s)', async (lang) => {
    mocked.getCVs.mockResolvedValue([]);
    render(<Dashboard lang={lang} />);

    const t = locales[lang].dashboard;
    expect(await screen.findByTestId('dashboard-empty')).toBeTruthy();
    expect(screen.getByRole('heading', { name: t.emptyTitle })).toBeTruthy();
    expect(screen.getByRole('button', { name: t.createFirst })).toBeTruthy();
    expect(screen.getByRole('button', { name: t.emptyImport })).toBeTruthy();
  });

  it('uses the wording the product asked for in Spanish', () => {
    expect(locales.es.dashboard.emptyTitle).toBe('Aún no tienes currículums');
    expect(locales.es.dashboard.createFirst).toBe('Crear mi primer CV');
  });

  it('the big button creates the first CV', async () => {
    mocked.getCVs.mockResolvedValue([]);
    mocked.createCV.mockResolvedValue(cv('new') as never);
    render(<Dashboard lang="es" />);

    fireEvent.click(await screen.findByTestId('create-first-cv'));

    await waitFor(() => expect(mocked.createCV).toHaveBeenCalledTimes(1));
    expect(mocked.createCV.mock.calls[0][0]).toMatchObject({
      title: locales.es.dashboard.newResume.title,
      language: 'ES',
    });
  });

  it('the secondary action opens the import dialog', async () => {
    mocked.getCVs.mockResolvedValue([]);
    render(<Dashboard lang="es" />);

    fireEvent.click(await screen.findByRole('button', { name: locales.es.dashboard.emptyImport }));

    expect(await screen.findByRole('dialog')).toBeTruthy();
    expect(screen.getByText(locales.es.import.title)).toBeTruthy();
  });

  it('is not shown while loading, on an error, or once there is a CV', async () => {
    let resolve: (value: never) => void = () => {};
    mocked.getCVs.mockReturnValue(new Promise((r) => (resolve = r)) as never);
    const loading = render(<Dashboard lang="es" />);
    expect(screen.queryByTestId('dashboard-empty')).toBeNull();
    resolve([cv('1')] as never);
    expect(await screen.findByText('CV 1')).toBeTruthy();
    expect(screen.queryByTestId('dashboard-empty')).toBeNull();
    loading.unmount();

    mocked.getCVs.mockRejectedValue(new Error('Sin conexión'));
    render(<Dashboard lang="es" />);
    expect(await screen.findByText('Sin conexión')).toBeTruthy();
    expect(screen.queryByTestId('dashboard-empty')).toBeNull();
  });

  it('comes back when the last CV is deleted', async () => {
    mocked.getCVs.mockResolvedValue([cv('1')] as never);
    mocked.deleteCV.mockResolvedValue(undefined as never);
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<Dashboard lang="es" />);

    fireEvent.click(await screen.findByTitle(locales.es.dashboard.delete));

    expect(await screen.findByTestId('dashboard-empty')).toBeTruthy();
  });
});
