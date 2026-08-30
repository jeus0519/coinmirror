# 코인미러 (coinmirror)

사용자의 과거 거래 내역을 거울처럼 비춰 주는 투자 행동 회고 앱. 매수/매도를 추천하지 않고, 온보딩 설문 1회와 거래소 데이터로 반복 행동·자기인식 차이·원칙 준수를 시각화한다. 반복 수동 입력은 핵심 스코어의 필수 조건이 아니다. 상세 제품 정의는 [docs/v2.0_coinmirror_product_prd.md](docs/v2.0_coinmirror_product_prd.md) 참고.

**이 파일은 지도(map)다, 백과사전이 아니다.** 여기 없는 답은 아래 링크된 `docs/`에 있다. 없으면 만들고 여기에 링크를 추가한다.

## 스택

- Expo (SDK 57) + Expo Router (`src/app/`, 파일 기반 라우팅) — **웹 우선**: MVP 검증은 `npm run web` 기준, 네이티브 앱은 후속
- Nativewind (Tailwind) + [React Native Reusables](https://reactnativereusables.com) (shadcn/ui의 RN 포트)
- Zustand (클라이언트 상태) · Supabase (`@supabase/supabase-js`) (DB/Auth)
- TypeScript strict
- 리포트 채널: 이메일 우선, 텔레그램/메신저는 후속 옵션
- 첫 분석 UX: 설문 → 예상 투자거울 타입 → PDF/CSV 거래내역 업로드 → 기록된 타입/갭 공개

## 불변식 (강제됨 — 구현 방법은 자유, 아래 규칙만 지키면 됨)

1. **`.env`는 절대 커밋/하드코딩하지 않는다.** 값은 `.env`, 형식은 `.env.example`. (강제: `env-protection` 훅)
2. **`ios/`, `android/` 네이티브 폴더는 직접 수정하지 않는다.** `expo prebuild` 산출물이다. 네이티브 설정은 `app.json`/config plugin으로. (강제: `native-folder-protection` 훅)
3. UI → Stores → Lib/Services → Supabase 순으로만 의존한다. 컴포넌트에서 Supabase 직접 호출 금지. (상세: [ARCHITECTURE.md](ARCHITECTURE.md))
4. 기본 UI 요소는 직접 만들기 전에 Reusables CLI로 먼저 찾는다.
5. 컴포넌트를 넘나드는 상태는 Zustand 스토어로, 화면 로컬 state는 `useState`로 — 스토어 승격 남발 금지.
6. 사용자 입력/외부 응답(Supabase 등) 경계에서는 반드시 검증한다. 라이브러리는 자유.
7. 새 Supabase 테이블은 RLS를 기본 활성화한다. `service_role` 키는 클라이언트에 절대 두지 않는다.
8. 커밋 전 lint/format을 통과시킨다. (강제: `format-on-save` 훅 + `/commit` 스킬)

## 문서 지도 (docs/)

| 문서                                                                                                                           | 언제 보나                                |
| ------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------- |
| [docs/v1.0_documentation_map.md](docs/v1.0_documentation_map.md)                                                               | 어떤 문서가 현재 기준인지 판단할 때      |
| [docs/v2.0_coinmirror_product_prd.md](docs/v2.0_coinmirror_product_prd.md)                                                     | 제품 범위·사용자 흐름·요금제·로드맵      |
| [docs/product-specs/v5.0_score-system-and-onboarding-survey.md](docs/product-specs/v5.0_score-system-and-onboarding-survey.md) | 설문·스코어 계산·최소 표본 기준          |
| [docs/v7.0_business_proposal.md](docs/v7.0_business_proposal.md)                                                               | 사업 모델·전환 구조·KPI                  |
| [docs/v2.0_regulatory_and_technical_risks_spec.md](docs/v2.0_regulatory_and_technical_risks_spec.md)                           | 규제·데이터·보안·출시 게이트             |
| [ARCHITECTURE.md](ARCHITECTURE.md)                                                                                             | 레이어/폴더 구조가 헷갈릴 때             |
| [docs/FRONTEND.md](docs/FRONTEND.md)                                                                                           | 화면/컴포넌트/상태관리 컨벤션            |
| [docs/DESIGN.md](docs/DESIGN.md)                                                                                               | 디자인 시스템, Reusables 커스터마이징    |
| [docs/PRODUCT_SENSE.md](docs/PRODUCT_SENSE.md)                                                                                 | "이 기능이 제품 방향에 맞나?" 판단할 때  |
| [docs/PLANS.md](docs/PLANS.md) → [exec-plans/](docs/exec-plans/)                                                               | 여러 세션에 걸친 작업 계획/진행상황      |
| [docs/QUALITY_SCORE.md](docs/QUALITY_SCORE.md)                                                                                 | 어느 영역이 부실한지                     |
| [docs/SECURITY.md](docs/SECURITY.md)                                                                                           | 시크릿, RLS, 네이티브 폴더 규칙 상세     |
| [docs/RELIABILITY.md](docs/RELIABILITY.md)                                                                                     | 에러 처리/오프라인 기준                  |
| [docs/design-docs/](docs/design-docs/index.md)                                                                                 | 제품의 핵심 신념과 근거                  |
| [docs/product-specs/](docs/product-specs/index.md)                                                                             | 개별 기능 스펙                           |
| [docs/references/](docs/references/)                                                                                           | 외부 라이브러리(Expo SDK 등) 버전별 참고 |

## Skills

| 커맨드        | 용도                                                             |
| ------------- | ---------------------------------------------------------------- |
| `/commit`     | 변경사항 확인 → lint/typecheck → 커밋 메시지 작성 → 커밋         |
| `/review`     | 현재 diff를 불변식/컨벤션 기준으로 리뷰                          |
| `/deploy`     | EAS Build/Update 배포 절차 안내 및 실행                          |
| `/cleanup`    | 엔트로피 점검 — 오래된 문서, 안 쓰는 코드, QUALITY_SCORE.md 갱신 |
| `/new_screen` | 새 화면 스캐폴딩 (라우트 + 스펙 문서 확인)                       |

각 스킬 상세는 `.claude/skills/<이름>/SKILL.md` 참고.

## Hooks (자동 강제, 세부: `.claude/settings.json`)

- `.env` 읽기/수정 시 확인 요청 (env-protection)
- `ios/`, `android/` 폴더 수정 차단 (native-folder-protection)
- 파일 수정 후 Prettier 자동 포맷 (format-on-save)
- 세션 종료 시 변경 요약 출력 (session-summary)

## 개발 명령어

```bash
npm start              # Expo 개발 서버
npm run android        # Android
npm run ios            # iOS (macOS 필요)
npm run web            # 웹 프리뷰
npm run lint           # expo lint
npx @react-native-reusables/cli@latest add <component>   # UI 컴포넌트 추가
npx @react-native-reusables/cli@latest doctor            # 셋업 점검
```

## 새 작업 시작 전 체크리스트

1. 관련 스펙이 `docs/product-specs/`에 있는지 확인, 없으면 먼저 작성
2. 여러 세션이 걸릴 작업이면 `docs/exec-plans/active/`에 계획 작성
3. 화면 작업이면 `/new_screen`, 커밋 전이면 `/commit`
4. 완료 후 `docs/QUALITY_SCORE.md`나 관련 문서가 낡지 않았는지 확인 (또는 `/cleanup`)

## 알아둘 것

- `.claude/settings.json`에 Expo 공식 Claude 플러그인(`expo@claude-plugins-official`)이 활성화되어 있다 — Expo 관련 기능이 겹치면 이 플러그인이 우선일 수 있다.
- `AGENTS.md`는 Expo 템플릿이 남긴 파일로, "코드 쓰기 전 버전별 공식 문서 확인" 경고를 담고 있다. 내용은 [docs/references/expo-sdk-notes.md](docs/references/expo-sdk-notes.md)에 흡수했다.
- 2026-08-26 제품 결정: 업비트 고객센터 PDF가 주요 업로드 포맷이다. PDF/CSV 거래내역은 동일한 RawExecution → Phase 1 엔진 → 투자거울 타입 파이프라인을 탄다.
