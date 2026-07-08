import { test, expect } from './fixtures';
import { ACCOUNTS, login, logout } from './helpers/auth';

test.describe('Authentification', () => {
  test('redirige vers /login si accès au dashboard sans session', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL('/login');
  });

  test('connexion et déconnexion pour chaque rôle', async ({ page }) => {
    for (const account of [ACCOUNTS.marie, ACCOUNTS.maire, ACCOUNTS.lea]) {
      await login(page, account);
      await expect(page.getByText(/Rôles :/)).toBeVisible();
      await logout(page);
    }
  });

  test('affiche une erreur avec des identifiants invalides', async ({ page }) => {
    await page.goto('/login');
    await page.locator('input[type="email"]').fill('inconnu@wall4art.local');
    await page.locator('input[type="password"]').fill('mauvais');
    await page.getByRole('button', { name: 'Se connecter' }).click();
    await expect(page).toHaveURL('/login');
    await expect(page.locator('.text-red-600')).toBeVisible();
  });
});
