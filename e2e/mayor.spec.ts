import { test, expect } from './fixtures';
import { ACCOUNTS, login, SEED_IDS } from './helpers/auth';

test.describe('Validation maire', () => {
  test('approuve un lieu public en attente', async ({ page }) => {
    await login(page, ACCOUNTS.maire);
    await page.goto(`/locations/${SEED_IDS.publicPendingLocation}`);
    await expect(page.getByRole('heading', { name: 'Sous-passage place du marché' })).toBeVisible();
    await expect(page.getByText('PENDING_VALIDATION')).toBeVisible();

    await page.getByRole('heading', { name: 'Validation maire' }).scrollIntoViewIfNeeded();
    await page.getByPlaceholder('Commentaire (optionnel)').fill('Lieu validé pour les tests E2E');
    await page.getByRole('button', { name: 'Approuver' }).click();

    await expect(page.getByText('OPEN', { exact: true })).toBeVisible({ timeout: 10_000 });
    await page.goto('/dashboard');
    await expect(page.getByText('Sous-passage place du marché')).not.toBeVisible();
  });
});
