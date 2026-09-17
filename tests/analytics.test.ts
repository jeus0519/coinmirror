import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  buildAnalyticsConfig,
  buildAnalyticsEvent,
  getGoogleTagScriptSrc,
  installGoogleTag,
  sanitizeAnalyticsPayload,
  trackAnalyticsEvent,
  trackCoinmirrorEvent,
} from '../src/lib/analytics.ts';

test('analytics config는 measurement id가 없거나 production web이 아니면 비활성화된다', () => {
  assert.equal(buildAnalyticsConfig({ measurementId: '', isProduction: true, platform: 'web' }).enabled, false);
  assert.equal(buildAnalyticsConfig({ measurementId: 'G-TEST1234', isProduction: false, platform: 'web' }).enabled, false);
  assert.equal(buildAnalyticsConfig({ measurementId: 'G-TEST1234', isProduction: true, platform: 'ios' }).enabled, false);
  assert.deepEqual(buildAnalyticsConfig({ measurementId: 'G-TEST1234', isProduction: true, platform: 'web' }), {
    enabled: true,
    measurementId: 'G-TEST1234',
  });
});

test('analytics payload는 원본 파일명·비밀번호·이메일·거래 원문·금액성 키를 제거한다', () => {
  const sanitized = sanitizeAnalyticsPayload({
    screen: 'upload',
    source_format: 'pdf',
    failure_code: 'NO_TEXT_LAYER',
    fileName: 'real-upbit-history.pdf',
    password: '123456',
    email: 'user@example.com',
    rawTradeText: 'KRW-BTC 매수 1000000',
    symbol: 'BTC',
    amount: 1000000,
    quantity: 0.5,
    accountId: 'acct-1',
    orderUuid: 'order-1',
  });

  assert.deepEqual(sanitized, {
    screen: 'upload',
    source_format: 'pdf',
    failure_code: 'NO_TEXT_LAYER',
  });
});

test('analytics event는 허용된 이벤트명과 안전한 payload만 만든다', () => {
  const event = buildAnalyticsEvent('parse_failed', {
    screen: 'upload',
    source_format: 'csv',
    failure_code: 'MISSING_REQUIRED_COLUMN',
    filename: 'do-not-send.csv',
  });

  assert.deepEqual(event, {
    name: 'parse_failed',
    params: {
      screen: 'upload',
      source_format: 'csv',
      failure_code: 'MISSING_REQUIRED_COLUMN',
    },
  });
});

test('RootLayout은 Expo Web에서 Google tag bootstrap을 한 번 연결한다', async () => {
  const source = await readFile('src/app/_layout.tsx', 'utf8');

  assert.match(source, /buildAnalyticsConfig/);
  assert.match(source, /installGoogleTag/);
  assert.match(source, /EXPO_PUBLIC_GA_MEASUREMENT_ID/);
  assert.match(source, /Platform\.OS/);
});

