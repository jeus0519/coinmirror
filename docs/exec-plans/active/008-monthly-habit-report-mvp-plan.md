# 008 Monthly Habit Report MVP Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** 구독관리의 세 번째 핵심 혜택인 “월간 투자습관 리포트”를 서버/로그인 없이 local-first 방식으로 먼저 체험 가능한 MVP로 만든다.

**Architecture:** 기존 `SubscriptionSnapshot` 배열과 `SavedSubscriptionGoal`을 입력으로 받아 월 단위 리포트 view model을 생성한다. MVP에서는 PDF 파일 생성/이메일 발송/서버 저장을 하지 않고, 앱 안에서 월간 리포트 미리보기 카드와 잠금 해제형 구독 CTA를 제공한다.

**Tech Stack:** Expo Router, React Native Web, Zustand, TypeScript pure functions, Node test runner, existing `subscription/snapshots`, `subscription/goals`, `subscription/persistence`.

---

## 1. 제품 판단

### 왜 지금 월간 리포트인가

현재 구독관리 MVP는 아래 2개 축이 구현되어 있다.

1. 기준선 저장/다음 업로드 비교
2. 목표 후보 생성/저장/다음 분석 평가

월간 리포트는 이 둘을 “한 달 단위 회고 결과물”로 묶어 구독 가치를 설명하는 역할을 한다. 사용자가 앱을 다시 열 이유를 만들고, 결제 전에도 “구독하면 무엇을 받는지”를 구체적으로 보여줄 수 있다.

### MVP에서 PDF 생성은 제외

초기 MVP에서 실제 PDF 생성은 보류한다.

이유:

- 서버/로그인 없이 로컬 PDF 생성까지 넣으면 구현 범위가 커진다.
- 월간 리포트의 핵심 가치는 파일 자체보다 “한 달 동안 내 행동이 어떻게 바뀌었는지”를 이해하는 화면이다.
- PDF 생성은 구독 결제/서버 저장/이메일 발송과 결합될 가능성이 높아, 지금 구현하면 나중에 구조 변경 비용이 커진다.
- 투자 리포트처럼 보이는 PDF는 금융 조언/성과 평가로 오해될 수 있어 카피와 면책 문구를 더 신중히 잡아야 한다.

따라서 이번 MVP는 **앱 내 월간 투자습관 리포트 미리보기**로 제한한다.

---

## 2. MVP 범위

### 포함

- 저장된 `SubscriptionSnapshot[]`에서 월별 리포트 후보 생성
- 최신 월 또는 선택 월의 리포트 view model 생성
- 월간 요약 카드
  - 분석 횟수
  - 신규 반영 체결 수
  - 중복 제외 체결 수
  - 원가 연결용 context lot 수
  - 월 평균 주문 수
  - 청산 승률
  - 손실/수익 보유기간
- 변화 요약
  - 직전 월 대비 개선/악화/유지/판단 보류
  - 표본 부족 시 숫자 과장 금지
- 목표 회고
  - 저장 목표 수
  - 달성/재점검/판단 보류 상태 집계
  - 대표 목표 1~3개
- 중복 업로드 자동 처리 안내
  - “중복 체결은 제외했고, 기간 밖 매수는 원가 연결용으로만 사용했다”는 설명
- 분석 화면 또는 목표 화면에서 월간 리포트 미리보기 CTA 제공
- 구독 혜택 페이지에서 월간 리포트 미니 프리뷰와 실제 앱 내 preview 연결

### 제외

- 실제 PDF 파일 생성
- 이메일 발송
- 서버 DB 저장
- 로그인/회원가입
- 결제 PG 연동
- 사용자 전체 거래 row 장기 저장
- 종목별 세부 성과 리포트
- 수익률 랭킹/또래 비교
- 투자 추천/매수·매도 제안

---

## 3. 데이터 원칙

### 입력 데이터

사용 가능한 기존 데이터:

