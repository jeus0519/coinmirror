# 001 — 코인미러 MVP 목업 (4단계 스테퍼)

**상태**: 진행 중 — UI 목업 완료, 실데이터 연결 전
**최종 갱신**: 2026-08-10

## 지금까지 한 일

### 1. 하네스 셋업

- Expo SDK 57 + expo-router 프로젝트 부트스트랩 (Nativewind, React Native Reusables, Zustand, `@supabase/supabase-js` 설치)
- `CLAUDE.md`(목차형, ~80줄), `docs/` 구조, Skills 5개(`/commit` `/review` `/deploy` `/cleanup` `/new_screen`), Hooks 4개(env 보호 · 네이티브 폴더 보호 · 저장 시 포맷팅 · 세션 종료 요약) 구성
- 프로젝트명을 **coinmirror(코인미러)** 로 확정 — `app.json`/`package.json`/`CLAUDE.md` 전체 반영
- `docs/`에 코인미러 기준 문서 4개 정리: `v1.0_expo_app_development_prd.md`, `v6.0_cto_business_proposal.md`, `v1.0_personalized_score_system_spec.md`, `v1.0_regulatory_and_technical_risks_spec.md`(원래 자매 프로젝트 "Alpha Pulse" 문서였던 걸 발견해서 coinmirror 기준으로 재작성)

### 2. UI 목업 1차 — 4탭 구조 (폐기됨)

- 홈/기록/리포트/설정 4탭 + PRD §7.2 다크네이비/민트 팔레트로 처음 제작
- 이후 `docs/coinmirror_demo.html`(별도로 존재하던 웹 프로토타입)을 발견, 그 구조를 기준으로 삼기로 결정하면서 전면 재작업

### 3. UI 목업 2차 — 4단계 스테퍼 (현재 상태)

`docs/coinmirror_demo.html` 구조를 그대로 이식:

- 상단 `StepNav` + `src/app/index.tsx`에서 `currentStep`으로 4개 패널 전환 (탭 대신 데모와 동일한 순차 스테퍼)
- 라이트+그린 팔레트로 전면 교체 (데모 원본 색상값)
- **1단계 시작하기**: 히어로, 샘플체험/CSV업로드(mock)/직접입력 3-way 진입점, 6지표 티저, "coinmirror가 하지 않는 것" 6개, 진행방식 안내
- **2단계 스코어·분석**: 서술 요약, 거래개요 4칸, `MetricCard` 6개(M1~M6, 측정중 상태 포함), 구독 잠금 지표 3개(토글로 잠금/해제 데모), 시간대/요일 분포, 종목별 거래대금·최근 청산 표
- **3단계 목표·진행**: 목표 입력폼, 진행현황 카드, 주간 추이, 4문항 워크시트 — **`AsyncStorage`로 실제 영속 저장**(이 프로젝트에서 유일하게 mock이 아닌 부분)
- **4단계 정보·이벤트**: 종목정보/거래소이벤트 필터 카드, 공지 게시판 링크
- 검증: `tsc --noEmit` / `npm run lint` / `reusables doctor` 전부 통과, 웹 프리뷰로 1→2→3→4단계 전체 클릭 확인(콘솔 에러 없음), 워크시트는 새로고침 후에도 값 유지 확인

## 현재 상태 스냅샷

```
src/app/
  _layout.tsx            # Stack (index, entry/new, entry/[id])
  index.tsx               # 4단계 스테퍼 루트
  entry/new.tsx            # 수동 입력 폼 (보조 경로)
  entry/[id].tsx           # 기록 상세 (읽기전용)
src/components/steps/      # step-nav, step-1~4
src/lib/
  mock-data.ts mock-metrics.ts mock-goals.ts mock-market-info.ts format.ts
  supabase.ts theme.ts utils.ts
src/stores/
  use-flow-store.ts        # 현재 사용 중 (스테퍼 상태)
  use-journal-store.ts     # 1차 목업 잔재, 아직 미사용(다음 단계에서 정리 또는 재활용)
```

- **git 커밋 0개.** 이 세션에서 만든 것 전부 워킹트리에 uncommitted 상태 (`git status --short` 88줄).
- **전부 mock 데이터.** 실제 DB, API, 계산 로직 없음 — 워크시트(3단계)만 예외.
- 웹 프리뷰로만 확인함. iOS/Android 시뮬레이터·Expo Go에서는 아직 안 띄워봄.

## 내일 시작 전에 확인/정리하면 좋은 것

1. **백엔드 소스 확보 여부** — `docs/coinmirror_demo.html`이 호출하는 `/api/analyze` 등을 구현한 백엔드(주석의 `build_static.py`)가 실제로 어딘가 있다면 공유받아야 M1~M6 계산 로직·FIFO 손익 계산을 그대로 이식할 수 있음. 없다면 이번에 새로 설계해야 함 — 어느 쪽인지에 따라 다음 작업 규모가 크게 달라짐.
2. **커밋 여부** — 지금까지 전부 미커밋. 실제 작업 시작 전에 한 번 커밋해두는 걸 권장(되돌릴 기준점 확보, `/commit` `/review` 스킬도 그때부터 의미 있게 동작).
3. **다크모드 팔레트 검토** — 데모에 라이트만 있어서 다크는 같은 그린 계열로 임의로 파생해둔 값. 그대로 쓸지 조정할지 결정 필요.
4. **`docs/product-specs/001-trade-journal.md`, `docs/QUALITY_SCORE.md` 갱신** — 아직 1차(4탭) 구조 기준으로 쓰여 있어 현재 구조(4단계 스테퍼)와 안 맞음.
5. **실데이터 연결 우선순위 결정** — 다음 중 어디부터 할지 정해야 계획을 세울 수 있음:
   - (a) CSV 실제 파싱 (papaparse + 업비트 컬럼 매핑 + FIFO 손익 계산 + M1~M6 실계산)
   - (b) `expo-sqlite`로 로컬 영속화 (Trade/JournalEntry 저장)
   - (c) 목표·진행 계산을 mock → 실계산으로 전환
   - (d) 구독 결제(RevenueCat) 연동
   - 자연스러운 순서는 (a)→(b): 분석 결과가 있어야 저장할 대상이 생김.
6. **브랜딩 에셋** — 앱 아이콘/스플래시가 여전히 Expo 기본 이미지. "c" 로고마크는 코드 안에 텍스트로만 임시 처리됨.
7. **EAS 빌드 설정 없음** — `eas.json`이 없어서 `/deploy` 스킬은 아직 실제로 쓸 수 없음.

## 참고

- Claude Code plan mode로 세운 계획 2건은 `C:\Users\Junsung\.claude\plans\splendid-inventing-forest.md`(이 저장소 밖, 세션 종료 시 사라질 수 있음)에 있었고, 핵심 내용은 이 문서로 옮겨둠.
- 근거 문서: `docs/v1.0_expo_app_development_prd.md`, `docs/coinmirror_demo.html`, `docs/v1.0_personalized_score_system_spec.md`, `docs/v1.0_regulatory_and_technical_risks_spec.md`, `docs/v6.0_cto_business_proposal.md`
