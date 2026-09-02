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

test('무료 분석 화면은 구독 혜택 페이지로 이어지는 자연스러운 배너를 제공한다', async () => {
  const source = await readFile(STEP_2, 'utf8');

  assert.match(source, /이번 분석을 기준선으로 저장할까요/);
  assert.match(source, /내 패턴 변화 추적하기/);
  assert.match(source, /router\.push\('\/subscription'\)/);
  assert.match(source, /subscriptionTier === 'free'/);
});

test('실제 분석은 구독관리에서 추적할 개인화 핵심 패턴과 목표 후보를 만든다', async () => {
  const csv = [
    '마켓,구분,체결시간,체결가,수량,수수료',
    'KRW-BTC,매수,2026-01-01 09:00:00,100,1,0',
    'KRW-BTC,매도,2026-01-01 21:00:00,120,1,0',
    'KRW-ETH,매수,2026-01-01 09:00:00,100,1,0',
    'KRW-ETH,매도,2026-01-10 09:00:00,80,1,0',
    'KRW-XRP,매수,2026-01-02 09:00:00,100,1,0',
    'KRW-XRP,매도,2026-01-02 21:00:00,130,1,0',
  ].join('\n');
  const tradeAnalysis = analyzeCsvInput(csv, {});
  const view = buildTradeAnalysisViewData(tradeAnalysis, {});

  assert.ok(view.subscriptionInsights.length >= 1);
  assert.equal(view.subscriptionInsights[0].kind, 'holding-gap');
  assert.match(view.subscriptionInsights[0].title, /손실 거래를 더 오래/);
  assert.match(view.subscriptionInsights[0].evidence, /수익/);
  assert.match(view.subscriptionInsights[0].trackingGoal, /손실 보유기간/);
});

test('분석 화면은 개인화 핵심 패턴 카드와 구독관리 목표 추적 프리뷰를 보여준다', async () => {
  const source = await readFile(STEP_2, 'utf8');

  assert.match(source, /이번 분석에서 눈에 띄는 패턴/);
  assert.match(source, /subscriptionInsights\.map/);
  assert.match(source, /구독관리에서 추적할 목표 후보/);
  assert.match(source, /trackingGoal/);
});

test('분석 화면은 기준선 저장과 직전 분석 비교 UI를 제공한다', async () => {
  const source = await readFile(STEP_2, 'utf8');

  assert.match(source, /saveCurrentAnalysisSnapshot/);
  assert.match(source, /snapshotComparison/);
  assert.match(source, /이번 분석 저장하기/);
  assert.match(source, /직전 분석과 비교/);
  assert.match(source, /snapshotComparison\.rows\.map/);
  assert.match(source, /원본 PDF와 비밀번호는 저장하지 않아요/);
});

test('분석 화면은 구독 목표 후보 저장과 저장된 목표 상태를 보여준다', async () => {
  const source = await readFile(STEP_2, 'utf8');

  assert.match(source, /suggestedSubscriptionGoal/);
  assert.match(source, /savedSubscriptionGoals/);
  assert.match(source, /saveSuggestedSubscriptionGoal/);
  assert.match(source, /이 목표 저장하기/);
  assert.match(source, /저장한 목표/);
  assert.match(source, /evaluationCopy/);
});

test('분석 화면은 로컬 저장 복원과 내 데이터 삭제 액션을 제공한다', async () => {
  const source = await readFile(STEP_2, 'utf8');

  assert.match(source, /restoreSubscriptionState/);
  assert.match(source, /clearSubscriptionSnapshots/);
  assert.match(source, /저장한 기준선 불러오기/);
  assert.match(source, /저장한 기준선과 목표 삭제하기/);
  assert.match(source, /이 기기에 저장된 분석 요약과 목표만 삭제/);
});

test('분석 화면은 기준선 저장 단계별로 CTA와 설명을 다르게 보여준다', async () => {
  const source = await readFile(STEP_2, 'utf8');

  assert.match(source, /snapshotStatusTitle/);
  assert.match(source, /첫 기준선이 아직 없어요/);
  assert.match(source, /기준선 저장됨/);
  assert.match(source, /직전 분석과 비교 중/);
  assert.match(source, /이번 분석 다시 저장하기/);
  assert.match(source, /다음 업로드 때 자동 비교돼요/);
  assert.match(source, /목표 저장 완료/);
});

test('분석 화면은 중복 체결 자동 제외 결과를 비교 카드에 표시한다', async () => {
  const source = await readFile(STEP_2, 'utf8');

  assert.match(source, /snapshotComparison\.dedupe/);
  assert.match(source, /중복 체결 자동 처리/);
  assert.match(source, /duplicateExecutionCount > 0/);
  assert.match(source, /신규 체결만 비교/);
  assert.match(source, /원가 연결용/);
});

test('분석 화면은 월간 투자습관 리포트 미리보기 카드를 제공한다', async () => {
  const source = await readFile(STEP_2, 'utf8');

  assert.match(source, /buildMonthlyHabitReport/);
  assert.match(source, /월간 투자습관 리포트 미리보기/);
  assert.match(source, /이번 달 저장한 분석/);
  assert.match(source, /중복 제외/);
  assert.match(source, /원가 연결 보정/);
  assert.match(source, /목표 회고/);
  assert.match(source, /원본 PDF와 비밀번호는 저장하지 않아요/);
});
