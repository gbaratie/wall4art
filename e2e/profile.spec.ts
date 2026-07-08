import { test, expect } from './fixtures';
import { ACCOUNTS, fillField, login } from './helpers/auth';

test.describe('Profil utilisateur', () => {
  test('met à jour la ville et le rayon de recherche', async ({ page }) => {
    await login(page, ACCOUNTS.lea);
    await page.goto('/profile');
    await expect(page.getByRole('heading', { name: 'Mon profil' })).toBeVisible();

    await fillField(page, 'Ville', 'Paris 11e');
    await fillField(page, 'Rayon de recherche (km)', '45');
    await page.getByRole('button', { name: 'Enregistrer' }).click();

    await page.goto('/explore');
    await expect(page.getByText(/rayon de 45 km/)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/autour de Paris 11e/)).toBeVisible();
  });

  test('affiche les champs portfolio pour un artiste', async ({ page }) => {
    await login(page, ACCOUNTS.lea);
    await page.goto('/profile');
    await expect(page.getByText('Instagram', { exact: true })).toBeVisible();
    await expect(page.getByText('Behance', { exact: true })).toBeVisible();
    await expect(page.getByText('Site web', { exact: true })).toBeVisible();
  });
});
