import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

import { buildTradeAnalysisViewData } from '../src/lib/analysis-view-data.ts';
import { analyzeCsvInput } from '../src/lib/csv/analyze-csv.ts';

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

test('실제 분석 상단 거래 개요는 승률과 수익·손실 보유시간을 먼저 보여준다', async () => {
  const csv = [
    '마켓,구분,체결시간,체결가,수량,수수료',
    'KRW-BTC,매수,2026-01-01 09:00:00,100,1,0',
    'KRW-BTC,매도,2026-01-01 21:00:00,120,1,0',
    'KRW-ETH,매수,2026-01-01 09:00:00,100,1,0',
    'KRW-ETH,매도,2026-01-04 09:00:00,80,1,0',
    'KRW-XRP,매수,2026-01-02 09:00:00,100,1,0',
    'KRW-XRP,매도,2026-01-02 21:00:00,130,1,0',
  ].join('\n');
  const tradeAnalysis = analyzeCsvInput(csv, {});
  const view = buildTradeAnalysisViewData(tradeAnalysis, {});

  assert.deepEqual(
    view.statTiles.slice(0, 3).map((tile) => tile.label),
    ['청산 승률', '수익 보유기간', '손실 보유기간']
  );
  assert.match(view.statTiles[0].value, /%/);
});