test('무료 공개 MVP 핵심 화면은 GA4 익명 퍼널 이벤트를 연결한다', async () => {
  const startSource = await readFile('src/components/steps/step-1-start.tsx', 'utf8');
  const uploadSource = await readFile('src/components/steps/step-3-data-import.tsx', 'utf8');
  const analysisSource = await readFile('src/components/steps/step-2-analysis.tsx', 'utf8');
  const subscriptionSource = await readFile('src/app/subscription.tsx', 'utf8');
  const waitlistSource = await readFile('src/app/subscription-checkout.tsx', 'utf8');

  assert.match(startSource, /trackCoinmirrorEvent\('start_click'/);
  assert.match(uploadSource, /trackCoinmirrorEvent\('upload_attempt'/);
  assert.match(uploadSource, /trackCoinmirrorEvent\('parse_success'/);
  assert.match(uploadSource, /trackCoinmirrorEvent\('parse_failed'/);
  assert.match(analysisSource, /trackCoinmirrorEvent\('result_view'/);
  assert.match(analysisSource, /trackCoinmirrorEvent\('reanalysis_reminder_click'/);
  assert.match(analysisSource, /trackCoinmirrorEvent\('subscription_preview_click'/);
  assert.match(analysisSource, /trackCoinmirrorEvent\('ai_coaching_request_click'/);
  assert.match(analysisSource, /trackCoinmirrorEvent\('delete_local_data_click'/);
  assert.match(subscriptionSource, /trackCoinmirrorEvent\('subscription_preview_click'/);
  assert.match(waitlistSource, /trackCoinmirrorEvent\('reanalysis_reminder_click'/);
  assert.match(waitlistSource, /trackCoinmirrorEvent\('subscription_interest_click'/);
});

test('다음 달 재분석 알림 CTA는 외부 폼 URL 환경변수로 실제 연결할 수 있다', async () => {
  const waitlistSource = await readFile('src/app/subscription-checkout.tsx', 'utf8');

  assert.match(waitlistSource, /EXPO_PUBLIC_WAITLIST_FORM_URL/);
  assert.match(waitlistSource, /Linking\.openURL/);
  assert.match(waitlistSource, /setSubmissionNotice/);
});

test('첫 화면 CTA는 MVP 용어 없이 무료 분석과 브라우저 파일 처리를 바로 말한다', async () => {
  const source = await readFile('src/components/steps/step-1-start.tsx', 'utf8');

  assert.match(source, /무료로 내 거래 습관 보기/);
  assert.match(source, /PDF\/CSV 바로 올리기/);
  assert.match(source, /파일은 내 브라우저에서만/);
  assert.match(source, /서버에 저장하지 않아요/);
  assert.match(source, /현재는 업비트 PDF\/CSV를 먼저 지원해요/);
  assert.match(source, /빗썸·다른 거래소·주식 거래내역도 차례로 넓혀갈 예정/);
  assert.doesNotMatch(source, /무료 공개 MVP/);
});

test('분석 결과 화면은 외부 피드백 폼 URL 환경변수로 피드백을 연결할 수 있다', async () => {
  const source = await readFile('src/components/steps/step-2-analysis.tsx', 'utf8');

  assert.match(source, /EXPO_PUBLIC_FEEDBACK_FORM_URL/);
  assert.match(source, /feedback_click/);
  assert.match(source, /Linking\.openURL/);
  assert.match(source, /피드백 남기기/);
});


test('analytics는 재분석 귀환과 2회차 비교 이벤트를 지원하고 민감 토큰 원문은 제거한다', () => {
  const returnEvent = buildAnalyticsEvent('reanalysis_return', {
    screen: 'landing',
    return_source: 'email',
    has_return_token: true,
    token: 'abc123',
    r: 'abc123',
  });
  assert.deepEqual(returnEvent, {
    name: 'reanalysis_return',
    params: { screen: 'landing', return_source: 'email', has_return_token: true },
  });

  const comparisonEvent = buildAnalyticsEvent('comparison_result_view', {
    screen: 'analysis',
    has_local_snapshot: true,
    has_duplicate_executions: true,
    has_unique_executions: true,
    duplicateExecutionCount: 322,
  });
  assert.deepEqual(comparisonEvent, {
    name: 'comparison_result_view',
    params: {
      screen: 'analysis',
      has_local_snapshot: true,
      has_duplicate_executions: true,
      has_unique_executions: true,
    },
  });
});

test('앱 루트는 재분석 이메일 링크 귀환을 익명 이벤트로 계측한다', async () => {
  const source = await readFile('src/app/index.tsx', 'utf8');

  assert.match(source, /params\.source === 'reanalysis-email'/);
  assert.match(source, /trackCoinmirrorEvent\('reanalysis_return'/);
  assert.match(source, /has_return_token/);
  assert.doesNotMatch(source, /r: params\.r/);
});
