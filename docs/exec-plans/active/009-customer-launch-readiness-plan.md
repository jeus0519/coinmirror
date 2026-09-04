# v1.1 코인미러 무료 공개 MVP 런칭 준비 실행계획

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** 데모/지원서 확장과 Closed Beta 모집 중심 접근을 중단하고, 코인미러를 외부 고객이 바로 무료로 사용해볼 수 있는 **Free Public MVP Launch Readiness** 상태로 전환한다.

**Architecture:** 현재 구현된 업비트 PDF/CSV 분석, 웹 기반 local-first 처리, 중복 업로드 처리, 월간 리포트 미리보기를 유지하되, 런칭 전 게이트를 보안·규제·분석 신뢰성·첫 사용자 UX·웹 배포·피드백 루프로 재정렬한다. 서버/로그인/결제는 바로 구현하지 않고, 핵심 분석은 무료로 먼저 사용하게 하며, 결과 경험 이후 선택형 이메일/구독관리 출시 알림으로 수요를 검증한다. 여기서 local-first는 고객 설치형 앱이 아니라 **브라우저 안에서 원본 파일을 우선 처리하고 서버 장기 저장을 피하는 구조**를 뜻한다.

**Tech Stack:** Expo Web, React Native, TypeScript, node:test, browser localStorage, GitHub, 향후 Supabase/PG는 후속 게이트.

---

## 0. 왜 재계획하는가

최근까지의 작업은 “지원/데모에서 보여줄 수 있는 기능”을 빠르게 강화하는 쪽이었다. 현재는 다음 기능이 이미 존재한다.

- 업비트 PDF/CSV 업로드
- 공통 거래 분석 파이프라인
- 투자거울 타입과 행동 점수
- 기준선 저장과 직전 분석 비교
- 중복 업로드 자동 제외
- 교차 기간 청산 보정
- 목표 저장/추적
- 월간 투자습관 리포트 미리보기
- 2회차 데모 패키지

이제 데모를 더 늘리기보다, 실제 고객에게 열었을 때 아래 질문에 답해야 한다.

1. 사용자가 파일을 올려도 안전하다고 느끼는가?
2. 분석 결과를 투자 조언이 아니라 회고로 이해하는가?
3. 실제 업비트 파일에서 파싱 실패율이 감당 가능한가?
4. 첫 분석 후 다음 업로드/구독관리로 돌아올 이유가 명확한가?
5. 법적·보안·겸업 리스크를 출시 전에 최소한으로 통제했는가?
6. 결과를 본 뒤 구독관리 출시 알림을 남길 만큼 후속 가치가 명확한가?

---

## 1. 런칭 원칙

### 1.1 이번 단계의 목표

**전략:** C+D 혼합형. 핵심 분석은 무료로 열고, 결과 경험 이후 선택형 이메일/구독관리 출시 알림을 받는다. 구독관리 가치는 처음부터 예고하되, 가격표와 결제 버튼은 이해충돌 검토 전까지 노출하지 않는다.

**목표:** 공개 결제 서비스나 Closed Beta 모집이 아니라, 사용자가 브라우저에서 즉시 핵심 분석을 무료로 체험하고 결과 확인 후 선택적으로 구독관리 출시 알림을 남기는 “무료 공개 MVP”를 만든다.

### 1.2 이번 단계에서 하지 않을 것

- 실제 PG 결제 연동
- 서버에 원본 PDF/CSV 저장
- 거래소 API 키 연동
- 빗썸 CSV 추가
- 실시간 시세/알림/매매 신호
- AI 가격 전망/종목 평가
- 또래 수익률 비교
- 실제 PDF 리포트 자동 생성

### 1.3 반드시 지킬 것

- 투자 조언 금지 고지
- 원본 파일/비밀번호/개별 체결 원문 장기 저장 금지
- 사용자가 내 데이터 삭제 가능
- 파싱 실패 시 추정하지 않고 실패 사유 표시
- 표본 부족 시 점수 과장 금지
- 앱 내 모든 주요 카피를 “과거 기록 기반 회고”로 제한

---

## 2. 런칭 게이트 우선순위

