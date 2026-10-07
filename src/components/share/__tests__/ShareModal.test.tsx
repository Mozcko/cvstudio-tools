// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { locales } from '../../../i18n/locales';
import { ApiError, api, type PublicLink } from '../../../lib/api';
import ShareModal from '../ShareModal';

vi.mock('../../../lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../lib/api')>();
  return {
    ...actual,
    api: {
      listLinks: vi.fn(),
      saveLink: vi.fn(),
      deleteLink: vi.fn(),
      linkStats: vi.fn(),
    },
  };
});

const mocked = vi.mocked(api);
const t = locales.es;
const getToken = async () => 'token';

const link = (overrides: Partial<PublicLink> = {}): PublicLink => ({
  cv_id: 'cv-1',
  key: 'k7f2m9qx',
  slug: 'ada-lovelace',
  is_active: true,
  paused: false,
  show_email: true,
  show_phone: false,
  indexable: false,
  views_total: 12,
  views_new: 3,
  created_at: '2026-10-07T10:00:00Z',
  ...overrides,
});

const open = (props: Partial<React.ComponentProps<typeof ShareModal>> = {}) =>
  render(
    <ShareModal
      isOpen
      onClose={() => {}}
      t={t}
      cvId="cv-1"
      personName="Ada Lovelace"
      isPro={false}
      getToken={getToken}
      {...props}
    />
  );

const nameInput = () => screen.getByLabelText(t.share.name) as HTMLInputElement;

