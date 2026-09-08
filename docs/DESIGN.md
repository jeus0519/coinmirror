# DESIGN

디자인 시스템 = [React Native Reusables](https://reactnativereusables.com) (shadcn/ui의 RN 포트).

## 원칙

- 새 UI 프리미티브가 필요하면 직접 만들기 전에 Reusables 컴포넌트 목록을 먼저 확인한다.
- 토큰(색상/반경/타이포)은 `src/global.css`의 CSS 변수 + `tailwind.config.js`에서 관리. 컴포넌트 안에 매직 넘버/hex 금지.
- 라이트/다크 모드는 처음부터 고려한다 (`darkMode: 'class'`, `useColorScheme`).
- 웹 우선 MVP에서는 공유 가능한 카드/랜딩 섹션을 먼저 브라우저 폭 기준으로 검증한 뒤 네이티브로 옮긴다.

## 커스터마이징 워크플로

1. `npx @react-native-reusables/cli@latest add <component>` 로 추가
2. 필요한 만큼만 `src/components/ui/<component>.tsx`에서 수정
3. 전역 톤(색/반경)을 바꾸는 거라면 파일 하나가 아니라 `src/global.css` / `tailwind.config.js`를 바꾼다

## 분석 화면 IA

분석 화면은 “근거 → AI 회고 → 자기인식 비교 → 상세 근거 → 타입 요약” 순서로 읽히게 한다.

```text
기록 분석 → 거래 개요 → AI 행동코칭 → 내 예상 vs 기록 → 행동 점수 → 투자거울 타입 → 이번 분석에서 눈에 띄는 패턴 → 다음 달 비교 준비 → 월간 투자습관 리포트 → 구독 전용 지표 → 차트/종목 비중 → 피드백
```

- `거래 개요`는 승률, 보유기간, 거래 횟수 등 사용자가 바로 이해할 수 있는 핵심 지표를 먼저 보여준다.
- `AI 행동코칭`은 거래 개요 직후 배치해 AI 컨셉을 초반에 전달한다. 문구는 줄여볼 행동, 유지할 행동, 다음 달 확인 질문으로 제한한다.
- `행동 점수` 라벨을 사용한다. Free/구독 구분은 별도 `구독 전용 지표` 블록에서만 드러낸다.
- `투자거울 타입`은 행동 점수 다음에 배치해 상세 지표를 종합한 요약처럼 읽히게 한다.

## 공유 카드 원칙

상세 스펙은 [product-specs/v5.1_investment-type-layer.md](product-specs/v5.1_investment-type-layer.md) §2.4를 따른다.

- 공유 카드는 수익률, 금액, 보유 종목, 매매 신호를 노출하지 않는다.
- 주역은 투자거울 타입명/축/재미용 비유이며, 성격검사·투자조언이 아니라는 고지를 카드 안에 둔다.
- 이미지 저장/공유는 웹에서 먼저 검증하고, 네이티브 공유 API는 후속 범위로 둔다.

## 아이콘

Reusables는 Lucide 아이콘 + `<Icon as={...} />` 래퍼를 사용한다. 새 아이콘 라이브러리를 추가하기 전에 Lucide에 있는지 먼저 확인.

## 참고

- [Reusables 컴포넌트 목록](https://reactnativereusables.com/docs/components/accordion)
- [Figma 리소스](https://reactnativereusables.com/docs/figma) — 화면 목업 전에 확인