| 우선순위 | 게이트 | 상태 | 다음 액션 |
| --- | --- | --- | --- |
| P0 | 창업자 겸업·이해충돌 확인 | 미확인 | 사내 규정 확인 전 공개 유료 출시 금지 |
| P0 | 개인정보/원본 파일 저장 경계 | 부분 구현 | 고객용 보안 안내와 삭제 플로우 검증 |
| P0 | 투자 조언 오인 방지 | 문서/카피 일부 반영 | 앱 전 화면 금지 표현 정적 검사 추가 |
| P0 | 실제 업비트 PDF/CSV 파싱 신뢰성 | PDF 일부 검증, CSV 미해결 | 익명화 실제 샘플 5~10개 수집/회귀 테스트 |
| P1 | 첫 사용자 온보딩 이해도 | 기능 구현 중심 | 파일 업로드 전 신뢰/가치 설명 강화 |
| P1 | 분석 결과 해석 UX | 구현됨 | 위험 카피/과장 수치/표본 부족 상태 QA |
| P1 | 무료 분석 후 출시 알림 전환 | 부분 구현 | 구독관리 출시 알림 CTA는 `EXPO_PUBLIC_WAITLIST_FORM_URL`, 피드백 CTA는 `EXPO_PUBLIC_FEEDBACK_FORM_URL`로 외부 폼 연결 가능 |
| P1 | 웹 트래픽·퍼널 계측 | 부분 구현 | GA4 helper, Google tag bootstrap, 핵심 익명 퍼널 이벤트 연결 완료 |
| P1 | 배포 | 부분 검증 | `npx expo export --platform web` 성공, 배포 플랫폼/도메인 선택 대기 |
| P2 | 결제/구독 | 보류 | 가격표와 결제 버튼은 이해충돌 검토 전까지 노출하지 않는다 |

---

## 3. 2주 런칭 로드맵

### Week 1 — 런칭 안전성/신뢰성 정리

**목표:** 외부 사용자 5~10명에게 링크를 보낼 수 있는 상태로 만든다.

1. 규제·보안 카피 전수 점검
2. 업로드 전 보안 안내 강화
3. 데이터 삭제/로컬 저장 상태 QA
4. 실제 업비트 PDF/CSV 익명화 샘플 회귀 테스트 확대
5. 분석 실패/표본 부족 UX 강화
6. 구독관리 출시 알림 CTA 추가
7. Google Analytics 4 웹 트래픽·퍼널 계측 설계
8. 배포 방식 결정

### Week 2 — 무료 공개 운영 준비

**목표:** 외부 사용자가 즉시 무료 분석을 시작할 수 있게 열고, 최소 이벤트와 선택형 알림 등록으로 퍼널을 확인한다.

1. 배포 환경 오픈
2. 첫 사용자 체크리스트 작성
3. 출시 알림/피드백 폼 연결
4. Google Analytics 4/Google tag 설치와 Tag Assistant 검증
5. 링크를 공개 가능한 범위에서 배포
6. 업로드 성공률/결과 조회/출시 알림 등록률 기록
7. 치명 이슈 수정
8. 유료화 진입 여부 판단

---

## 4. 작업 상세 계획

### Task 1: 런칭 카피 금지 표현 정적 검사 추가

**Objective:** 앱/문서의 고객 노출 카피가 투자 조언·수익 보장으로 오인되지 않도록 정적 검사를 만든다.

**Files:**
- Create: `tests/launch-copy-compliance.test.ts`
- Read/Scan: `src/app/**/*.tsx`, `src/components/**/*.tsx`, `docs/demo/*.md`, `docs/exec-plans/active/*.md`

**Step 1: 금지 표현 목록 정의**

금지 표현 후보:

```text
수익률을 높
수익을 보장
매수하세요
매도하세요
추천 종목
가격 예측
상위 투자자
투자 실력 점수
포트폴리오 비중을 제안
```

**Step 2: 테스트 작성**

- 고객 노출 가능성이 큰 `src/` 파일을 우선 검사한다.
- 문서는 advisory context가 있을 수 있으므로 `금지 표현` 섹션 내부는 예외 처리한다.

**Step 3: 실행**

```bash
node --import tsx --test tests/launch-copy-compliance.test.ts
```

**Expected:** 위험 표현이 있으면 실패.

**Step 4: 필요 시 카피 수정**

투자 조언처럼 보이는 문장은 아래 방식으로 바꾼다.

```text
매수/매도 추천 → 과거 진입/청산 패턴 회고
수익률 개선 → 행동 변화 확인
투자 실력 → 거래 기록에서 관찰된 행동 지표
```

---

### Task 2: 업로드 전 보안·로컬 처리 안내 강화

**Objective:** 사용자가 PDF/CSV와 PDF 비밀번호를 올리기 전에 무엇이 저장되고 저장되지 않는지 명확히 이해하게 한다.

