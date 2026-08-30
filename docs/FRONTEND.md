# FRONTEND

Expo Router + Nativewind + Reusables + Zustand 컨벤션. **MVP 검증은 웹 우선**으로 진행한다.

## 화면 (Routing)

- 화면은 `src/app/`에 파일 기반 라우팅으로 추가한다. 새 화면 추가 시 `/new_screen` 스킬 사용.
- 현재 온보딩/데모는 `src/app/index.tsx`의 6단계 스테퍼다. `npm run web`에서 먼저 검증하고, 네이티브 앱 IA는 CSV 파서/엔진 연결 후 후속으로 설계한다.

## 웹 우선 결정

- 2026-08-25 이후 신규 MVP 화면은 브라우저 동작을 1차 완료 기준으로 본다.
- Expo 네이티브 실행은 회귀 확인용이며, iOS/Android 네이티브 폴더는 직접 수정하지 않는다.
- 이메일 리포트/공유 카드/PDF·CSV 거래내역 업로드 같은 진입·전환 기능은 모바일 앱보다 웹 전환 퍼널에서 먼저 검증한다.
- 웹 목업의 서비스명은 한글 `코인미러`를 우선 사용한다. 문장은 짧고 친근하게 쓰며, PDF/CSV 선택형 업로드와 비밀번호 회피 안내를 첫 경험에 노출한다.

## 컴포넌트

- 기본 UI 요소는 항상 Reusables 먼저 찾는다: `npx @react-native-reusables/cli@latest add <component>`
- `src/components/ui/`는 CLI가 생성한 코드다. 프로젝트 전역 규칙을 바꿔야 하면 CLI로 재생성하거나 `components.json` 설정을 바꾸는 쪽을 우선 고려하고, 개별 파일 땜질은 지양.
- 단계형 화면 조합은 `src/components/steps/`, 공용 조합은 `src/components/`, 재사용 기본 요소는 `src/components/ui/`.

## 스타일링

- Nativewind(Tailwind) 클래스 우선. 인라인 `style` prop은 Nativewind로 표현 불가능한 경우에만.
- 색상은 `tailwind.config.js`의 CSS 변수 토큰(`bg-background`, `text-foreground` 등)을 쓴다. 하드코딩 hex 금지 — 다크모드가 깨진다.
- 현재 라이트 목업 톤은 Wise 계열의 라임 포인트(`#9fe870`)와 큰 라운드 카드/필 버튼을 기준으로 한다. Expo 토큰(`src/global.css`, `src/lib/theme.ts`)과 HTML 데모(`docs/coinmirror_demo.html`)를 함께 맞춘다.
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