beforeEach(() => {
  vi.clearAllMocks();
  mocked.listLinks.mockResolvedValue([]);
  mocked.linkStats.mockResolvedValue({
    views_total: 0,
    visitors_total: 0,
    daily: null,
    referrers: null,
  });
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('ShareModal', () => {
  it('suggests a name from the person and publishes with the phone hidden', async () => {
    const onChanged = vi.fn();
    mocked.saveLink.mockResolvedValue(link({ views_total: 0, views_new: 0 }));
    open({ onChanged });

    await waitFor(() => expect(nameInput().value).toBe('ada-lovelace'));
    expect(screen.queryByTestId('share-url')).toBeNull();
    expect(screen.getByTestId('share-name-state').textContent).toBe(t.share.nameHint);

    fireEvent.click(screen.getByRole('button', { name: t.share.publish }));

    await waitFor(() => expect(mocked.saveLink).toHaveBeenCalledTimes(1));
    expect(mocked.saveLink.mock.calls[0].slice(0, 2)).toEqual([
      'cv-1',
      {
        slug: 'ada-lovelace',
        is_active: true,
        show_email: true,
        show_phone: false,
        indexable: false,
      },
    ]);
    // The address carries the key the server assigned
    expect((await screen.findByTestId('share-url')).textContent).toContain(
      '/u/k7f2m9qx/ada-lovelace'
    );
    expect(screen.getByTestId('share-url').getAttribute('href')).toContain(
      '/u/k7f2m9qx/ada-lovelace?preview=1'
    );
    expect(onChanged).toHaveBeenCalledWith(expect.objectContaining({ slug: 'ada-lovelace' }));
    expect(screen.getByTestId('share-message').textContent).toContain(t.share.saved);
  });

  it('shows an existing link with its settings and totals', async () => {
    mocked.listLinks.mockResolvedValue([
      link({ cv_id: 'other', key: 'otherkey' }),
      link({ show_phone: true }),
    ]);
    mocked.linkStats.mockResolvedValue({
      views_total: 12,
      visitors_total: 9,
      daily: null,
      referrers: null,
    });
    open();

    expect((await screen.findByTestId('share-url')).textContent).toContain(
      '/u/k7f2m9qx/ada-lovelace'
    );
    expect(nameInput().value).toBe('ada-lovelace');
    expect((screen.getByLabelText(t.share.showPhone) as HTMLInputElement).checked).toBe(true);
    const stats = await screen.findByTestId('share-stats');
    expect(stats.textContent).toContain('12');
    expect(stats.textContent).toContain('9');
    // Free plan: no chart, and a pointer to what Pro adds
    expect(stats.textContent).toContain(t.share.proStats);
    expect(screen.getByRole('button', { name: t.share.save })).toBeTruthy();
  });

  it('shows days and referrers to Pro users', async () => {
    mocked.listLinks.mockResolvedValue([link()]);
    mocked.linkStats.mockResolvedValue({
      views_total: 5,
      visitors_total: 4,
      daily: [
        { day: '2026-10-06', views: 2 },
        { day: '2026-10-07', views: 3 },
      ],
      referrers: [
        { host: 'linkedin.com', views: 3 },
        { host: null, views: 2 },
      ],
    });
    open({ isPro: true });

    const stats = await screen.findByTestId('share-stats');
    expect(stats.textContent).toContain('linkedin.com');
    expect(stats.textContent).toContain(t.share.direct);
    expect(stats.textContent).toContain(t.share.last30);
    expect(stats.textContent).not.toContain(t.share.proStats);
  });

  it('validates the name while typing; any well-formed name is accepted', async () => {
    open();
    await waitFor(() => expect(nameInput().value).toBe('ada-lovelace'));
    const publish = screen.getByRole('button', { name: t.share.publish }) as HTMLButtonElement;
    const state = () => screen.getByTestId('share-name-state').textContent;

    fireEvent.change(nameInput(), { target: { value: 'ab' } });
    expect(state()).toBe(t.share.problems.length);
    expect(publish.disabled).toBe(true);

    fireEvent.change(nameInput(), { target: { value: 'bad name!' } });
    expect(state()).toBe(t.share.problems.format);
    expect(publish.disabled).toBe(true);

    // Names other people use, or that look like pages of the site, are fine: the key
    // makes the address unique
    for (const name of ['juan-perez', 'admin', 'Pricing']) {
      fireEvent.change(nameInput(), { target: { value: name } });
      expect(state()).toBe(t.share.nameHint);
      expect(publish.disabled).toBe(false);
    }
    expect(nameInput().value).toBe('pricing');
    expect(mocked.saveLink).not.toHaveBeenCalled();
  });

  it('explains the free-plan limit, and a name the server refuses', async () => {
    open();
    await waitFor(() => expect(nameInput().value).toBe('ada-lovelace'));

    mocked.saveLink.mockRejectedValueOnce(new ApiError('Free plan allows one public link', 403));
    fireEvent.click(screen.getByRole('button', { name: t.share.publish }));
    const message = await screen.findByTestId('share-message');
    expect(message.textContent).toContain(t.share.limit);
    expect(message.querySelector('a')?.getAttribute('href')).toBe('/pricing');

    mocked.saveLink.mockRejectedValueOnce(new ApiError('Use lowercase letters', 422));
    fireEvent.click(screen.getByRole('button', { name: t.share.publish }));
    await waitFor(() =>
      expect(screen.getByTestId('share-message').textContent).toContain(t.share.problems.format)
    );
  });

  it('says so when the link is off or paused, instead of showing the address', async () => {
    mocked.listLinks.mockResolvedValue([link({ is_active: false })]);
    const off = open();
    expect(await screen.findByText(t.share.off)).toBeTruthy();
    expect(screen.queryByTestId('share-url')).toBeNull();
    off.unmount();

    mocked.listLinks.mockResolvedValue([link({ paused: true })]);
    open();
    expect(await screen.findByText(t.share.paused)).toBeTruthy();
  });

  it('deletes the link after confirmation', async () => {
    const onChanged = vi.fn();
    mocked.listLinks.mockResolvedValue([link()]);
    mocked.deleteLink.mockResolvedValue(undefined as never);
    const confirm = vi
      .spyOn(window, 'confirm')
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(true);
    open({ onChanged });

    fireEvent.click(await screen.findByRole('button', { name: t.share.remove }));
    expect(mocked.deleteLink).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: t.share.remove }));
    await waitFor(() => expect(mocked.deleteLink).toHaveBeenCalledWith('cv-1', 'token'));
    await waitFor(() => expect(screen.queryByTestId('share-url')).toBeNull());
    expect(onChanged).toHaveBeenCalledWith(null);
    expect(confirm).toHaveBeenCalledTimes(2);
  });

  it('warns that contact details are removed by pattern in Markdown CVs', async () => {
    open({ isMarkdown: true });
    expect(await screen.findByText(new RegExp(t.share.markdownNote.slice(0, 30)))).toBeTruthy();
  });
});
