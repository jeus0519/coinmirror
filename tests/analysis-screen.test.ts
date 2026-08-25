import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

const STEP_2 = 'src/components/steps/step-2-analysis.tsx';

test('분석 화면은 하드코딩 차트/실현 거래 상수를 직접 보유하지 않는다', async () => {
  const source = await readFile(STEP_2, 'utf8');

  assert.doesNotMatch(source, /const HOUR_BUCKETS/);
  assert.doesNotMatch(source, /const WEEKDAY_COUNTS/);
  assert.doesNotMatch(source, /const realizedTrades/);
  assert.doesNotMatch(source, /mockRecords/);
  assert.match(source, /derivedSeries/);
  assert.match(source, /hourlyBars/);
  assert.match(source, /symbolRows/);
});