- `SubscriptionSnapshot[]`
  - `createdAt`
  - `periodStart`, `periodEnd`, `periodLabel`
  - `investmentTypeCode`, `investmentTypeTitle`
  - `metrics`
  - `summary.orderCount`
  - `summary.roundTripCount`
  - `summary.winRate`
  - `summary.profitHoldingHours`
  - `summary.lossHoldingHours`
  - `summary.monthlyOrderCount`
  - `summary.openPositionCount`
  - `summary.symbolCount`
  - `dedupe.totalExecutionCount`
  - `dedupe.duplicateExecutionCount`
  - `dedupe.uniqueExecutionCount`
  - `dedupe.contextExecutionCount`
- `SavedSubscriptionGoal[]`
  - `metricKey`
  - `targetDirection`
  - `baselineSnapshotId`
  - `latestSnapshotId`
  - `status`
  - `title`, `description`, `evaluationCopy`

### 저장 금지

월간 리포트 MVP에서도 아래는 저장/출력하지 않는다.

- 원본 PDF
- PDF 비밀번호
- 개별 체결 원문
- 계좌/고객 식별자
- 거래소 API secret
- 주문/출금 권한 API key
- 실제 거래소 주문 ID 원문

### 리포트 view model은 파생 데이터

월간 리포트는 별도 영구 저장하지 않는다. 화면 렌더링 시 기존 스냅샷/목표에서 파생한다.

이유:

- 중복 저장을 줄인다.
- 스냅샷 스키마 변경 시 리포트 재생성이 쉽다.
- 로컬 저장 payload가 커지는 것을 막는다.

---

## 4. 월간 리포트 모델 설계

새 파일 후보:

```text
src/lib/subscription/monthly-report.ts
```

### 타입 초안

```ts
export type MonthlyHabitReportStatus = 'ready' | 'insufficient-data';

export type MonthlyHabitReportMetric = {
  key:
    | 'analysisCount'
    | 'uniqueExecutionCount'
    | 'duplicateExecutionCount'
    | 'contextExecutionCount'
    | 'winRate'
    | 'lossHoldingHours'
    | 'profitHoldingHours'
    | 'monthlyOrderCount';
  label: string;
  value: string;
  helper: string;
  tone?: 'positive' | 'negative' | 'neutral';
};

export type MonthlyHabitReportChange = {
  metricKey: 'winRate' | 'lossHoldingHours' | 'profitHoldingHours' | 'monthlyOrderCount';
  label: string;
  copy: string;
  status: 'improved' | 'worsened' | 'unchanged' | 'pending';
};

export type MonthlyHabitReportGoalSummary = {
  total: number;
  achieved: number;
  needsReview: number;
  insufficientData: number;
  active: number;
  highlights: string[];
};

export type MonthlyHabitReport = {
  status: MonthlyHabitReportStatus;
  monthKey: string; // YYYY-MM
  title: string;
  subtitle: string;
  summaryCopy: string;
  metrics: MonthlyHabitReportMetric[];
  changes: MonthlyHabitReportChange[];
  goalSummary: MonthlyHabitReportGoalSummary;
  safetyCopy: string;
};
```

### 생성 함수 초안

```ts
export function buildMonthlyHabitReport(
  snapshots: readonly SubscriptionSnapshot[],
  goals: readonly SavedSubscriptionGoal[],
  options?: { monthKey?: string }
): MonthlyHabitReport
```

### 월 구분 기준

MVP에서는 `snapshot.createdAt` 기준으로 월을 묶는다.

이유:

- 사용자가 업로드한 파일의 거래 기간이 여러 달을 포함할 수 있다.
- “월간 리포트”의 MVP 의미는 실제 거래 발생월보다 “분석/회고를 저장한 월”에 가깝다.
- 나중에 서버/API 연결이 생기면 `periodStart/periodEnd` 기준 월별 거래 리포트로 확장 가능하다.

