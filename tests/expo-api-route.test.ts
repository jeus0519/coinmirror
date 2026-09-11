import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';

const PROJECT_ROOT = path.resolve(__dirname, '..');

test('Deployment Contract: app.json web.output must be server', () => {
  const appJsonPath = path.join(PROJECT_ROOT, 'app.json');
  const content = fs.readFileSync(appJsonPath, 'utf8');
  const appJson = JSON.parse(content);
  assert.equal(appJson?.expo?.web?.output, 'server', 'app.json web.output must be set to "server"');
});

test('Deployment Contract: src/app/api/ai-reflection+api.ts must exist and re-export POST handler', async () => {
  const apiRoutePath = path.join(PROJECT_ROOT, 'src/app/api/ai-reflection+api.ts');
  assert.ok(fs.existsSync(apiRoutePath), 'src/app/api/ai-reflection+api.ts must exist');

  // Verify that it actually exports POST and it matches the one from api/ai-reflection
  const actualRoute = await import('../src/app/api/ai-reflection+api.ts');
  const expectedRoute = await import('../api/ai-reflection.ts');

  assert.ok(actualRoute.POST, 'src/app/api/ai-reflection+api.ts must export a POST handler');
  assert.equal(actualRoute.POST, expectedRoute.POST, 'src/app/api/ai-reflection+api.ts must re-export POST from api/ai-reflection.ts');
});

test('Deployment Contract: Vercel adapter routes Expo server output without exposing AI secrets', () => {
  const vercelConfigPath = path.join(PROJECT_ROOT, 'vercel.json');
  assert.ok(fs.existsSync(vercelConfigPath), 'vercel.json must exist for Vercel deployment');

  const vercelConfig = JSON.parse(fs.readFileSync(vercelConfigPath, 'utf8'));
  assert.equal(vercelConfig.buildCommand, 'npx expo export -p web');
  assert.equal(vercelConfig.outputDirectory, 'dist/client');
  assert.equal(vercelConfig.functions?.['api/index.ts']?.runtime, '@vercel/node@5.1.8');
  assert.equal(vercelConfig.functions?.['api/index.ts']?.includeFiles, 'dist/server/**');
  assert.deepEqual(vercelConfig.rewrites, [
    {
      source: '/(.*)',
      destination: '/api/index',
    },
  ]);

  const adapterPath = path.join(PROJECT_ROOT, 'api/index.ts');
  assert.ok(fs.existsSync(adapterPath), 'api/index.ts must exist as the Vercel Expo server adapter entry');
  const adapterSource = fs.readFileSync(adapterPath, 'utf8');
  assert.match(adapterSource, /expo-server\/adapter\/vercel/);
  assert.match(adapterSource, /dist\/server|dist\\server/);
  assert.doesNotMatch(adapterSource, /COINMIRROR_AI_REFLECTION_OPENAI_API_KEY/);
  assert.doesNotMatch(adapterSource, /EXPO_PUBLIC_/);
});

test('Deployment Contract: no AI key in EXPO_PUBLIC variables', () => {
  // Check process.env keys
  const unsafeEnvKeys = Object.keys(process.env).filter(key => {
    if (!key.startsWith('EXPO_PUBLIC_')) return false;
    const cleanKey = key.toUpperCase();
    return (
      cleanKey.includes('OPENAI') ||
      cleanKey.includes('GEMINI') ||
      cleanKey.includes('CLAUDE') ||
      cleanKey.includes('SECRET') ||
      cleanKey.includes('TOKEN') ||
      (cleanKey.includes('AI') && !cleanKey.includes('WAITLIST')) ||
      cleanKey.includes('KEY')
    );
  });
  assert.deepEqual(unsafeEnvKeys, [], `Found unsafe EXPO_PUBLIC env variables in process.env: ${unsafeEnvKeys.join(', ')}`);

  // Also check .env file if it exists, or .env.example
  const checkFileEnv = (filename: string) => {
    const envPath = path.join(PROJECT_ROOT, filename);
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      const lines = content.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const [key] = trimmed.split('=');
          const cleanKey = key.trim().toUpperCase();
          if (cleanKey.startsWith('EXPO_PUBLIC_')) {
            const isUnsafe = (
              cleanKey.includes('OPENAI') ||
              cleanKey.includes('GEMINI') ||
              cleanKey.includes('CLAUDE') ||
              cleanKey.includes('SECRET') ||
              cleanKey.includes('TOKEN') ||
              (cleanKey.includes('AI') && !cleanKey.includes('WAITLIST')) ||
              cleanKey.includes('KEY')
            );
            if (isUnsafe) {
              assert.fail(`Found unsafe EXPO_PUBLIC env variable ${key.trim()} in ${filename}`);
            }
          }
        }
      }
    }
  };

  checkFileEnv('.env');
  checkFileEnv('.env.example');
});
