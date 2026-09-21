import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { buildInfoEventTabViewModel } from '../src/lib/info-event-tab.ts';

const STEP_4 = 'src/components/steps/step-4-info.tsx';
const MODEL = 'src/lib/info-event-tab.ts';

test('정보 이벤트 탭 view model은 시장 배경과 업비트 KRW 관심 분포를 회고용으로 구성한다', () => {
  const vm = buildInfoEventTabViewModel();

  assert.equal(vm.title, '시장 배경과 거래소 이벤트');
  assert.match(vm.description, /매수·매도 추천이 아니라/);
  assert.equal(vm.marketTemperature.metrics.length, 2);
  assert.match(vm.marketTemperature.metrics[0].label, /공포·탐욕/);
  assert.match(vm.upbitKrwInterest.title, /업비트 KRW 시장 관심 분포/);
  assert.ok(vm.upbitKrwInterest.assets.length >= 4);
  assert.ok(vm.upbitKrwInterest.assets.some((asset) => asset.symbol === 'USDT' && /대기|환전/.test(asset.note)));
  assert.match(vm.reflectionPrompts[0].title, /FOMO/);
  assert.match(vm.safetyCopy, /거래 습관을 돌아보기 위한 시장 배경/);
});

test('정보 이벤트 탭 view model은 업비트와 빗썸 이벤트를 각각 상단 3개로 제공한다', () => {
  const vm = buildInfoEventTabViewModel();

  assert.equal(vm.exchangeEvents.upbit.length, 3);
  assert.equal(vm.exchangeEvents.bithumb.length, 3);
  for (const item of [...vm.exchangeEvents.upbit, ...vm.exchangeEvents.bithumb]) {
    assert.ok(item.title.length > 8);
    assert.match(item.url, /^https:\/\//);
    assert.match(item.summary, /원문/);
  }
});

test('정보 이벤트 탭 copy는 추천·참여 유도 표현을 쓰지 않는다', async () => {
  const source = (await readFile(STEP_4, 'utf8')) + '\n' + (await readFile(MODEL, 'utf8'));

  assert.match(source, /시장 배경/);
  assert.match(source, /거래소 이벤트 참고/);
  assert.match(source, /코인미러는 이벤트 참여나 특정 거래를 권유하지 않아요/);
  for (const banned of ['참여 추천', '놓치면 손해', '지금 참여하세요', '수익 기회', '추천 코인', '매수 기회']) {
    assert.doesNotMatch(source, new RegExp(banned));
  }
});
