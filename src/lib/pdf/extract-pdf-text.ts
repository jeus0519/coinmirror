export class PdfPasswordRequiredError extends Error {
  constructor(message = 'PDF 비밀번호가 필요합니다') {
    super(message);
    this.name = 'PdfPasswordRequiredError';
  }
}

export class PdfTextExtractionError extends Error {
  constructor(message = 'PDF 텍스트를 추출하지 못했습니다') {
    super(message);
    this.name = 'PdfTextExtractionError';
  }
}

/**
 * 텍스트 레이어가 없는 PDF(인쇄 → PDF로 저장으로 만든 이미지 PDF, 스캔본 등).
 * 조용히 0건으로 흘려보내면 사용자가 원인을 알 수 없으므로 명시적으로 실패시킨다.
 */
export class PdfNoTextLayerError extends Error {
  readonly pageCount: number;

  constructor(pageCount: number) {
    super(`PDF ${pageCount}쪽에서 글자를 찾지 못했습니다. 이미지로 저장된 PDF로 보입니다`);
    this.name = 'PdfNoTextLayerError';
    this.pageCount = pageCount;
  }
}

type PdfJsItem = { str?: string; hasEOL?: boolean };

type PdfJsModule = {
  getDocument: (options: { data: Uint8Array; password?: string; useWorkerFetch?: boolean }) => {
    destroy: () => Promise<void>;
    promise: Promise<{
      numPages: number;
      getPage: (pageNumber: number) => Promise<{
        getTextContent: () => Promise<{ items: PdfJsItem[] }>;
      }>;
    }>;
  };
};

type PdfWorkerHost = typeof globalThis & { pdfjsWorker?: { WorkerMessageHandler: unknown } };

let pdfWorkerSetup: Promise<void> | null = null;

/**
 * pdfjs-dist 6.x는 브라우저에서 `GlobalWorkerOptions.workerSrc`가 비어 있으면
 * getDocument() 안에서 `No "GlobalWorkerOptions.workerSrc" specified.`로 즉시 던진다.
 * Node는 모듈 로드 시점에 workerSrc를 스스로 채우기 때문에 이 문제가 테스트에서는 드러나지 않고
 * Chrome에서만 모든 PDF가 첫 바이트도 못 읽고 실패했다.
 *
 * Metro 웹 번들에는 워커 파일을 가리킬 안정적인 URL이 없으므로,
 * 워커 모듈을 `globalThis.pdfjsWorker`에 올려 pdf.js가 메인 스레드 핸들러를 쓰게 한다.
 * (pdf.js는 이 전역이 있으면 별도 Worker를 띄우지 않고 그대로 재사용한다.)
 */
export function ensurePdfWorker() {
  pdfWorkerSetup ??= (async () => {
    const host = globalThis as PdfWorkerHost;
    if (host.pdfjsWorker?.WorkerMessageHandler) return;
    const worker = await import('pdfjs-dist/legacy/build/pdf.worker.mjs');
    host.pdfjsWorker = { WorkerMessageHandler: worker.WorkerMessageHandler };
  })();
  return pdfWorkerSetup;
}

function toUint8Array(input: Uint8Array | ArrayBuffer) {
  if (input instanceof Uint8Array) {
    return new Uint8Array(
      input.buffer.slice(input.byteOffset, input.byteOffset + input.byteLength)
    );
  }
  // pdf.js may transfer or mutate the buffer it receives while loading a document.
  // Web upload retry flows first probe an encrypted PDF without a password and then
  // reopen the same original bytes with a password. Always hand pdf.js a fresh copy
  // so the stored upload bytes remain reusable across password retries.
  return new Uint8Array(input.slice(0));
}

function isPasswordError(error: unknown) {
  if (!(error instanceof Error)) return false;
  return error.name === 'PasswordException' || /password/i.test(error.message);
}

export function isPdfPasswordRequiredError(error: unknown): error is PdfPasswordRequiredError {
  return error instanceof PdfPasswordRequiredError;
}

export function isPdfNoTextLayerError(error: unknown): error is PdfNoTextLayerError {
  return error instanceof PdfNoTextLayerError;
}

/** 공백을 제외하고 글자가 하나라도 있는지. 텍스트 레이어 유무 판정 기준. */
export function hasTextLayer(text: string) {
  return text.replace(/\s/g, '').length > 0;
}

export async function extractPdfText(
  input: Uint8Array | ArrayBuffer,
  options: { password?: string } = {}
): Promise<string> {
  let pdfjs: PdfJsModule;
  try {
    await ensurePdfWorker();
    pdfjs = (await import('pdfjs-dist/legacy/build/pdf.mjs')) as PdfJsModule;
  } catch (error) {
    throw new PdfTextExtractionError(
      error instanceof Error ? `PDF.js 로드 실패: ${error.message}` : 'PDF.js 로드 실패'
    );
  }

  try {
    const loadingTask = pdfjs.getDocument({
      data: toUint8Array(input),
      password: options.password,
      useWorkerFetch: false,
    });
    try {
      const document = await loadingTask.promise;
      const pages: string[] = [];
      for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
        const page = await document.getPage(pageNumber);
        const content = await page.getTextContent();
        const pageText = content.items
          .map((item) => {
            const text = item.str ?? '';
            return item.hasEOL ? `${text}\n` : text;
          })
          .join(' ')
          .replace(/[ \t]+\n/g, '\n')
          .replace(/\n[ \t]+/g, '\n');
        pages.push(pageText);
      }
      const text = pages.join('\n\f\n');
      if (!hasTextLayer(text)) throw new PdfNoTextLayerError(document.numPages);
      return text;
    } finally {
      // 원본 바이트와 비밀번호가 메모리에 남지 않도록 문서를 반드시 닫는다.
      await loadingTask.destroy().catch(() => {});
    }
  } catch (error) {
    if (isPasswordError(error)) throw new PdfPasswordRequiredError();
    if (isPdfNoTextLayerError(error)) throw error;
    throw new PdfTextExtractionError(
      error instanceof Error ? `PDF 텍스트 추출 실패: ${error.message}` : 'PDF 텍스트 추출 실패'
    );
  }
}
