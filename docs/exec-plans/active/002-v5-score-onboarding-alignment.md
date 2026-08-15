# 002 — v5.0 스코어·온보딩 구현 정합화

- **상태**: 제안 — 착수 전 범위 확인 필요
- **기준 문서**: [v2.0 PRD](../../v2.0_coinmirror_product_prd.md), [v5.0 Product Spec](../../product-specs/v5.0_score-system-and-onboarding-survey.md)

## 목표

현재 6단계 Expo/HTML 목업을 최신 v5.0 스펙과 일치시키고, 이후 CSV 분석 엔진 구현의 기준점을 만든다.

## 범위

1. 7문항 진단을 A/B 블록 8문항 `DiagnosisProfile`로 교체
2. `나중에 답하기`, A2 최대 2개 선택 구현
3. 예상 vs 실제 카드 UI 및 샘플 데이터 구현
4. M1~M6 위험도형 카드를 F1~F10 양호도 점수 카드로 교체
5. 목표 숫자 입력과 자유 워크시트를 P7 프리셋 원칙으로 교체
6. Expo와 `coinmirror_demo.html`의 문구·순서·상태 동일화
7. 목업 데이터 타입과 스토어를 v5.0 ID/데이터 모델로 변경
8. lint, typecheck, 웹 클릭 플로우 검증

## 비범위

- 실제 CSV 파서
- FIFO RoundTrip 엔진
- 실제 F1~F10 계산
- 결제·구독 SDK
- 거래소 API

## 완료 기준

- Expo와 HTML에서 동일한 8문항을 완료/건너뛸 수 있다.
- 샘플 분석 후 응답한 예상 문항만 예상 vs 실제 카드로 보인다.
- 모든 점수 카드가 높을수록 양호한 방향으로 표시된다.
- 자유 숫자 목표 없이 P7 프리셋을 선택할 수 있다.
- `npm run lint`와 `npx tsc --noEmit`가 통과한다.

## 후속 계획

이 작업 완료 후 별도 Exec Plan으로 업비트 CSV 파싱 → 주문 병합 → FIFO RoundTrip → F3/F5/F6/F7/F10 순서의 실제 엔진 구현을 진행한다.
