import { test, expect } from './fixtures';
import { ACCOUNTS, login } from './helpers/auth';

test.describe('Messagerie', () => {
  test('affiche la conversation seedée et permet d’envoyer un message', async ({ page }) => {
    await login(page, ACCOUNTS.marie);
    await page.goto('/messages');
    await expect(page.getByRole('heading', { name: 'Conversations' })).toBeVisible();
    await expect(page.getByText('Mur de cour intérieure')).toBeVisible();

    await page.getByRole('button', { name: /Mur de cour intérieure/ }).click();
    await expect(page.getByRole('paragraph').filter({ hasText: 'Léa Artiste Paris' })).toBeVisible();

    const testMessage = `Message E2E ${Date.now()}`;
    await page.getByPlaceholder('Votre message...').fill(testMessage);
    await page.getByRole('button', { name: 'Envoyer' }).click();
    await expect(page.getByText(testMessage)).toBeVisible({ timeout: 10_000 });
  });

  test('l’artiste voit la même conversation', async ({ page }) => {
    await login(page, ACCOUNTS.lea);
    await page.goto('/messages');
    await page.getByRole('button', { name: /Mur de cour intérieure/ }).click();
    await expect(page.getByRole('paragraph').filter({ hasText: 'Marie Dupont' })).toBeVisible();
  });
});
