import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  buildAnalyticsConfig,
  buildAnalyticsEvent,
  COINMIRROR_GA_MEASUREMENT_ID,
  getGoogleTagScriptSrc,
  installGoogleTag,
  resolveAnalyticsMeasurementId,
  sanitizeAnalyticsPayload,
  trackAnalyticsEvent,
  trackCoinmirrorEvent,
} from '../src/lib/analytics.ts';

test('analytics config는 measurement id가 없거나 production web이 아니면 비활성화된다', () => {
  assert.equal(
    buildAnalyticsConfig({ measurementId: '', isProduction: true, platform: 'web' }).enabled,
    false
  );
  assert.equal(
    buildAnalyticsConfig({ measurementId: 'G-TEST1234', isProduction: false, platform: 'web' })
      .enabled,
    false
  );
  assert.equal(
    buildAnalyticsConfig({ measurementId: 'G-TEST1234', isProduction: true, platform: 'ios' })
      .enabled,
    false
  );
  assert.deepEqual(
    buildAnalyticsConfig({ measurementId: 'G-TEST1234', isProduction: true, platform: 'web' }),
    {
      enabled: true,
      measurementId: 'G-TEST1234',
    }
  );
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

  assert.equal(COINMIRROR_GA_MEASUREMENT_ID, 'G-RW7FRXJVER');
  assert.equal(resolveAnalyticsMeasurementId(), 'G-RW7FRXJVER');
  assert.equal(resolveAnalyticsMeasurementId(' G-OVERRIDE123 '), 'G-OVERRIDE123');
  assert.match(source, /buildAnalyticsConfig/);
  assert.match(source, /installGoogleTag/);
  assert.match(source, /resolveAnalyticsMeasurementId/);
  assert.match(source, /EXPO_PUBLIC_GA_MEASUREMENT_ID/);
  assert.match(source, /Platform\.OS/);
});

test('app.config는 GA4 Measurement ID 기본값을 Expo extra에 주입한다', async () => {
  const source = await readFile('app.config.ts', 'utf8');

  assert.match(source, /G-RW7FRXJVER/);
  assert.match(source, /gaMeasurementId/);
  assert.match(source, /EXPO_PUBLIC_GA_MEASUREMENT_ID/);
});