**Files:**
- Modify: `src/components/steps/step-3-data-import.tsx`
- Test: `tests/trade-history-ui.test.ts` 또는 신규 `tests/upload-trust-copy.test.ts`

**Acceptance Criteria:**

업로드 화면에 아래 메시지가 명확히 보여야 한다.

```text
원본 PDF/CSV 파일은 장기 저장하지 않아요.
PDF 비밀번호는 분석 중에만 사용하고 저장하지 않아요.
구독관리에는 분석 요약, 목표, 중복 식별용 fingerprint만 저장해요.
언제든 내 데이터 삭제로 로컬 저장 내용을 지울 수 있어요.
```

**Verification:**

```bash
node --import tsx --test tests/trade-history-ui.test.ts
npm run typecheck
```

---

### Task 3: 데이터 삭제 플로우 고객용 QA

**Objective:** local-first 구독관리에서 저장된 스냅샷/목표/월간 리포트 근거가 삭제되는지 고객 관점으로 검증한다.

**Files:**
- Read: `src/lib/subscription/persistence.ts`
- Modify: 필요 시 `src/components/steps/step-2-analysis.tsx`
- Test: `tests/subscription-persistence.test.ts`, `tests/analysis-screen.test.ts`

**Acceptance Criteria:**

- 저장된 기준선 삭제 버튼 노출
- 클릭 시 localStorage key 삭제
- UI에서 기준선/목표/월간 리포트 저장 상태 초기화
- “원본 파일 삭제”처럼 오해되는 문구 금지. 실제로 저장하지 않는 것은 원본이고 삭제 대상은 요약 스냅샷임을 명확히 표시.

---

### Task 4: 실제 업비트 CSV/PDF 샘플 회귀 테스트 확대

**Objective:** 런칭 전 가장 큰 제품 리스크인 파싱 실패율을 낮춘다.

**Files:**
- Existing: `src/lib/trade-history/*`
- Existing Tests: `tests/*trade*`, `tests/*pdf*`, `tests/*csv*`
- Create if needed: `tests/fixtures/upbit-anonymized/README.md`

**Data Rule:**

- 실제 파일은 커밋하지 않는다.
- 익명화 fixture만 커밋 가능.
- 종목명은 `KRW-ASSET01`처럼 대체.
- 금액/수량은 구조가 유지되도록 스케일링하되 개인 식별 가능성을 제거.
- 계좌, 이메일, 이름, 주문번호 원문은 제거.

**Acceptance Criteria:**

- 익명화 업비트 CSV 샘플 3개 이상
- 익명화 업비트 PDF 텍스트 샘플 2개 이상
- 파서가 실패할 때 실패 사유를 표시
- 조용히 추정하지 않음

---

### Task 5: 분석 결과 화면 “첫 사용자 이해도” 정리

**Objective:** 첫 사용자가 결과 화면에서 점수보다 “내 행동 회고”를 먼저 이해하게 한다.

**Files:**
- Modify: `src/components/steps/step-2-analysis.tsx`
- Test: `tests/analysis-screen.test.ts`

**Acceptance Criteria:**

결과 화면 상단 순서:

1. 투자거울 타입
2. “투자 조언이 아니라 과거 기록 기반 회고” 고지
3. 가장 큰 행동 인사이트 1~2개
4. F점수 상세
5. 기준선 저장/다음 업로드 비교
6. 월간 리포트 미리보기

**Do Not:**

- 수익률을 대표 KPI로 올리지 않는다.
- 특정 종목 손익을 자극적으로 보여주지 않는다.

---

### Task 6: 무료 공개 후 구독관리 출시 알림 CTA 추가

**Objective:** 사용자가 핵심 분석을 무료로 경험한 뒤, 월간 리포트·목표 추적·다음 업로드 비교에 관심이 있으면 선택적으로 출시 알림을 남기게 한다.

**Files:**
- Modify: `src/app/subscription.tsx`
- Modify or Create: `src/app/index.tsx` 또는 `src/components/*`
- Test: `tests/subscription-page.test.ts`

**Recommended CTA:**

```text
무료로 분석 시작하기
구독관리 출시 알림 받기
월간 리포트가 준비되면 알려드릴게요
```

**Implementation Option A:** mailto 링크

- 빠름
- 별도 서버 불필요
- MVP 초기 검증에 적합

**Implementation Option B:** Google Form / Tally 링크

