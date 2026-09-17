import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { analyzeUpbitPdfText, parseUpbitPdfText } from '../src/lib/pdf/adapters/upbit.ts';
import { hasTextLayer } from '../src/lib/pdf/extract-pdf-text.ts';

test('업비트 PDF 텍스트는 매수/매도 행만 RawExecution으로 변환한다', async () => {
  const text = await readFile(resolve('src/lib/pdf/fixtures/upbit-pdf-sample.txt'), 'utf8');

  const result = parseUpbitPdfText(text);

  assert.equal(result.detectedAdapter, 'upbit-pdf-krw');
  assert.equal(result.errors.length, 0);
  assert.equal(result.executions.length, 5);
  assert.equal(result.skippedRowCount, 2);
  assert.deepEqual(result.executions[0], {
    id: 'upbit-pdf-2',
    symbol: 'USDT',
    side: 'buy',
    price: 1374,
    quantity: 7000,
    fee: 0,
    executedAt: '2026-08-18T22:52:10+09:00',
  });
  assert.deepEqual(result.executions[1], {
    id: 'upbit-pdf-3',
    symbol: 'ONDO',
    side: 'sell',
    price: 520.4,
    quantity: 129754,
    fee: 33762.19,
    executedAt: '2026-08-15T23:29:37+09:00',
  });
});

test('업비트 PDF 분석 결과는 기존 Phase 1 파이프라인과 미리보기를 재사용한다', async () => {
  const text = await readFile(resolve('src/lib/pdf/fixtures/upbit-pdf-sample.txt'), 'utf8');

  const result = analyzeUpbitPdfText(text, { A4: '50', generalMbti: 'INTP' });

  assert.equal(result.sourceFormat, 'pdf');
  assert.equal(result.preview.adapterLabel, 'upbit-pdf-krw');
  assert.equal(result.preview.sourceFormatLabel, 'PDF 거래내역');
  assert.equal(result.preview.normalRowCount, 5);
  assert.equal(result.preview.errorRowCount, 0);
  assert.equal(result.preview.skippedRowCount, 2);
  assert.match(result.preview.periodLabel, /2026\.08/);
  assert.match(result.investmentType.code, /^[CW?]-[RH?]-[LX?]-[ND?]$/);
  assert.equal(result.expectationActuals.B1?.label, '월 거래 횟수');
});

test('업비트 익명화 실제형 PDF는 날짜에 공백이 있어도 거래 행을 파싱한다', async () => {
  const text = await readFile(resolve('src/lib/pdf/fixtures/upbit-pdf-realistic-spaced-date.txt'), 'utf8');
  const result = parseUpbitPdfText(text);

  assert.equal(result.detectedAdapter, 'upbit-pdf-krw');
  assert.equal(result.errors.length, 0);
  assert.equal(result.executions.length, 2);
  assert.deepEqual(result.executions[0], {
    id: 'upbit-pdf-1',
    symbol: 'USDT',
    side: 'buy',
    price: 1374,
    quantity: 7000,
    fee: 0,
    executedAt: '2026-08-18T22:52:10+09:00',
  });
  assert.equal(result.executions[1].symbol, 'ONDO');
  assert.equal(result.executions[1].executedAt, '2026-08-15T23:29:37+09:00');
});

test('텍스트 레이어 판정은 공백만 있는 추출 결과를 없는 것으로 본다', () => {
  // 인쇄 → PDF로 저장으로 만든 이미지 PDF는 페이지 구분만 남고 글자가 없다.
  assert.equal(hasTextLayer('\n\f\n\n \t\n'), false);
  assert.equal(hasTextLayer(''), false);
  assert.equal(hasTextLayer('거래내역서'), true);
});

test('거래 행을 못 찾으면 빈 성공이 아니라 명시적 실패를 반환한다', () => {
  const upbitLike = ['거래내역서', '발급번호 UT-0000', '거래일자 거래유형 자산명'].join('\n');

  const result = parseUpbitPdfText(upbitLike);

  assert.equal(result.executions.length, 0);
  assert.equal(result.detectedAdapter, null);
  assert.equal(result.errors.length, 1);
  assert.match(result.errors[0].reason, /매수\/매도 행을 찾지 못했습니다/);
});

test('업비트 서식이 아니면 원본 PDF를 확인하라고 알린다', () => {
  const result = parseUpbitPdfText('전혀 다른 문서\n두 번째 줄');

  assert.equal(result.executions.length, 0);
  assert.equal(result.detectedAdapter, null);
  assert.equal(result.errors.length, 1);
  assert.match(result.errors[0].reason, /업비트 거래내역서 형식이 아닙니다/);
});


test('PDF 레코드 중간에 페이지 푸터와 반복 헤더가 끼어도 거래를 누락하지 않는다', () => {
  const text = [
    '거래내역서',
    '1',
    '2026.08.18 매수 KRW-USDT 7,000 USDT 0 KRW',
    '22:52:10 1,374 KRW 9,618,000 KRW 9,618,000 KRW',
    '2',
    '1 / 25',
    '거래일자 거래유형 자산명 거래수량 수수료',
    '2026.08.15 매도 KRW-ONDO 129,754 ONDO 33,762.19 KRW',
    '23:29:37 520.4 KRW 67,524,881.6 KRW 67,491,119.41 KRW',
    '3',
    '2026.08.14 매수 KRW-BTC 1 BTC 0 KRW',
    '09:00:00 100 KRW 100 KRW 100 KRW',
  ].join('\n');

  const result = parseUpbitPdfText(text);

  assert.equal(result.executions.length, 3);
  assert.equal(result.errors.length, 0);
  assert.equal(result.skippedRowCount, 0);
  assert.equal(result.executions[1].symbol, 'ONDO');
});


test('PDF 파서는 페이지 번호 같은 단독 숫자 라인을 거래 오류로 세지 않는다', () => {
  const result = parseUpbitPdfText(
    [
      '거래내역서',
      '1',
      '2026.08.18 매수 KRW-BTC 1 BTC 0 KRW',
      '09:00:00 100 KRW 100 KRW 100 KRW',
      '2',
      '페이지',
      '3',
      '반복 헤더',
    ].join('\n')
  );
  assert.equal(result.executions.length, 1);
  assert.equal(result.errors.length, 0);
  assert.equal(result.skippedRowCount > 0, true);
});
