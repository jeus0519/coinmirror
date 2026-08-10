# ARCHITECTURE

앱 전체 구조의 최상위 지도. 도메인/레이어 상세는 각 도메인 폴더의 README나 `docs/FRONTEND.md`를 참고.

## 레이어 (고정, 강제됨)

```
UI (src/app, src/components)
  → Stores (src/stores)          # Zustand — 클라이언트 상태
  → Services/Lib (src/lib)       # Supabase 클라이언트, 도메인 로직, 유틸
  → Supabase (원격)               # DB, Auth, Storage
```

- 의존 방향은 위→아래로만 흐른다. UI가 Supabase를 직접 호출하지 않고 `src/lib`를 거친다.
- 레이어를 건너뛰는 import(예: 컴포넌트에서 `@supabase/supabase-js` 직접 import)는 금지.
- 이 규칙은 아직 린트로 강제되지 않음 — 위반이 반복되면 커스텀 ESLint 규칙으로 승격할 것 (`docs/QUALITY_SCORE.md` 참고).

## 폴더 구조

```
src/
├── app/            # expo-router 라우트 (파일 = 화면)
├── components/
│   └── ui/         # Reusables 컴포넌트 (CLI로 추가, 직접 크게 고치지 않음)
├── stores/         # Zustand 스토어 (도메인별 1파일)
├── lib/            # supabase.ts, utils.ts, theme.ts, 도메인 서비스
├── hooks/          # 커스텀 훅
└── constants/      # 정적 상수
```

## 도메인 경계

현재는 단일 도메인(코인 투자 회고)으로 시작. 도메인이 늘어나면(예: 커뮤니티, 알림) 이 문서에 도메인별 서브섹션을 추가하고 `docs/product-specs/`에 스펙을 먼저 작성한다.

## 관련 문서

- 화면/컴포넌트 컨벤션 → [docs/FRONTEND.md](docs/FRONTEND.md)
- 디자인 시스템 → [docs/DESIGN.md](docs/DESIGN.md)
- 보안/시크릿 → [docs/SECURITY.md](docs/SECURITY.md)
