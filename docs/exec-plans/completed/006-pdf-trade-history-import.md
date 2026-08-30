# 006 PDF Trade History Import

- 작성일: 2026-08-26
- 상태: Completed (2026-08-26)
- 근거: 실제 업비트 고객센터 PDF 거래내역 샘플, [v5.2 PDF 거래내역 업로드 Product Spec](../../product-specs/v5.2_pdf-trade-history-import.md)

## 목표

업비트 고객센터가 PDF로 거래내역을 발급하는 실제 흐름을 반영해, PDF 거래내역도 기존 CSV와 동일한 분석 파이프라인으로 처리한다.

## 완료 항목

- [x] 암호화된 실제 업비트 PDF를 비밀번호로 열어 텍스트 레이어가 있는지 확인했다.
- [x] `pdfjs-dist` 기반 PDF 텍스트 추출 모듈을 추가했다.
- [x] 업비트 PDF 텍스트 row 어댑터를 추가했다.
- [x] 입금/출금/예치금 이용료는 제외하고 `매수`/`매도` `KRW-*` 행만 `RawExecution`으로 변환한다.
- [x] CSV/PDF가 공통 `analyzeParseResult`를 통해 Phase 1 score engine, 파생 시계열, 투자거울 타입을 재사용한다.
- [x] `use-flow-store`를 `tradeAnalysis` 중심으로 바꿔 CSV-only 상태명을 제거했다.
- [x] 업로드 화면에서 PDF/CSV 파일을 모두 허용하고, 암호화 PDF는 비밀번호 입력 또는 암호 제거본 업로드를 안내한다.
- [x] 실제 PDF 샘플로 정상 row 304건, 오류 0건, 제외 row 50건, 병합 Order 226건, RoundTrip 107건, F1/F3/F6/F8 측정을 스모크 검증했다.

## 후속 과제

1. PDF 암호 입력 UX를 `window.prompt`에서 정식 보안 입력 컴포넌트로 교체한다.
2. 스캔 이미지 PDF/OCR 지원 여부를 결정한다.
3. 실제 CSV 샘플 확보 후 CSV 어댑터의 추정 스키마를 확정한다.
4. F2/F4/F5/F7/F9/F10을 PDF/CSV 실데이터 기반으로 확장한다.