문구로 명확히 표현한다.

```text
이번 리포트는 이 달에 저장한 분석 요약을 기준으로 만든 회고예요.
```

---

## 5. UX 설계

### 진입 위치

#### 1차 MVP 추천 위치

`Step2Analysis`의 구독관리 기준선 카드 아래에 “월간 리포트 미리보기” 섹션을 추가한다.

조건:

- `subscriptionSnapshots.length === 0`
  - 아직 리포트 생성 불가
  - 기준선 저장 유도
- `subscriptionSnapshots.length === 1`
  - 리포트 예비 상태
  - “한 번 더 업로드하면 변화 요약이 생겨요”
- `subscriptionSnapshots.length >= 2`
  - 월간 리포트 미리보기 노출

#### 후속 위치

`Step3Goals` 또는 별도 `/monthly-report` route로 분리 가능.

MVP에서는 새 route를 만들지 않고 분석 화면 안 preview로 충분하다.

### 카드 구성

```text
월간 투자습관 리포트 미리보기
이번 달 저장한 분석 2개를 기준으로 만든 회고예요.

[핵심 요약]
- 신규 반영 체결 3건
- 중복 제외 1건
- 원가 연결 보정 1건
- 월평균 주문 수 개선

[이번 달 변화]
청산 승률: 판단 보류
손실 보유기간: 판단 보류
월평균 주문 수: 개선

[목표 회고]
저장한 목표 1개 · 달성 0개 · 재점검 1개

원본 PDF, 비밀번호, 개별 체결 원문은 저장하지 않아요.
```

### CTA

무료 상태:

```text
월간 리포트 전체 보기
```

클릭 시 `/subscription`으로 이동하거나, 현재는 구독 혜택 페이지 CTA로 연결한다.

구독 체험 상태 또는 내부 QA:

```text
월간 리포트 미리보기 펼치기
```

---

## 6. 카피 원칙

### 피해야 할 표현

- “수익률 개선”
- “투자 실력 향상”
- “이 종목은 피하세요”
- “다음 달 수익 예측”
- “상위 n%”

### 사용할 표현

- “행동 지표”
- “회고”
- “저장한 분석 기준”
- “판단 보류”
- “중복 체결 제외”
- “원가 연결용 보정”
- “다음 업로드 때 다시 확인할 목표”

---

## 7. 구현 계획

### Task 1: 월간 리포트 순수 함수 테스트 RED

**Objective:** 저장된 스냅샷과 목표에서 월간 리포트 view model을 생성해야 함을 테스트로 고정한다.

**Files:**

- Create: `tests/subscription-monthly-report.test.ts`
- Create: `src/lib/subscription/monthly-report.ts`

**Step 1: Write failing test**

테스트 케이스:

1. 같은 월에 저장된 스냅샷 2개를 묶어 `ready` 리포트를 만든다.
2. 중복 제외/신규 반영/context lot 수를 합산한다.
3. 저장 목표 상태를 집계한다.
4. 스냅샷이 1개 미만이면 `insufficient-data` 상태를 반환한다.

**Step 2: Run**

```bash
node --import tsx --test tests/subscription-monthly-report.test.ts
```

Expected: FAIL — module/function missing.

**Step 3: Implement**

`buildMonthlyHabitReport` 구현.

**Step 4: Verify**

```bash
node --import tsx --test tests/subscription-monthly-report.test.ts
npm run typecheck
```

Expected: PASS.

---

### Task 2: 분석 화면 월간 리포트 preview 테스트 RED

**Objective:** `Step2Analysis`에 월간 리포트 preview 카드가 있어야 함을 고정한다.

**Files:**

- Modify: `tests/analysis-screen.test.ts`
- Modify: `src/components/steps/step-2-analysis.tsx`

**Expected source strings:**

