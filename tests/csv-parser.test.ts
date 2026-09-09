import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { buildSampleInvestmentTypeProfile } from '../src/lib/investment-type.ts';
import { analyzeCsvInput } from '../src/lib/csv/analyze-csv.ts';
import { parseCsv } from '../src/lib/csv/parse-csv.ts';
import { parseUpbitCsv } from '../src/lib/csv/parse-upbit-csv.ts';
import { buildPhase1ScoreMetrics } from '../src/lib/score-engine/index.ts';

test('CSV 어댑터는 공통 파서 구현을 import하지 않아 순환 의존 경고를 만들지 않는다', async () => {
  const source = await readFile(resolve('src/lib/csv/adapters/upbit.ts'), 'utf8');

  assert.doesNotMatch(source, /from ['"]\.\.\/parse-csv['"]/);
  assert.doesNotMatch(source, /from ['"]\.\.\/parse-csv\.ts['"]/);
});

test('업비트 합성 CSV는 선언형 매핑으로 RawExecution으로 변환된다', async () => {
  const csv = await readFile(resolve('src/lib/csv/fixtures/upbit-sample.csv'), 'utf8');
  assert.match(csv.split('\n')[0], /⚠️ 추정 스키마/);

  const result = parseUpbitCsv(csv);

  assert.equal(result.detectedAdapter, 'upbit-krw-estimated');
  assert.equal(result.errors.length, 0);
  assert.ok(result.executions.length >= 20);
  assert.deepEqual(result.executions[0], {
    id: 'upbit-1',
    symbol: 'BTC',
    side: 'buy',
    price: 100,
    quantity: 1,
    fee: 0.05,
    executedAt: '2026-01-01T09:00:00+09:00',
  });
  assert.equal(result.columnMapping.symbol, '마켓');
  assert.equal(result.skippedRowCount, 1);
});

test('CSV 파서는 콤마 숫자, KST 날짜, CP949 디코딩을 처리한다', () => {
  const bytes = new Uint8Array([
    0xb8, 0xb6, 0xc4, 0xcf, 0x2c, 0xb1, 0xb8, 0xba, 0xd0, 0x2c, 0xc3, 0xbc, 0xb0, 0xe1, 0xbd, 0xc3,
    0xb0, 0xa3, 0x2c, 0xc3, 0xbc, 0xb0, 0xe1, 0xb0, 0xa1, 0x2c, 0xbc, 0xf6, 0xb7, 0xae, 0x2c, 0xbc,
    0xf6, 0xbc, 0xf6, 0xb7, 0xe1, 0x0a, 0x4b, 0x52, 0x57, 0x2d, 0x42, 0x54, 0x43, 0x2c, 0xb8, 0xc5,
    0xbc, 0xf6, 0x2c, 0x32, 0x30, 0x32, 0x36, 0x2e, 0x30, 0x31, 0x2e, 0x30, 0x31, 0x20, 0x30, 0x39,
    0x3a, 0x30, 0x30, 0x3a, 0x30, 0x30, 0x2c, 0x22, 0x31, 0x2c, 0x30, 0x30, 0x30, 0x22, 0x2c, 0x30,
    0x2e, 0x35, 0x2c, 0x30, 0x0a,
  ]);

  const result = parseCsv(bytes, { adapter: 'upbit' });

  assert.equal(result.errors.length, 0);
  assert.equal(result.executions[0].price, 1000);
  assert.equal(result.executions[0].quantity, 0.5);
  assert.equal(result.executions[0].executedAt, '2026-01-01T09:00:00+09:00');
});

test('업비트 익명화 실제형 CSV 헤더 변형도 침묵 실패 없이 파싱한다', async () => {
  const csv = await readFile(resolve('src/lib/csv/fixtures/upbit-realistic-variant.csv'), 'utf8');
  const result = parseUpbitCsv(csv);

  assert.equal(result.detectedAdapter, 'upbit-krw-estimated');
  assert.equal(result.errors.length, 0);
  assert.equal(result.executions.length, 4);
  assert.deepEqual(result.executions[0], {
    id: 'upbit-1',
    symbol: 'USDT',
    side: 'buy',
    price: 1374,
    quantity: 7000,
    fee: 0,
    executedAt: '2026-08-18T22:52:10+09:00',
  });
  assert.equal(result.executions[1].symbol, 'ONDO');
  assert.equal(result.executions[1].side, 'sell');
  assert.equal(result.executions[1].fee, 33762.19);
  assert.equal(result.columnMapping.side, '거래종류');
  assert.equal(result.columnMapping.price, '거래단가');
});

test('헤더 미인식 또는 필수 컬럼 누락은 빈 성공이 아니라 명시적 실패를 반환한다', async () => {
  const malformed = await readFile(resolve('src/lib/csv/fixtures/upbit-malformed.csv'), 'utf8');
  const missingHeader = parseCsv('foo,bar\n1,2', { adapter: 'upbit' });
  const result = parseUpbitCsv(malformed);

  assert.equal(missingHeader.detectedAdapter, null);
  assert.equal(missingHeader.executions.length, 0);
  assert.match(missingHeader.errors[0].reason, /필수 컬럼|헤더/);
  assert.ok(result.errors.length >= 2);
  assert.equal(result.executions.length, 1);
  assert.ok(result.errors.some((error) => /side|구분/.test(error.reason)));
  assert.ok(result.errors.some((error) => /숫자|체결가/.test(error.reason)));
});

test('수수료 컬럼이 없으면 0으로 두고 F6 수수료 항 제외 상태를 기록한다', () => {
  const csv = `마켓,구분,체결시간,체결가,수량\nKRW-BTC,매수,2026-01-01 09:00:00,100,1\nKRW-BTC,매도,2026-01-01 15:00:00,110,1\n`;

  const result = parseUpbitCsv(csv);

  assert.equal(result.errors.length, 0);
  assert.equal(result.executions[0].fee, 0);
  assert.equal(result.feePolicy, 'missing_fee_column');
});

test('업비트 CSV 파싱 결과는 Phase 1 엔진을 통과해 투자거울 타입을 만든다', async () => {
  const csv = await readFile(resolve('src/lib/csv/fixtures/upbit-sample.csv'), 'utf8');
  const result = parseUpbitCsv(csv);
  const metrics = buildPhase1ScoreMetrics(result.executions, {
    maxSingleAssetWeightPct: 50,
    excludeFeeDrag: result.feePolicy === 'missing_fee_column',
  });
  const type = buildSampleInvestmentTypeProfile(metrics, 'INTP');

  assert.equal(result.errors.length, 0);
  assert.equal(
    metrics.every((metric) => metric.measured),
    true
  );
  assert.match(type.code, /^[CW]-[RH]-[LX]-[ND]$/);
  assert.equal(type.generalMbti, 'INTP');
});

test('analyzeCsvInput은 파싱 미리보기와 엔진 결과를 한 번에 만든다', async () => {
  const csv = await readFile(resolve('src/lib/csv/fixtures/upbit-sample.csv'), 'utf8');
  const result = analyzeCsvInput(csv, { A4: '50', generalMbti: 'INTP' });

  assert.equal(result.preview.adapterLabel, 'upbit-krw-estimated');
  assert.equal(result.preview.errorRowCount, 0);
  assert.ok(result.preview.normalRowCount >= 20);
  assert.ok(result.preview.symbolCount >= 5);
  assert.match(result.preview.periodLabel, /2026\.01/);
  assert.match(result.investmentType.code, /^[CW]-[RH]-[LX]-[ND]$/);
  assert.equal(result.expectationActuals.B1?.actual, '월평균 39.0회');
  assert.match(result.expectationActuals.B2?.actual ?? '', /아침·낮/);
  assert.match(result.expectationActuals.B3?.actual ?? '', /이익 .* · 손실 .*/);
  assert.match(result.expectationActuals.B4?.actual ?? '', /%/);
});

test('analyzeCsvInput은 A4 답변이 없어도 실제 거래내역의 자금 배분 축을 ?로 두지 않는다', async () => {
  const csv = await readFile(resolve('src/lib/csv/fixtures/upbit-sample.csv'), 'utf8');
  const result = analyzeCsvInput(csv, { generalMbti: 'INTP' });

  assert.match(result.investmentType.code, /^[CW]-[RH]-[LX]-[ND]$/);
  assert.notEqual(result.investmentType.axes.find((axis) => axis.axis === 'allocation')?.code, '?');
});

test('업비트 CSV 검증: 필수 체결가 누락/빈 값 행 거부', () => {
  const csv = `마켓,구분,체결시간,체결가,수량\nKRW-BTC,매수,2026-01-01 09:00:00,,1\n`;
  const result = parseUpbitCsv(csv);
  assert.equal(result.executions.length, 0);
  assert.equal(result.errors.length, 1);
  assert.match(result.errors[0].reason, /체결가/);
});

test('업비트 CSV 검증: 체결가 <= 0 행 거부', () => {
  const csvZero = `마켓,구분,체결시간,체결가,수량\nKRW-BTC,매수,2026-01-01 09:00:00,0,1\n`;
  const csvNegative = `마켓,구분,체결시간,체결가,수량\nKRW-BTC,매수,2026-01-01 09:00:00,-100,1\n`;

  const resultZero = parseUpbitCsv(csvZero);
  assert.equal(resultZero.executions.length, 0);
  assert.equal(resultZero.errors.length, 1);
  assert.match(resultZero.errors[0].reason, /체결가/);

  const resultNegative = parseUpbitCsv(csvNegative);
  assert.equal(resultNegative.executions.length, 0);
  assert.equal(resultNegative.errors.length, 1);
  assert.match(resultNegative.errors[0].reason, /체결가/);
});

test('업비트 CSV 검증: 수량 <= 0 행 거부', () => {
  const csvZero = `마켓,구분,체결시간,체결가,수량\nKRW-BTC,매수,2026-01-01 09:00:00,100,0\n`;
  const csvNegative = `마켓,구분,체결시간,체결가,수량\nKRW-BTC,매수,2026-01-01 09:00:00,100,-0.5\n`;

  const resultZero = parseUpbitCsv(csvZero);
  assert.equal(resultZero.executions.length, 0);
  assert.equal(resultZero.errors.length, 1);
  assert.match(resultZero.errors[0].reason, /수량/);

  const resultNegative = parseUpbitCsv(csvNegative);
  assert.equal(resultNegative.executions.length, 0);
  assert.equal(resultNegative.errors.length, 1);
  assert.match(resultNegative.errors[0].reason, /수량/);
});

test('업비트 CSV 검증: 수수료 < 0 행 거부 (0은 허용)', () => {
  const csvZeroFee = `마켓,구분,체결시간,체결가,수량,수수료\nKRW-BTC,매수,2026-01-01 09:00:00,100,1,0\n`;
  const csvNegativeFee = `마켓,구분,체결시간,체결가,수량,수수료\nKRW-BTC,매수,2026-01-01 09:00:00,100,1,-0.05\n`;

  const resultZero = parseUpbitCsv(csvZeroFee);
  assert.equal(resultZero.executions.length, 1);
  assert.equal(resultZero.errors.length, 0);
  assert.equal(resultZero.executions[0].fee, 0);

  const resultNegative = parseUpbitCsv(csvNegativeFee);
  assert.equal(resultNegative.executions.length, 0);
  assert.equal(resultNegative.errors.length, 1);
  assert.match(resultNegative.errors[0].reason, /수수료/);
});

test('업비트 CSV 검증: 유효하지 않은 달력 날짜 및 시간 거부', () => {
  const csvInvalidDate = `마켓,구분,체결시간,체결가,수량\nKRW-BTC,매수,2026-02-31 09:00:00,100,1\n`;
  const csvInvalidHour = `마켓,구분,체결시간,체결가,수량\nKRW-BTC,매수,2026-01-01 25:00:00,100,1\n`;
  const csvInvalidMonth = `마켓,구분,체결시간,체결가,수량\nKRW-BTC,매수,2026-13-01 09:00:00,100,1\n`;
  const csvInvalidMin = `마켓,구분,체결시간,체결가,수량\nKRW-BTC,매수,2026-01-01 09:61:00,100,1\n`;
  const csvLeapYearInvalid = `마켓,구분,체결시간,체결가,수량\nKRW-BTC,매수,2026-02-29 09:00:00,100,1\n`;
  const csvLeapYearValid = `마켓,구분,체결시간,체결가,수량\nKRW-BTC,매수,2024-02-29 09:00:00,100,1\n`;

  const resInvalidDate = parseUpbitCsv(csvInvalidDate);
  assert.equal(resInvalidDate.executions.length, 0);
  assert.equal(resInvalidDate.errors.length, 1);
  assert.match(resInvalidDate.errors[0].reason, /체결시간|날짜|시간/);

  const resInvalidHour = parseUpbitCsv(csvInvalidHour);
  assert.equal(resInvalidHour.executions.length, 0);
  assert.equal(resInvalidHour.errors.length, 1);
  assert.match(resInvalidHour.errors[0].reason, /체결시간|날짜|시간/);

  const resInvalidMonth = parseUpbitCsv(csvInvalidMonth);
  assert.equal(resInvalidMonth.executions.length, 0);
  assert.equal(resInvalidMonth.errors.length, 1);
  assert.match(resInvalidMonth.errors[0].reason, /체결시간|날짜|시간/);

  const resInvalidMin = parseUpbitCsv(csvInvalidMin);
  assert.equal(resInvalidMin.executions.length, 0);
  assert.equal(resInvalidMin.errors.length, 1);
  assert.match(resInvalidMin.errors[0].reason, /체결시간|날짜|시간/);

  const resLeapYearInvalid = parseUpbitCsv(csvLeapYearInvalid);
  assert.equal(resLeapYearInvalid.executions.length, 0);
  assert.equal(resLeapYearInvalid.errors.length, 1);
  assert.match(resLeapYearInvalid.errors[0].reason, /체결시간|날짜|시간/);

  const resLeapYearValid = parseUpbitCsv(csvLeapYearValid);
  assert.equal(resLeapYearValid.executions.length, 1);
  assert.equal(resLeapYearValid.errors.length, 0);
});
