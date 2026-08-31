import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ensurePdfWorker,
  extractPdfText,
  isPdfNoTextLayerError,
} from '../src/lib/pdf/extract-pdf-text.ts';

/**
 * 이 파일은 "Chrome에서 PDF를 골라도 아무 반응이 없던" 회귀를 막는다.
 *
 * 원인: pdfjs-dist 6.x는 브라우저에서 GlobalWorkerOptions.workerSrc가 비어 있으면
 * getDocument() 안에서 즉시 던진다. Node는 모듈 로드 시 workerSrc를 스스로 채워서
 * 기존 테스트로는 절대 잡히지 않았다. 그래서 워커 등록 자체를 명시적으로 검증한다.
 */

/** 오브젝트 배열로 xref 오프셋이 맞는 최소 PDF를 만든다. 전부 ASCII라 문자 길이 = 바이트 길이. */
function buildPdf(objects: string[]) {
  const header = '%PDF-1.4\n';
  const offsets: number[] = [];
  let body = '';
  objects.forEach((object, index) => {
    offsets.push(header.length + body.length);
    body += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const startxref = header.length + body.length;
  let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets) xref += `${String(offset).padStart(10, '0')} 00000 n \n`;
  const trailer = `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${startxref}\n%%EOF\n`;
  return new TextEncoder().encode(header + body + xref + trailer);
}

function buildPdfWithContent(content: string, withFont: boolean) {
  const resources = withFont ? '/Resources << /Font << /F1 5 0 R >> >> ' : '/Resources << >> ';
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 200] ${resources}/Contents 4 0 R >>`,
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
  ];
  if (withFont) objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  return buildPdf(objects);
}

const TEXT_PDF = () =>
  buildPdfWithContent('BT /F1 14 Tf 20 120 Td (COINMIRROR-PDF-OK) Tj ET', true);

/** 글자 없이 사각형만 그린 PDF — 인쇄해서 저장한 이미지 PDF와 같은 상태. */
const IMAGE_ONLY_PDF = () => buildPdfWithContent('0 0 1 rg 10 10 200 100 re f', false);

test('pdf.js 워커를 메인 스레드 핸들러로 등록한다', async () => {
  await ensurePdfWorker();

  const host = globalThis as typeof globalThis & {
    pdfjsWorker?: { WorkerMessageHandler?: { setup?: unknown } };
  };
  assert.equal(typeof host.pdfjsWorker?.WorkerMessageHandler?.setup, 'function');
});

test('extractPdfText는 실제 PDF 바이트에서 텍스트 레이어를 뽑아낸다', async () => {
  const text = await extractPdfText(TEXT_PDF());

  assert.match(text, /COINMIRROR-PDF-OK/);
});

test('extractPdfText는 ArrayBuffer 입력도 그대로 받는다', async () => {
  // 웹 업로드는 File.arrayBuffer()가 준 ArrayBuffer를 그대로 넘긴다.
  const bytes = TEXT_PDF();
  const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);

  const text = await extractPdfText(buffer as ArrayBuffer);

  assert.match(text, /COINMIRROR-PDF-OK/);
});

test('extractPdfText는 같은 ArrayBuffer를 여러 번 다시 열 수 있다', async () => {
  // 암호화 PDF 업로드는 먼저 무암호로 열어본 뒤 같은 원본 바이트를 비밀번호로 재시도한다.
  // pdf.js에 원본 버퍼를 그대로 넘겨 detach/변형되면 두 번째 열기가 실패할 수 있다.
  const bytes = TEXT_PDF();
  const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);

  const first = await extractPdfText(buffer as ArrayBuffer);
  const second = await extractPdfText(buffer as ArrayBuffer);

  assert.match(first, /COINMIRROR-PDF-OK/);
  assert.match(second, /COINMIRROR-PDF-OK/);
});

test('글자가 없는 PDF는 0건으로 넘기지 않고 PdfNoTextLayerError로 알린다', async () => {
  await assert.rejects(
    () => extractPdfText(IMAGE_ONLY_PDF()),
    (error: unknown) => isPdfNoTextLayerError(error) && error.pageCount === 1
  );
});
