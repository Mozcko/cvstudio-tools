import { expect, test } from '@playwright/test';
import { collectErrors, expectSheetToContain, openGuestEditor, waitForEditor } from './helpers';

/**
 * Everything a visitor can do without an account. No backend is needed:
 * a guest's work lives in the browser.
 */
test.describe('Guest editor', () => {
  test('shows the sample CV and follows what is typed', async ({ page }) => {
    const errors = collectErrors(page);
    await openGuestEditor(page);

    await expect(page.getByText('Información Personal').first()).toBeVisible();
    await expectSheetToContain(page, 'John Doe');

    await page.locator('input[value="John Doe"]').first().fill('Ada Lovelace');
    await expectSheetToContain(page, 'Ada Lovelace');

    expect(errors).toEqual([]);
  });

  test('undo and redo work on a whole burst of typing', async ({ page }) => {
    await openGuestEditor(page);
    await page.locator('input[value="John Doe"]').first().fill('Ada Lovelace');
    await expectSheetToContain(page, 'Ada Lovelace');
    // Let the burst be committed to history
    await page.waitForTimeout(1000);

    await page.keyboard.press('Control+z');
    await expectSheetToContain(page, 'John Doe');

    await page.keyboard.press('Control+y');
    await expectSheetToContain(page, 'Ada Lovelace');
  });

  test('the draft survives a reload', async ({ page }) => {
    await openGuestEditor(page);
    await page.locator('input[value="John Doe"]').first().fill('Grace Hopper');
    await expectSheetToContain(page, 'Grace Hopper');

    await expect
      .poll(() => page.evaluate(() => localStorage.getItem('cv-draft:new') || ''))
      .toContain('Grace Hopper');
    await page.reload();
    await waitForEditor(page);

    await expectSheetToContain(page, 'Grace Hopper');
  });

  test('switching theme restyles the sheet', async ({ page }) => {
    await openGuestEditor(page);
    const font = () =>
      page.evaluate(
        () => getComputedStyle(document.querySelector('.cv-preview-content')!).fontFamily
      );
    const before = await font();

    await page.getByTitle('Cambiar Tema').click();
    await page.getByRole('button', { name: 'Minimal' }).click();

    await expect.poll(font).not.toBe(before);
    await expect.poll(font).toContain('Courier');
  });

  test('form → Markdown → form keeps the content', async ({ page }) => {
    const errors = collectErrors(page);
    await openGuestEditor(page);
    await page.locator('input[value="John Doe"]').first().fill('Ada Lovelace');

    await page.getByTestId('mode-code').click();
    const markdown = page.locator('textarea').first();
    await expect(markdown).toHaveValue(/^# Ada Lovelace/);

    await page.getByTestId('mode-form').click();
    await expect(page.getByText('Información Personal').first()).toBeVisible();
    await expectSheetToContain(page, 'Ada Lovelace');

    expect(errors).toEqual([]);
  });

  test('hand-written Markdown that would be lost keeps the editor in Markdown mode', async ({
    page,
  }) => {
    await openGuestEditor(page);
    await page.getByTestId('mode-code').click();
    const markdown = page.locator('textarea').first();
    await markdown.fill((await markdown.inputValue()) + '\n\n<table><tr><td>hecho a mano');

    await page.getByTestId('mode-form').click();

    // Still in Markdown mode: the form's date inputs are not rendered
    await expect(page.locator('input[type="month"]')).toHaveCount(0);
    await expect(page.getByText(/No se pudo convertir/i)).toBeVisible();
  });

  for (const { lang, toggles, heading, month } of [
    { lang: 'es', toggles: 0, heading: 'Experiencia Profesional', month: 'abr 2023' },
    { lang: 'en', toggles: 1, heading: 'Professional Experience', month: 'Apr 2023' },
    { lang: 'pt', toggles: 2, heading: 'Experiência Profissional', month: 'abr 2023' },
  ]) {
    test(`dates and headings round-trip through Markdown in ${lang}`, async ({ page }) => {
      await openGuestEditor(page);
      // The sample CV's first job starts in 2023-01; April is one of the months that used to break
      await page.locator('input[type="month"]').first().fill('2023-04');
      for (let i = 0; i < toggles; i++) await page.getByTestId('lang-toggle').click();
      await expectSheetToContain(page, heading);
      await expectSheetToContain(page, month);

      await page.getByTestId('mode-code').click();
      await expect(page.locator('textarea').first()).toHaveValue(new RegExp(month));
      // Back to the form: only accepted if the Markdown parses back losslessly
      await page.getByTestId('mode-form').click();

      // The date inputs only exist in the form; in Markdown mode there are none
      await expect(page.locator('input[type="month"]').first()).toHaveValue('2023-04');
    });
  }

  test('the English editor shows no Spanish interface text', async ({ page }) => {
    await openGuestEditor(page, '/en/app/editor');

    await expect(page.getByText('Personal Information').first()).toBeVisible();
    await expect(page.getByText('You are editing as a guest')).toBeVisible();
    await expect(page.getByTitle('Change Theme')).toBeVisible();
    await expect(page.getByText('File Name')).toBeVisible();

    // The sample CV is content, not interface: look only outside the sheet and the inputs
    const chrome = await page.evaluate(() => {
      const clone = document.body.cloneNode(true) as HTMLElement;
      clone.querySelectorAll('.cv-preview-content, script, style').forEach((n) => n.remove());
      const titles = [...clone.querySelectorAll('[title], [placeholder]')].map(
        (n) => `${n.getAttribute('title') || ''} ${n.getAttribute('placeholder') || ''}`
      );
      return `${clone.textContent} ${titles.join(' ')}`;
    });
    for (const spanish of [
      'Información',
      'Cambiar',
      'Nombre',
      'Guardar',
      'Descargar',
      'Secciones',
      'invitado',
      'Obligatorio',
      'Enlace',
    ]) {
      expect(chrome, spanish).not.toContain(spanish);
    }
  });

  test('saving and downloading ask a guest to sign in', async ({ page }) => {
    await openGuestEditor(page);
    const signInLink = page.getByRole('link', { name: 'Iniciar sesión' });

    await page
      .getByRole('button', { name: /Descargar PDF/i })
      .first()
      .click();
    await expect(signInLink.first()).toBeVisible();
    await page.getByRole('button', { name: 'Cerrar' }).last().click();

    await page.keyboard.press('Control+s');
    await expect(signInLink.first()).toBeVisible();
  });
});