- 응답 정리 쉬움
- 개인정보 수집 고지 필요

**Recommended Default:** Google Form/Tally URL은 사용자가 정하면 `EXPO_PUBLIC_WAITLIST_FORM_URL`에 연결한다. 그 전까지는 CTA 클릭 시 관심 이벤트만 익명 계측하고, 이메일 원문은 GA로 보내지 않는다.

---

### Task 7: Google Analytics 4 웹 트래픽·퍼널 계측 추가

**Objective:** 무료 공개 MVP 오픈 후 방문자 수, 시작 클릭, 업로드 시도, 파싱 성공/실패, 결과 조회, 구독관리 출시 알림 관심을 확인할 수 있게 Google Analytics 무료 도구를 설치한다.

**Source:** Google Analytics는 웹/앱 데이터를 이벤트 기반으로 수집하는 현재 세대 Analytics이며, Google tag(gtag.js)는 Analytics 등 Google 측정 제품에 데이터를 보내기 위해 모든 추적 페이지에 설치하는 태그다.

**Files:**
- Modify or Create: Expo Web analytics bootstrap 파일
- Modify if needed: `src/app/_layout.tsx` 또는 웹 전용 entry
- Test: analytics helper가 민감 데이터를 event payload에 넣지 않는지 검증하는 테스트

**Events:**

```text
page_view
start_click
diagnosis_complete
upload_attempt
parse_success
parse_failed
result_view
subscription_preview_click
waitlist_interest_click
delete_local_data_click
```

**Privacy/Data Rule:**

- 원본 PDF/CSV, 파일명, PDF 비밀번호, 개별 체결 원문, 계좌/고객 식별자, 종목별 금액/수량을 GA로 보내지 않는다.
- 이벤트명, 화면명, source format(`pdf`/`csv`), 성공/실패 여부, 실패 사유 코드처럼 개인 식별성이 낮은 값만 보낸다.
- 이메일 수집은 GA 이벤트와 분리하고, GA에는 이메일 원문이나 해시를 보내지 않는다.
- GA Measurement ID는 공개 식별자이지만 환경변수/설정으로 분리하고, secret처럼 취급하지 않는다.

**Implementation Notes:**

- 무료 공개 전에는 GA4 속성과 Web data stream을 만들고 Measurement ID(`G-...`)를 확보한다.
- Expo Web에서 client-side only로 로드한다.
- 개발/테스트 환경에서는 실제 전송을 비활성화하거나 debug flag로 분리한다.
- 설치 후 Google Tag Assistant 또는 GA DebugView로 page_view와 핵심 이벤트 수신을 확인한다.

**Verification:**

```bash
npm test
npm run lint
npm run typecheck
```

Manual QA:

```text
1. 무료 공개 URL 접속
2. Google Tag Assistant에서 tag 감지 확인
3. 시작 클릭 → 업로드 시도 → 결과 조회 → 출시 알림 클릭 이벤트 확인
4. 이벤트 payload에 파일명/종목/금액/비밀번호/이메일이 없는지 확인
```

---

### Task 8: 배포 방식 결정 및 환경 분리

**Objective:** localhost 데모가 아니라 외부 사용자가 접속 가능한 웹 URL을 만든다.

**Options:**

| 옵션 | 장점 | 리스크 |
| --- | --- | --- |
| Vercel/Netlify web export | 빠르고 공유 쉬움 | Expo Web 설정 확인 필요 |
| Expo hosting/EAS Update | Expo 생태계 적합 | 현재 웹 우선 운영에는 다소 무거울 수 있음 |
| GitHub Pages | 무료 | 라우팅/빌드 설정 번거로움 |

**Recommended:** Vercel 또는 Netlify에 web build 배포.

**Before Implementation:**

- Expo v57 문서 확인
- `CLAUDE.md` 확인
- 빌드 명령 확인
- 환경변수/시크릿 없음 확인

**Verification:**

```bash
npm test
npm run lint
npm run typecheck
npm run web 또는 web export build 명령
```

---

### Task 9: 런칭 피드백 운영 문서 작성

**Objective:** 기능 개발이 아니라 실제 고객 반응을 기록할 틀을 만든다.

**Files:**
- Create: `docs/launch/v1.0_free_public_mvp_feedback_tracker.md`

**Fields:**