test('Root HTML은 Google tag를 초기 head에서 로드해 GA 설치 감지를 안정화한다', async () => {
  const source = await readFile('src/app/+html.tsx', 'utf8');

  assert.match(source, /getGoogleTagScriptSrc/);
  assert.match(source, /<script async src=\{googleTagScriptSrc\}>/);
  assert.match(source, /G-RW7FRXJVER/);
  assert.match(source, /window\.dataLayer/);
  assert.match(source, /gtag\('config', 'G-RW7FRXJVER'/);
  assert.match(source, /page_location/);
  assert.match(source, /page_path/);
  assert.match(source, /search = ''/);
  assert.match(source, /hash = ''/);
});

test('Google tag bootstrap은 쿼리·해시 없이 page 정보를 설정한다', () => {
  const calls: unknown[][] = [];
  const createdScripts: Array<{ async?: boolean; src?: string }> = [];
  const doc = {
    createElement: () => {
      const script = {};
      createdScripts.push(script);
      return script;
    },
    head: { appendChild: () => undefined },
    location: {
      origin: 'https://coinmirror.example',
      pathname: '/?not-used',
      href: 'https://coinmirror.example/?source=reanalysis-email&r=SECRET#frag',
    },
    referrer: 'https://mail.example/message?r=SECRET',
  };

  installGoogleTag({ enabled: true, measurementId: 'G-RW7FRXJVER' }, doc, (...args) =>
    calls.push(args)
  );

  assert.equal(createdScripts[0]?.src, getGoogleTagScriptSrc('G-RW7FRXJVER'));
  assert.deepEqual(calls[1], [
    'config',
    'G-RW7FRXJVER',
    {
      send_page_view: true,
      page_path: '/',
      page_location: 'https://coinmirror.example/',
      page_referrer: 'https://mail.example/message',
    },
  ]);
});

test('Google tag bootstrap은 Root HTML에서 이미 실행된 경우 중복 page_view를 만들지 않는다', () => {
  const createdScripts: Array<{ async?: boolean; src?: string }> = [];
  const calls: unknown[][] = [];
  const previous = (globalThis as { __coinmirrorGaBootstrapped?: boolean })
    .__coinmirrorGaBootstrapped;
  (globalThis as { __coinmirrorGaBootstrapped?: boolean }).__coinmirrorGaBootstrapped = true;

  try {
    installGoogleTag(
      { enabled: true, measurementId: 'G-RW7FRXJVER' },
      {
        createElement: () => {
          const script = {};
          createdScripts.push(script);
          return script;
        },
        head: { appendChild: () => undefined },
      },
      (...args) => calls.push(args)
    );
  } finally {
    (globalThis as { __coinmirrorGaBootstrapped?: boolean }).__coinmirrorGaBootstrapped = previous;
  }

  assert.deepEqual(createdScripts, []);
  assert.deepEqual(calls, []);
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

test('공통 피드백 CTA는 외부 폼 URL과 익명 피드백 이벤트만 연결한다', async () => {
  const source = await readFile('src/components/feedback-cta.tsx', 'utf8');
  const appConfigSource = await readFile('app.config.ts', 'utf8');

  assert.match(source, /Constants\.expoConfig\?\.extra/);
  assert.match(source, /EXPO_PUBLIC_FEEDBACK_FORM_URL/);
  assert.match(appConfigSource, /feedbackFormUrl/);
  assert.match(appConfigSource, /EXPO_PUBLIC_FEEDBACK_FORM_URL/);
  assert.match(source, /feedback_click/);
  assert.match(source, /Linking\.openURL/);
  assert.match(source, /30초 피드백 남기기/);
  assert.match(source, /자유롭게 의견을 적어주세요/);
  assert.match(source, /종목, 금액, 수량, 수익률, 원본 파일명, PDF 비밀번호/);
  assert.doesNotMatch(source, /fileName|password:|rawTradeText|symbol:|amount:|quantity:/);
});

test('주 피드백 CTA는 핵심 결과 직후이자 상세 행동 점수 전에 노출하고 최하단에는 보조 링크만 둔다', async () => {
  const source = await readFile('src/components/steps/step-2-analysis.tsx', 'utf8');
  const comparisonIndex = source.indexOf('내 예상 vs 기록');
  const primaryFeedbackIndex = source.indexOf('코인미러, 어떻게 느껴졌나요?');
  const scoreIndex = source.indexOf('행동 점수');
  const footerFeedbackIndex = source.indexOf('의견을 더 남기고 싶으신가요?');
  const symbolChartIndex = source.indexOf('종목별 매수 비중 상위');

  assert.ok(comparisonIndex < primaryFeedbackIndex);
  assert.ok(primaryFeedbackIndex < scoreIndex);
  assert.ok(symbolChartIndex < footerFeedbackIndex);
});

test('목표 진행 탭은 4주 관찰 CTA 바로 아래 피드백 CTA를 둔다', async () => {
  const source = await readFile('src/components/steps/step-3-goals.tsx', 'utf8');
  const observeIndex = source.indexOf('이 원칙으로 4주 관찰하기');
  const feedbackIndex = source.indexOf('screen="goals"');
  const noticeIndex = source.indexOf('{notice &&');

  assert.ok(observeIndex >= 0);
  assert.ok(feedbackIndex > observeIndex);
  assert.ok(noticeIndex > feedbackIndex);
});

test('정보 이벤트 탭은 시장 배경과 거래소 이벤트 콘텐츠보다 먼저 피드백 CTA를 노출한다', async () => {
  const source = await readFile('src/components/steps/step-4-info.tsx', 'utf8');
  const feedbackIndex = source.indexOf('screen="info"');
  const marketIndex = source.indexOf('viewModel.marketTemperature.title');
  const exchangeIndex = source.indexOf('viewModel.exchangeEvents.title');

  assert.ok(feedbackIndex >= 0);
  assert.ok(feedbackIndex < marketIndex);
  assert.ok(feedbackIndex < exchangeIndex);
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
