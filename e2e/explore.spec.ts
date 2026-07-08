import { test, expect } from './fixtures';
import { ACCOUNTS, login, SEED_IDS } from './helpers/auth';

test.describe('Exploration des lieux (artiste)', () => {
  test('affiche les lieux ouverts dans la zone', async ({ page }) => {
    await login(page, ACCOUNTS.lea);
    await page.goto('/explore');
    await expect(page.getByRole('heading', { name: 'Explorer les lieux' })).toBeVisible();
    await expect(page.getByText('Mur de cour intérieure')).toBeVisible();
    await expect(page.getByText('Mur bibliothèque municipale')).toBeVisible();
  });

  test('permet d’accéder au détail depuis la liste', async ({ page }) => {
    await login(page, ACCOUNTS.lea);
    await page.goto('/explore');
    await page.getByRole('link', { name: 'Voir et proposer →' }).first().click();
    await expect(page).toHaveURL(/\/locations\//);
    await expect(page.getByRole('button', { name: 'Soumettre une proposition' })).toBeVisible();
  });

  test('invite à se connecter si non authentifié', async ({ page }) => {
    await page.goto('/explore');
    await expect(page.getByText(/Connectez-vous en tant qu'artiste/)).toBeVisible();
  });
});
