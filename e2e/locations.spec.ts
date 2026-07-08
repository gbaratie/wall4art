import path from 'node:path';
import { test, expect } from './fixtures';
import { ACCOUNTS, fillField, login } from './helpers/auth';

test.describe('Création de lieu (particulier)', () => {
  test('crée un lieu privé avec photo', async ({ page }) => {
    await login(page, ACCOUNTS.pierre);
    await page.goto('/locations/new');
    await expect(page.getByRole('heading', { name: 'Proposer un lieu à décorer' })).toBeVisible();

    const title = `Mur test E2E ${Date.now()}`;
    await fillField(page, 'Titre', title);
    await fillField(page, 'Description du lieu', 'Un mur en brique exposé au sud, idéal pour une fresque.');
    await fillField(page, 'Ce qui est attendu', 'Une œuvre colorée et durable.');
    await fillField(page, 'Adresse', '12 rue des Tests');
    await fillField(page, 'Ville', 'Lyon');
    await fillField(page, 'Code postal', '69001');

    const fixturePath = path.join(__dirname, 'fixtures/test-wall.png');
    await page.locator('input[type="file"]').setInputFiles(fixturePath);

    await page.getByRole('button', { name: 'Publier le lieu' }).click();
    await expect(page.getByRole('heading', { name: title })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('OPEN')).toBeVisible();
    await expect(page.getByText('PRIVATE')).toBeVisible();
  });
});
