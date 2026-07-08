import { test as base } from '@playwright/test';

export const test = base.extend({
  context: async ({ context }, use) => {
    await context.clearCookies();
    await use(context);
  },
});

export { expect } from '@playwright/test';
