# DESIGN

디자인 시스템 = [React Native Reusables](https://reactnativereusables.com) (shadcn/ui의 RN 포트).

## 원칙

- 새 UI 프리미티브가 필요하면 직접 만들기 전에 Reusables 컴포넌트 목록을 먼저 확인한다.
- 토큰(색상/반경/타이포)은 `src/global.css`의 CSS 변수 + `tailwind.config.js`에서 관리. 컴포넌트 안에 매직 넘버/hex 금지.
- 라이트/다크 모드는 처음부터 고려한다 (`darkMode: 'class'`, `useColorScheme`).

## 커스터마이징 워크플로

1. `npx @react-native-reusables/cli@latest add <component>` 로 추가
2. 필요한 만큼만 `src/components/ui/<component>.tsx`에서 수정
3. 전역 톤(색/반경)을 바꾸는 거라면 파일 하나가 아니라 `src/global.css` / `tailwind.config.js`를 바꾼다

## 아이콘

Reusables는 Lucide 아이콘 + `<Icon as={...} />` 래퍼를 사용한다. 새 아이콘 라이브러리를 추가하기 전에 Lucide에 있는지 먼저 확인.

## 참고

- [Reusables 컴포넌트 목록](https://reactnativereusables.com/docs/components/accordion)
- [Figma 리소스](https://reactnativereusables.com/docs/figma) — 화면 목업 전에 확인
