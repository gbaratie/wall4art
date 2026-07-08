import { type Locator, type Page, expect } from '@playwright/test';

export const ACCOUNTS = {
  maire: { email: 'maire@wall4art.local', password: 'password123', name: 'Mairesse de Paris' },
  marie: { email: 'marie@wall4art.local', password: 'password123', name: 'Marie Dupont' },
  pierre: { email: 'pierre@wall4art.local', password: 'password123', name: 'Pierre Martin' },
  lea: { email: 'lea@wall4art.local', password: 'password123', name: 'Léa Artiste Paris' },
  tom: { email: 'tom@wall4art.local', password: 'password123', name: 'Tom Artiste Lyon' },
} as const;

export const SEED_IDS = {
  privateLocation: '00000000-0000-4000-8000-000000000001',
  publicPendingLocation: '00000000-0000-4000-8000-000000000002',
  publicApprovedLocation: '00000000-0000-4000-8000-000000000003',
  proposal: '00000000-0000-4000-8000-000000000010',
} as const;

/** Remplit un champ React contrôlé identifié par son libellé. */
export async function fillField(root: Page | Locator, label: string, value: string) {
  const field = root
    .locator('label', { hasText: label })
    .first()
    .locator('xpath=following-sibling::*[self::input or self::textarea or self::select][1]');

  await field.click();
  await field.fill(value);
  await field.evaluate((element, nextValue) => {
    const prototype =
      element instanceof HTMLTextAreaElement
        ? window.HTMLTextAreaElement.prototype
        : window.HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
    setter?.call(element, nextValue);
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
  }, value);
}

export async function login(
  page: Page,
  account: (typeof ACCOUNTS)[keyof typeof ACCOUNTS],
) {
  await page.goto('/login');
  await page.getByRole('heading', { name: 'Connexion' }).waitFor();
  await page.locator('input[type="email"]').fill(account.email);
  await page.locator('input[type="password"]').fill(account.password);
  await page.getByRole('button', { name: 'Se connecter' }).click();
  await expect(page).toHaveURL('/dashboard', { timeout: 15_000 });
  await expect(page.getByRole('heading', { name: new RegExp(account.name) })).toBeVisible();
}

export async function logout(page: Page) {
  await page.getByRole('button', { name: 'Déconnexion' }).click();
  await expect(page.getByRole('link', { name: 'Connexion' })).toBeVisible();
}
