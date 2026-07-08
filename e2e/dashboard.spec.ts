import { test, expect } from './fixtures';
import { ACCOUNTS, login, SEED_IDS } from './helpers/auth';

test.describe('Tableau de bord par rôle', () => {
  test('particulier voit ses lieux', async ({ page }) => {
    await login(page, ACCOUNTS.marie);
    await expect(page.getByRole('heading', { name: 'Mes lieux' })).toBeVisible();
    await expect(page.getByText('Mur de cour intérieure')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Nouveau lieu' })).toBeVisible();
  });

  test('maire voit les lieux en attente', async ({ page }) => {
    await login(page, ACCOUNTS.maire);
    await expect(page.getByRole('heading', { name: 'Lieux en attente de validation' })).toBeVisible();
    await expect(page.getByText('Sous-passage place du marché')).toBeVisible();
  });

  test('artiste voit ses propositions', async ({ page }) => {
    await login(page, ACCOUNTS.lea);
    await expect(page.getByRole('heading', { name: 'Mes propositions' })).toBeVisible();
    await expect(page.getByText('Mur de cour intérieure')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Explorer les lieux' })).toBeVisible();
  });

  test('navigation vers le détail d’un lieu depuis le dashboard', async ({ page }) => {
    await login(page, ACCOUNTS.marie);
    await page.getByRole('link', { name: 'Voir le détail →' }).first().click();
    await expect(page).toHaveURL(`/locations/${SEED_IDS.privateLocation}`);
    await expect(page.getByRole('heading', { name: 'Mur de cour intérieure' })).toBeVisible();
  });
});
