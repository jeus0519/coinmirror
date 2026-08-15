# FRONTEND

Expo Router + Nativewind + Reusables + Zustand 컨벤션.

## 화면 (Routing)

- 화면은 `src/app/`에 파일 기반 라우팅으로 추가한다. 새 화면 추가 시 `/new_screen` 스킬 사용.
- 현재 온보딩/데모는 `src/app/index.tsx`의 6단계 스테퍼다. 장기 앱 IA를 도입할 때 `src/app/_layout.tsx`와 새 탭 레이아웃을 함께 설계한다.

## 컴포넌트

- 기본 UI 요소는 항상 Reusables 먼저 찾는다: `npx @react-native-reusables/cli@latest add <component>`
- `src/components/ui/`는 CLI가 생성한 코드다. 프로젝트 전역 규칙을 바꿔야 하면 CLI로 재생성하거나 `components.json` 설정을 바꾸는 쪽을 우선 고려하고, 개별 파일 땜질은 지양.
- 단계형 화면 조합은 `src/components/steps/`, 공용 조합은 `src/components/`, 재사용 기본 요소는 `src/components/ui/`.

## 스타일링

- Nativewind(Tailwind) 클래스 우선. 인라인 `style` prop은 Nativewind로 표현 불가능한 경우에만.
- 색상은 `tailwind.config.js`의 CSS 변수 토큰(`bg-background`, `text-foreground` 등)을 쓴다. 하드코딩 hex 금지 — 다크모드가 깨진다.
- 커스터마이징 방법: [Reusables Customization 문서](https://reactnativereusables.com/docs/customization) 참고.

## 상태관리

- 화면을 넘나드는 상태는 Zustand 스토어(`src/stores/*.ts`)로. 현재 패턴 예시는 `src/stores/use-flow-store.ts`.
- 스토어 1개 = 도메인 1개. 스토어 간 직접 참조보다 컴포넌트에서 조합.
- 화면 내부에서만 쓰는 state(입력값, 토글 등)는 `useState`로 충분 — Zustand로 승격하지 말 것.
- 서버 상태(Supabase 데이터)는 별도 캐싱 레이어 없이 시작. 캐싱/동기화 문제가 실제로 발생하면 이 문서에 결정을 기록하고 라이브러리 도입 검토(예: TanStack Query).

## 폼/입력 검증

- 사용자 입력 경계(폼 제출, Supabase 응답 파싱)에서는 반드시 검증한다. 라이브러리는 자유(zod 권장하지만 강제 아님) — "검증 없이 그냥 믿고 쓰기"만 금지.

## 행동심리학 UI 원칙

이 앱의 핵심은 "투자 회고 + 행동 패턴 인식"이다. 화면을 새로 만들 때 다음을 점검:

- 설문 답변과 거래 실측을 판단 없이 비교하고 있는가
- 점수 방향이 높을수록 양호하도록 일관적인가
- 즉흥적 매매를 부추기는 UI(실시간 시세 강조 등)를 만들고 있지는 않은가
- 상세 배경은 [docs/design-docs/core-beliefs.md](design-docs/core-beliefs.md) 참고
