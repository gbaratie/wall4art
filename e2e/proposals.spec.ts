import { test, expect } from './fixtures';
import { ACCOUNTS, fillField, login, SEED_IDS } from './helpers/auth';

test.describe('Propositions d’œuvres', () => {
  test('artiste soumet une proposition sur un lieu ouvert', async ({ page }) => {
    await login(page, ACCOUNTS.tom);
    await page.goto(`/locations/${SEED_IDS.publicApprovedLocation}`);
    await page.getByRole('button', { name: 'Soumettre une proposition' }).click();

    const form = page.locator('form').filter({ hasText: 'Nouvelle proposition' });
    await fillField(form, 'Titre', 'Fresque littéraire E2E');
    await fillField(form, 'Description', 'Une fresque célébrant la lecture et la culture locale.');
    await fillField(form, 'Engagements', 'Respect des délais et entretien pendant 2 ans.');
    await fillField(form, 'Durée estimée (jours)', '21');

    const [response] = await Promise.all([
      page.waitForResponse(
        (res) => res.url().includes('/proposals') && res.request().method() === 'POST',
      ),
      page.getByRole('button', { name: 'Envoyer' }).click(),
    ]);
    expect(response.status()).toBe(201);

    await page.goto('/dashboard');
    await expect(page.getByText('Fresque littéraire E2E')).toBeVisible({ timeout: 10_000 });
  });

  test('hôte consulte et accepte une proposition', async ({ page }) => {
    await login(page, ACCOUNTS.marie);
    await page.goto(`/locations/${SEED_IDS.privateLocation}`);
    await expect(page.getByRole('heading', { name: 'Propositions reçues' })).toBeVisible();
    await expect(page.getByText('par Léa Artiste Paris')).toBeVisible();

    await page.getByRole('button', { name: 'Accepter' }).click();
    await expect(page.getByText('ACCEPTED')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('MATCHED')).toBeVisible();
  });
});
