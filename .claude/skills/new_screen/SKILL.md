---
name: new_screen
description: expo-router 규칙에 맞는 새 화면을 스캐폴딩한다. 사용자가 "/new_screen" 또는 새 화면/탭/페이지를 만들어달라고 할 때 사용.
---

# /new_screen

## 시작 전

1. `docs/product-specs/index.md`에 이 화면에 대한 스펙이 있는지 확인한다. 없으면 짧게라도 먼저 작성한다 (목표/범위/비범위 3줄이면 충분 — MVP 우선).
2. 이 화면이 탭인지, 탭 안의 서브 화면인지, 모달인지 결정하고 `src/components/app-tabs.tsx`(탭 구조)와 `src/app/_layout.tsx`를 확인한다.

## 스캐폴딩

1. `src/app/<route>.tsx` 생성. 파일명이 곧 라우트다 (expo-router 파일 기반 라우팅).
2. 필요한 UI 프리미티브는 새로 만들기 전에 Reusables에 있는지 확인:
   ```bash
   npx @react-native-reusables/cli@latest add <component>
   ```
3. 화면 전용 조합 컴포넌트는 `src/components/`에, 재사용 프리미티브는 `src/components/ui/`에 둔다 (직접 수정 대상 아님).
4. 화면을 넘나드는 상태가 필요하면 `src/stores/`에 Zustand 스토어 추가 (패턴: `use-journal-store.ts` 참고). 화면 로컬 상태는 `useState`로 충분.
5. Supabase 데이터가 필요하면 `src/lib/supabase.ts` 클라이언트를 통해서만 접근한다 — 컴포넌트에서 `@supabase/supabase-js`를 직접 import하지 않는다.
6. 스타일은 Nativewind 클래스 + 기존 색상 토큰(`bg-background`, `text-foreground` 등)만 사용.

## 완료 후

- 실제로 앱을 띄워서 화면이 렌더링되는지 확인한다 (`npm start`).
- 스펙 문서 상태를 "초안" → "구현됨"으로 갱신한다.
