import { type DiagnosisProfile } from '../../onboarding-diagnosis';
import { type ParseResult, type RowError } from '../../csv/types';
import {
  analyzeParseResult,
  type TradeHistoryAnalysisResult,
} from '../../trade-history/build-analysis';
import { type RawExecution } from '../../score-engine/preprocess';

const UPBIT_PDF_COLUMN_MAPPING = {
  symbol: '자산명',
  side: '거래유형',
  executedAt: '거래일자+거래시간',
  price: '거래단가',
  quantity: '거래수량',
  fee: '수수료',
};

function parseNumber(value: string) {
  const normalized = value.replaceAll(',', '').trim();
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) throw new Error(`숫자 파싱 실패: ${value}`);
  return parsed;
}

function normalizeDate(value: string) {
  const match = value.match(/^(\d{4})[.\-/]\s*(\d{1,2})[.\-/]\s*(\d{1,2})\.?$/);
  if (!match) return value.replace(/[./]/g, '-');
  const [, year, month, day] = match;
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

function parseTradePair(
  rowNumber: number,
  dateLine: string,
  timeLine: string,
  executionIndex: number
): RawExecution {
  const tradeMatch = dateLine.match(
    /^(?<date>\d{4}[.\-/]\s*\d{1,2}[.\-/]\s*\d{1,2}\.?)\s+(?<side>매수|매도)\s+KRW-(?<symbol>[A-Z0-9]+)\s+(?<quantity>[\d,]+(?:\.\d+)?)\s+(?<quantityUnit>[A-Z0-9]+)\s+(?<fee>[\d,]+(?:\.\d+)?)\s+KRW(?:\s+.*)?$/
  );
  if (!tradeMatch?.groups) throw new Error('PDF 거래 행 형식을 인식하지 못했습니다');

  const timeMatch = timeLine.match(
    /^(?<time>\d{2}:\d{2}:\d{2})\s+(?<price>[\d,]+(?:\.\d+)?)\s+KRW\s+(?<amount>[\d,]+(?:\.\d+)?)\s+KRW\s+(?<settlement>[\d,]+(?:\.\d+)?)\s+KRW(?:\s+.*)?$/
  );
  if (!timeMatch?.groups) throw new Error('PDF 거래 시간/금액 행 형식을 인식하지 못했습니다');

  return {
    id: `upbit-pdf-${rowNumber || executionIndex + 1}`,
    symbol: tradeMatch.groups.symbol,
    side: tradeMatch.groups.side === '매수' ? 'buy' : 'sell',
    price: parseNumber(timeMatch.groups.price),
    quantity: parseNumber(tradeMatch.groups.quantity),
    fee: parseNumber(tradeMatch.groups.fee),
    executedAt: `${normalizeDate(tradeMatch.groups.date)}T${timeMatch.groups.time}+09:00`,
  };
}

/** 업비트 고객센터 거래내역서로 보이는지. 실패 문구를 구체적으로 만들기 위한 판별. */
function looksLikeUpbitStatement(text: string) {
  return /거래내역서|거래일자|발급번호|거래유형/.test(text);
}

export function parseUpbitPdfText(text: string): ParseResult {
  const lines = text
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  const executions: RawExecution[] = [];
  const errors: RowError[] = [];
  let skippedRowCount = 0;

  for (let index = 0; index < lines.length - 1; index += 1) {
    const maybeNumber = lines[index];
    const dateLine = lines[index + 1];
    const timeLine = lines[index + 2] ?? '';
    const rowNumber = /^\d+$/.test(maybeNumber) ? Number(maybeNumber) : index + 1;

    if (!/^\d+$/.test(maybeNumber)) continue;
    if (!/^\d{4}[.\-/]\s*\d{1,2}[.\-/]\s*\d{1,2}\.?\s+/.test(dateLine)) continue;
    if (!/^\d{2}:\d{2}:\d{2}\s+/.test(timeLine)) continue;

    if (!/\s(매수|매도)\s+KRW-/.test(dateLine)) {
      skippedRowCount += 1;
      index += 2;
      continue;
    }

    try {
      executions.push(parseTradePair(rowNumber, dateLine, timeLine, executions.length));
    } catch (error) {
      errors.push({
        rowNumber,
        reason: error instanceof Error ? error.message : 'PDF 거래 행 파싱 실패',
        raw: [dateLine, timeLine],
      });
    }
    index += 2;
  }

  // 텍스트는 읽혔지만 거래 행을 하나도 인식하지 못한 경우.
  // 빈 결과를 그대로 돌려주면 "0건 · 오류 0건"이라는 침묵 실패가 되므로 명시적으로 알린다.
  if (!executions.length && !errors.length) {
    errors.push({
      rowNumber: 1,
      reason: looksLikeUpbitStatement(text)
        ? `업비트 거래내역서로 보이지만 매수/매도 행을 찾지 못했습니다. 조회기간에 거래가 없거나 서식이 바뀌었을 수 있어요 (읽은 줄 ${lines.length}줄, 건너뛴 행 ${skippedRowCount}줄)`
        : `업비트 거래내역서 형식이 아닙니다. 업비트 고객센터에서 받은 원본 PDF인지 확인해 주세요 (읽은 줄 ${lines.length}줄)`,
      raw: [],
    });
  }

  return {
    executions,
    errors,
    detectedAdapter: executions.length ? 'upbit-pdf-krw' : null,
    columnMapping: UPBIT_PDF_COLUMN_MAPPING,
    skippedRowCount,
    feePolicy: 'provided',
  };
}

export function analyzeUpbitPdfText(
  text: string,
  diagnosis: DiagnosisProfile
): TradeHistoryAnalysisResult {
  return analyzeParseResult(parseUpbitPdfText(text), diagnosis, 'pdf');
}