```text
참여자 유형
거래소 사용 여부
PDF/CSV 업로드 성공 여부
분석 결과 이해도
투자 조언 오해 여부
가장 유용한 카드
가장 불안한 부분
2회차 업로드 의향
월간 리포트 출시 알림 의향
구독관리 출시 알림/가격 의향 조사 동의 여부
필수 개선 요청
```

---

## 5. 런칭 전 최종 체크리스트

### Product

- [ ] 첫 화면에서 “회고 도구”로 이해된다.
- [ ] 업로드 전 보안 안내가 명확하다.
- [ ] 분석 결과에서 가장 중요한 행동 인사이트가 10초 안에 보인다.
- [ ] 기준선/2회차 비교 가치가 이해된다.
- [ ] 구독 CTA가 “더 많은 점수 잠금 해제”가 아니라 “변화 관리”로 보인다.

### Data & Reliability

- [ ] 실제 익명화 CSV 샘플 3개 이상 통과.
- [ ] 실제 익명화 PDF 텍스트 샘플 2개 이상 통과.
- [ ] 실패 케이스가 조용히 성공 처리되지 않는다.
- [ ] 중복 업로드가 지표를 부풀리지 않는다.
- [ ] 교차 기간 청산이 원가 연결용으로만 보정된다.

### Security & Privacy

- [ ] 원본 PDF/CSV 장기 저장 없음.
- [ ] PDF 비밀번호 저장 없음.
- [ ] 개별 체결 원문 장기 저장 없음.
- [ ] localStorage 저장 key와 저장 필드가 문서화되어 있다.
- [ ] 내 데이터 삭제가 실제 저장 요약을 지운다.

### Analytics

- [ ] GA4 속성과 Web data stream이 준비되어 있다.
- [ ] Google tag가 무료 공개 웹 URL에서 로드된다.
- [ ] page_view와 핵심 퍼널 이벤트가 수집된다.
- [ ] GA 이벤트에 원본 파일명, 거래 원문, 종목별 금액/수량, PDF 비밀번호, 이메일이 포함되지 않는다.
- [ ] 개발/테스트 환경에서는 실제 GA 전송을 막거나 분리한다.

### Compliance

- [ ] 투자 조언 금지 고지 노출.
- [ ] 매수/매도/종목 추천 표현 없음.
- [ ] 수익률 개선 보장 표현 없음.
- [ ] 점수와 수익률 인과 주장 없음.
- [ ] 창업자 겸업·이해충돌 확인 전 유료 공개 출시 금지.

### Launch Ops

- [ ] 외부 접속 가능한 URL 준비.
- [ ] 피드백 수집 폼 준비.
- [ ] 무료 공개 URL을 공유할 1차 채널 리스트 준비.
- [ ] 업로드 실패 접수 채널 준비.
- [ ] 수동 운영/응답 템플릿 준비.

---

## 6. 추천 실행 순서

### 바로 다음 작업

1. **Task 1: 런칭 카피 금지 표현 정적 검사 추가**
2. **Task 2: 업로드 전 보안·로컬 처리 안내 강화**
3. **Task 3: 데이터 삭제 플로우 고객용 QA**

이 3개는 기능보다 런칭 신뢰와 안전성에 직접 연결된다.

### 그 다음

4. 실제 익명화 샘플 회귀 테스트 확대
5. 구독관리 출시 알림 CTA 추가
6. Google Analytics 4 웹 트래픽·퍼널 계측 추가
7. 배포 방식 결정
8. 피드백 운영 문서 작성

---

## 7. 의사결정이 필요한 항목

### A. 무료 공개 후 출시 알림 CTA 방식

추천 기본값:

```text
mailto: 또는 임시 Google Form/Tally
```

결정 필요:

- 수집할 이메일 주소
- 개인정보 수집 동의 문구
- 응답 저장 위치

### B. Google Analytics 4 설정

추천 기본값:

```text
GA4 Web data stream + Google tag(gtag.js)
```

결정 필요:

- GA4 Measurement ID(`G-...`)
- 운영/개발 환경 분리 방식
- 수집할 이벤트명과 실패 사유 코드 목록
- 쿠키/Analytics 사용 고지 문구 위치

### C. 외부 배포 방식

추천 기본값:

```text
Vercel 또는 Netlify 웹 배포
```

결정 필요:

- 도메인 사용 여부
- 공개 범위: 링크 아는 사람만 / 완전 공개
- 지원 결과 발표 전 노출 범위

### D. 겸업·이해충돌 확인

출시 전 최우선 게이트:

```text
사내 취업규칙·윤리강령에서 겸업/외부활동/영리행위/이해충돌 조항 확인
```

