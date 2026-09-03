import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

const PAGE = 'src/app/subscription.tsx';

test('구독 혜택 페이지는 1~3번 핵심 혜택을 명확히 설명한다', async () => {
  const source = await readFile(PAGE, 'utf8');

  assert.match(source, /기준선 저장/);
  assert.match(source, /월간 투자습관 리포트/);
  assert.match(source, /목표 저장/);
  assert.match(source, /다음 업로드 때 변화량 자동 비교/);
  assert.match(source, /투자 조언이 아니라/);
});

test('구독 혜택 페이지는 분석 결과로 돌아가는 선택지를 최하단에 제공한다', async () => {
  const source = await readFile(PAGE, 'utf8');

  assert.match(source, /내 분석 결과로 돌아가기/);
  assert.match(source, /router\.back\(\)/);
});

test('구독 혜택 페이지는 결제 대신 구독관리 출시 알림으로 연결한다', async () => {
  const source = await readFile(PAGE, 'utf8');

  assert.match(source, /구독관리 출시 알림 받기/);
  assert.match(source, /월간 리포트가 준비되면 알려드릴게요/);
  assert.match(source, /router\.push\('\/subscription-checkout'\)/);
  assert.doesNotMatch(source, /구독 신청하기/);
  assert.doesNotMatch(source, /결제 전환/);
});

test('구독 알림 페이지는 무료 오픈 이후 선택형 대기등록 상태를 보여준다', async () => {
  const source = await readFile('src/app/subscription-checkout.tsx', 'utf8');

  assert.match(source, /구독관리 출시 알림/);
  assert.match(source, /핵심 진단은 무료로 먼저 사용/);
  assert.match(source, /이메일은 출시 알림과 월간 리포트 안내에만 사용/);
  assert.match(source, /실제 결제나 과금은 발생하지 않습니다/);
  assert.match(source, /router\.back\(\)/);
  assert.doesNotMatch(source, /월 4,900원/);
  assert.doesNotMatch(source, /결제 모듈/);
  assert.doesNotMatch(source, /토스페이먼츠|PortOne|Stripe/);
});

test('구독 혜택 페이지는 무료와 구독관리 차이를 카드형 비교표로 보여준다', async () => {
  const source = await readFile(PAGE, 'utf8');

  assert.match(source, /COMPARE_ROWS/);
  assert.match(source, /무료 vs 구독관리/);
  assert.match(source, /이번 업로드 분석/);
  assert.match(source, /기준선 저장/);
  assert.match(source, /분석 요약만 저장/);
  assert.match(source, /COMPARE_ROWS\.map/);
});

test('구독 혜택 페이지는 이미지 대신 혜택별 미니 프리뷰를 제공한다', async () => {
  const source = await readFile(PAGE, 'utf8');

  assert.match(source, /previewTitle/);
  assert.match(source, /PreviewMock/);
  assert.match(source, /이번 분석/);
  assert.match(source, /다음 업로드/);
  assert.match(source, /월간 요약/);
  assert.match(source, /목표 후보/);
  assert.doesNotMatch(source, /<Image/);
});

test('구독 혜택 페이지는 월간 리포트의 실제 미리보기 구조를 보여준다', async () => {
  const source = await readFile(PAGE, 'utf8');

  assert.match(source, /이번 달 저장한 분석/);
  assert.match(source, /신규 반영 체결/);
  assert.match(source, /중복 제외/);
  assert.match(source, /원가 연결 보정/);
  assert.match(source, /목표 회고/);
  assert.match(source, /원본 PDF와 비밀번호/);
});

test('구독 혜택 페이지의 분석 결과 복귀 버튼은 최하단 보조 액션으로 분리한다', async () => {
  const source = await readFile(PAGE, 'utf8');
  const alertIndex = source.indexOf('구독관리 출시 알림 받기');
  const returnIndex = source.lastIndexOf('내 분석 결과로 돌아가기');

  assert.ok(alertIndex > -1);
  assert.ok(returnIndex > alertIndex);
  assert.match(source, /하단 보조 액션/);
});
