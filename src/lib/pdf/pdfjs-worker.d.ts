/**
 * pdfjs-dist는 워커 번들에 타입 선언을 함께 제공하지 않는다.
 * 이 모듈은 메인 스레드에 워커 핸들러를 등록하는 용도로만 쓴다 (extract-pdf-text.ts 참고).
 */
declare module 'pdfjs-dist/legacy/build/pdf.worker.mjs' {
  export const WorkerMessageHandler: unknown;
}
