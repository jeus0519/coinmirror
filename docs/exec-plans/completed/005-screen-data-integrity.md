# 005 Screen Data Integrity

- 작성일: 2026-08-25
- 상태: Completed (2026-08-25)
- 근거: `C:\Users\Junsung\Desktop\coinmirror_2026-08-25_작업지시_4차.md`

## 목표

CSV 업로드 후 분석 화면에 표시되는 숫자가 사용자의 CSV에서 나온 파생 시계열과 점수 엔진 결과를 사용하도록 정리한다.

## 완료 항목

- [x] `src/lib/score-engine/derived-series.ts`가 `Order[]`/`RoundTrip[]`만 입력으로 받는다.
- [x] `hourlyAmount`, `weekdayOrderCount`, `perSymbolBuyShare`, `winRate`, `medianHoldingHours`, `monthlyOrderCount`를 산출한다.
- [x] 분석 화면 요약용 `totalOrderAmount`, `realizedPnl`, `openPositionCount`를 산출한다.
- [x] CSV 경로의 「예상 vs 실제」가 `expectationActuals` 실측값을 사용한다.
- [x] F1/F3/F6/F8 근거 거래를 실제 `Order`/`RoundTrip`에서 생성한다.
- [x] 근거 문구에는 손익률 표현을 넣지 않는다.
- [x] `HOUR_BUCKETS`, `WEEKDAY_COUNTS`, `realizedTrades`, `mockRecords` 기반 화면 숫자를 제거했다.
- [x] 샘플 경로도 `syntheticFixtures.normal` → 전처리 → 파생 시계열을 통과한다.
- [x] 세로형 공유 카드 컴포넌트가 예상/기록 타입 양쪽에 적용됐다.

## 남은 후속 과제

1. 실제 업비트 CSV 샘플 확보 후 어댑터 컬럼 후보와 숫자/날짜 포맷을 보정한다.
2. F2/F4/F5/F7/F9/F10의 실제 CSV 기반 계산을 확장한다.
3. HTML 데모의 정적 BOOT 응답 스키마를 후속 실제 API 스키마와 맞춘다.
