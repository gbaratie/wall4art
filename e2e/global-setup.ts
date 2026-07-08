import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';

function loadEnvFile(filePath: string): Record<string, string> {
  const vars: Record<string, string> = {};
  const content = readFileSync(filePath, 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    vars[trimmed.slice(0, eq)] = trimmed.slice(eq + 1);
  }
  return vars;
}

export default async function globalSetup() {
  const root = path.resolve(__dirname, '..');
  const envVars = loadEnvFile(path.join(root, '.env'));

  const run = (cmd: string) =>
    execSync(cmd, {
      cwd: root,
      env: { ...process.env, ...envVars },
      stdio: 'inherit',
    });

  run('pnpm --filter @wall4art/shared build');
  run('pnpm db:migrate:deploy');
  run('pnpm db:seed');
  run('pnpm --filter @wall4art/api exec tsx prisma/reset-demo.ts');
}
