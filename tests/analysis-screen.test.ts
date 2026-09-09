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

  assert.match(source, /이 숫자, 다음 달에는 달라졌을까요/);
  assert.match(source, /다음 달 재분석 알림 받기/);
  assert.match(source, /구독관리 혜택 보기/);
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
  assert.match(source, /다음 달에 다시 볼 질문 후보/);
  assert.match(source, /trackingGoal/);
});

test('분석 화면은 기준선 저장과 직전 분석 비교 UI를 제공한다', async () => {
  const source = await readFile(STEP_2, 'utf8');

  assert.match(source, /saveCurrentAnalysisSnapshot/);
  assert.match(source, /snapshotComparison/);
  assert.match(source, /이번 결과 저장하기/);
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
  assert.match(source, /저장한 결과 불러오기/);
  assert.match(source, /브라우저 저장 요약 삭제하기/);
  assert.match(source, /브라우저에 저장된 요약 데이터/);
});

test('분석 화면의 삭제 CTA는 원본 파일 삭제가 아니라 브라우저 저장 요약 삭제로 안내한다', async () => {
  const source = await readFile(STEP_2, 'utf8');

  assert.match(source, /브라우저에 저장된 요약 데이터/);
  assert.match(source, /원본 PDF\/CSV 파일을 삭제하는 기능이 아니라/);
  assert.match(source, /브라우저 저장 요약 삭제하기/);
  assert.match(source, /기준선, 목표, 월간 리포트 미리보기 근거/);
  assert.doesNotMatch(source, /원본 파일 삭제하기/);
});

test('분석 화면은 기준선 저장 단계별로 CTA와 설명을 다르게 보여준다', async () => {
  const source = await readFile(STEP_2, 'utf8');

  assert.match(source, /snapshotStatusTitle/);
  assert.match(source, /첫 비교 준비가 아직 없어요/);
  assert.match(source, /이번 결과 저장됨/);
  assert.match(source, /직전 분석과 비교 중/);
  assert.match(source, /이번 결과 다시 저장하기/);
  assert.match(source, /다음 거래내역을 올릴 때 변화량을 비교해요/);
  assert.match(source, /목표 저장 완료/);
});

test('분석 화면은 중복 체결 자동 제외 결과를 비교 카드에 표시한다', async () => {
  const source = await readFile(STEP_2, 'utf8');

  assert.match(source, /snapshotComparison\.dedupe/);
  assert.match(source, /겹치는 거래 처리/);
  assert.match(source, /duplicateExecutionCount > 0/);
  assert.match(source, /새 거래만 비교/);
  assert.match(source, /이번 매도 계산에만 참고/);
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


test('분석 화면은 로컬 스냅샷 기반 비교 한계를 재분석 알림 근처에서 안내한다', async () => {
  const source = await readFile(STEP_2, 'utf8');

  assert.match(source, /처음 분석했던 브라우저에서 다시 열면 비교가 이어집니다/);
  assert.match(source, /다른 기기에서는 새 분석으로 시작될 수 있어요/);
});


test('분석 화면은 거래 개요 직후 AI 행동코칭을 먼저 보여주고 그 뒤에 예상 비교와 행동 점수를 이어간다', async () => {
  const source = await readFile(STEP_2, 'utf8');

  assert.match(source, /buildAiBehaviorCoaching/);
  assert.match(source, /거래 개요/);
  assert.match(source, /AI 행동코칭/);
  assert.match(source, /내 예상 vs 기록/);
  assert.match(source, /행동 점수/);
  assert.doesNotMatch(source, /무료 행동 점수/);
  assert.ok(source.indexOf('거래 개요') < source.indexOf('AI 행동코칭'));
  assert.ok(source.indexOf('AI 행동코칭') < source.indexOf('내 예상 vs 기록'));
  assert.ok(source.indexOf('내 예상 vs 기록') < source.indexOf('행동 점수'));
  assert.ok(source.indexOf('행동 점수') < source.indexOf('투자거울 타입'));
  assert.ok(source.indexOf('투자거울 타입') < source.indexOf('이번 분석에서 눈에 띄는 패턴'));
  assert.match(source, /이번 기록을 바탕으로 정리한 AI 회고/);
  assert.match(source, /줄여볼 행동/);
  assert.match(source, /유지할 행동/);
  assert.match(source, /다음 달 확인 질문/);
  assert.match(source, /원본 거래내역과 PDF 비밀번호는 AI로 보내지 않아요/);
});

test('분석 화면은 AI 행동코칭을 자동 노출하지 않고 버튼으로 받게 안내한다', async () => {
  const source = await readFile(STEP_2, 'utf8');

  assert.match(source, /showAiBehaviorCoaching/);
  assert.match(source, /setShowAiBehaviorCoaching/);
  assert.match(source, /AI 행동코칭 받기/);
  assert.match(source, /버튼을 누르면/);
  assert.match(source, /ai_coaching_request_click/);
  assert.match(source, /showAiBehaviorCoaching \? \(/);
});

test('AI 행동코칭 받기 버튼은 safe payload로 api를 호출하고 실패하면 rule 코칭을 보여준다', async () => {
  const source = await readFile(STEP_2, 'utf8');

  assert.match(source, /buildAiBehaviorCoachingSafePayload/);
  assert.match(source, /aiBehaviorCoachingPayload/);
  assert.match(source, /requestAiReflection/);
  assert.doesNotMatch(source, /fetch\('\/api\/ai-reflection'/);
  assert.match(source, /aiReflectionOutput/);
  assert.match(source, /setAiReflectionNotice/);
  assert.match(source, /기본 행동코칭을 먼저 보여드릴게요/);
});
