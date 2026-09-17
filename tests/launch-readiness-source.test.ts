import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

async function read(path: string) {
  return readFile(path, 'utf8');
}

test('앱 부팅 시 저장된 요약을 복원하고 데모 쿼리는 소비 후 제거한다', async () => {
  const source = await read('src/app/index.tsx');
  assert.match(source, /restoreSubscriptionState/);
  assert.match(source, /router\.replace\('\/'\)/);
  const effectStart = source.indexOf('useEffect(() => {');
  const effectBody = source.slice(effectStart);
  assert.ok(effectBody.indexOf("params.demo === 'duplicate-upload'") < effectBody.indexOf('restoreSubscriptionState()'));
  assert.match(source, /hasBootstrappedRef/);
});

test('AI reflection 서버 키 이름은 런북과 같은 OPENAI_API_KEY 이름만 사용한다', async () => {
  const api = await read('api/ai-reflection.ts');
  const envExample = await read('.env.example');
  assert.match(envExample, /COINMIRROR_AI_REFLECTION_OPENAI_API_KEY/);
  assert.match(api, /COINMIRROR_AI_REFLECTION_OPENAI_API_KEY/);
  assert.doesNotMatch(api, /COINMIRROR_AI_REFLECTION_API_KEY(?!_)/);
});


test('분석 엔진은 A4 미응답을 기본 50으로 강제하지 않고 본전권/F8 정책을 코드에 명시한다', async () => {
  const buildAnalysis = await read('src/lib/trade-history/build-analysis.ts');
  const scores = await read('src/lib/score-engine/scores.ts');
  assert.doesNotMatch(buildAnalysis, /return 50;/);
  assert.match(scores, /BREAKEVEN_PNL_PCT/);
  assert.match(scores, /if \(!options\.maxSingleAssetWeightPct\)/);
  assert.doesNotMatch(scores, /singleHoldingDayPenalty/);
});