```text
월간 투자습관 리포트 미리보기
이번 달 저장한 분석
중복 제외
원가 연결 보정
원본 PDF와 비밀번호는 저장하지 않아요
```

**Run:**

```bash
node --import tsx --test tests/analysis-screen.test.ts
```

Expected: FAIL first, then PASS after UI implementation.

---

### Task 3: 분석 화면에 월간 리포트 view model 연결

**Objective:** store의 `subscriptionSnapshots`, `savedSubscriptionGoals`로 report를 생성하고 카드에 표시한다.

**Files:**

- Modify: `src/components/steps/step-2-analysis.tsx`
- Import: `buildMonthlyHabitReport`

**Implementation notes:**

- `useMemo`로 report 생성
- `report.status === 'insufficient-data'`이면 “한 번 더 저장하면 월간 변화가 생겨요” 표시
- `report.status === 'ready'`이면 metrics/changes/goalSummary 노출
- 무료 사용자는 CTA를 `/subscription`으로 연결

**Verification:**

```bash
node --import tsx --test tests/analysis-screen.test.ts tests/subscription-monthly-report.test.ts
npm run typecheck
```

---

### Task 4: 구독 혜택 페이지의 월간 리포트 미니 프리뷰 강화

**Objective:** `/subscription`에서 월간 리포트가 단순 혜택 문구가 아니라 실제 앱 내 미리보기와 일관된 구조로 보이게 한다.

**Files:**

- Modify: `tests/subscription-page.test.ts`
- Modify: `src/app/subscription.tsx`

**Expected strings:**

```text
이번 달 저장한 분석
중복 제외
원가 연결 보정
목표 회고
```

**Verification:**

```bash
node --import tsx --test tests/subscription-page.test.ts
```

---

### Task 5: 문서 갱신 및 전체 검증

**Files:**

- Modify: `docs/exec-plans/active/007-subscription-baseline-api-login-roadmap.md`
- Keep: `docs/exec-plans/active/008-monthly-habit-report-mvp-plan.md`

**Run:**

```bash
npm test && npm run lint && npm run typecheck && git diff --check
```

Expected:

```text
tests pass
lint pass
typecheck pass
diff check pass
```

---

## 8. Acceptance Criteria

월간 리포트 MVP 설계/구현 완료 기준:

- [ ] `buildMonthlyHabitReport`가 스냅샷/목표에서 월간 리포트 view model을 생성한다.
- [ ] 스냅샷이 부족하면 숫자를 꾸미지 않고 `insufficient-data` 상태를 반환한다.
- [ ] 중복 제외 체결 수와 원가 연결용 context lot 수가 리포트에 포함된다.
- [ ] 목표 달성/재점검/판단 보류 상태가 집계된다.
- [ ] 분석 화면에서 월간 리포트 미리보기가 보인다.
- [ ] 무료 사용자는 리포트 전체 기능을 구독 혜택으로 이해할 수 있다.
- [ ] 원본 PDF/비밀번호/개별 체결 원문 저장 금지 원칙이 유지된다.
- [ ] 전체 테스트/lint/typecheck가 통과한다.

---

## 9. 이후 확장 방향

### PDF 생성 단계

도입 조건:

- 앱 내 월간 리포트 preview가 구독 전환/재방문에 유의미하다는 신호 확인
- 결제/로그인 구조 확정
- 리포트 저장/삭제 정책 확정

후보 파일:

```text
src/lib/subscription/monthly-report-pdf.ts
src/app/monthly-report.tsx
```

### 서버/로그인 연동 단계

도입 조건:

- 월간 리포트를 자동 생성/발송해야 함
- 다기기에서 리포트 이어보기가 필요함
- 결제 계정과 리포트 소유자를 연결해야 함

서버 저장 시에도 원칙은 동일하다.

```text
원본 거래내역 저장 금지
PDF 비밀번호 저장 금지
요약 스냅샷/리포트 파생값만 저장
사용자 삭제 기능 필수
```