확인 전에는:

- 공개 유료 결제 금지
- 빗썸 데이터 직접 지원 금지
- 고객 데이터 수집 범위 최소화

---

## 8. 오늘 기준 결론

### 8.1 진행 로그

- 2026-09-03: 첫 런칭 방향을 고객 설치형이 아닌 **웹 MVP**로 확정. 계획 문서 상단에 “브라우저 안에서 원본 파일을 우선 처리하고 서버 장기 저장을 피하는 구조”라고 명시했다.
- 2026-09-03: `tests/launch-copy-compliance.test.ts` 추가. 고객 노출 화면에서 투자 조언·수익 보장으로 오인될 수 있는 금지 표현을 정적으로 검사한다.
- 2026-09-03: 업로드 화면에 “웹에서 바로 분석”, 원본 PDF/CSV 장기 미저장, PDF 비밀번호 미저장, 구독관리 저장 범위, 내 데이터 삭제 안내를 추가했다.
- 2026-09-03: 분석 화면의 삭제 CTA를 “브라우저 저장 요약 삭제하기”로 변경하고, 삭제 대상이 원본 PDF/CSV가 아니라 기준선·목표·월간 리포트 미리보기 근거로 쓰는 브라우저 저장 요약임을 명확히 했다.
- 2026-09-03: 실제 업비트 내보내기와 가까운 **익명화 CSV/PDF 회귀 fixture**를 추가했다. CSV는 `거래종류`, `거래단가` 헤더 변형을, PDF는 `2026. 08. 18.`처럼 점 뒤 공백이 있는 날짜 포맷을 검증한다.

- 2026-09-03: 런칭 전략을 **C+D 혼합형**으로 재확정했다. Closed Beta 모집보다 무료 공개 MVP를 우선하고, 핵심 분석은 무료로 먼저 사용하게 한 뒤 구독관리 출시 알림으로 후속 관심을 수집한다. 가격표와 결제 버튼은 이해충돌 검토 전까지 노출하지 않는다.

- 2026-09-04: 무료 공개 MVP 운영에 필요한 **Google Analytics 4/Google tag 기반 웹 트래픽·퍼널 계측**을 계획에 추가했다. 단, GA에는 원본 파일명, 거래 원문, 종목별 금액/수량, PDF 비밀번호, 이메일을 보내지 않고 page_view와 익명 이벤트/실패 사유 코드만 수집한다.

- 2026-09-04: `src/lib/analytics.ts`와 `tests/analytics.test.ts`를 추가해 GA4 이벤트 helper를 TDD로 구현했다. Measurement ID가 없거나 production web이 아니면 no-op이며, 민감 payload key를 제거하고 `_layout.tsx`에서 Google tag bootstrap을 client-side로만 초기화한다.
- 2026-09-04: 무료 공개 MVP 핵심 퍼널 이벤트를 실제 화면에 연결했다. `start_click`, `upload_attempt`, `parse_success`, `parse_failed`, `result_view`, `subscription_preview_click`, `waitlist_interest_click`, `delete_local_data_click`을 민감정보 없는 payload로만 전송한다. `EXPO_PUBLIC_WAITLIST_FORM_URL`이 있으면 출시 알림 CTA가 외부 폼을 열고, 없으면 관심 클릭만 익명 기록한다. `npx expo export --platform web`으로 정적 web export도 검증했다.
- 2026-09-04: 첫 화면 CTA를 무료 공개 MVP용으로 정리했다. `무료로 내 거래 습관 확인하기`, `PDF/CSV 바로 올리기`, 브라우저 분석/원본 장기 미저장 문구를 노출하고 `start_click`으로 CTA별 유입을 계측한다. 분석 결과 화면에는 `EXPO_PUBLIC_FEEDBACK_FORM_URL` 기반 피드백 CTA를 추가해, URL이 있으면 외부 폼을 열고 없으면 클릭 관심만 익명 기록한다.

### 8.2 현재 기준 결론

데모는 충분하다. 다음 스프린트의 이름은 **Free Public MVP Launch Readiness**가 되어야 한다.

가장 먼저 할 일은 새 기능이 아니라 다음 3개다.

1. **카피/규제 안전장치 자동화**
2. **업로드 신뢰 UX 강화**
3. **로컬 데이터 삭제/저장 경계 검증**

이 3개가 끝나야 실제 사용자에게 무료 공개 링크를 보낼 수 있다.
