import { createAuthClient } from 'better-auth/react';
import { apiPath } from './api';

export const authClient = createAuthClient({
  baseURL: apiPath(''),
});
