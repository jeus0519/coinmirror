---
name: deploy
description: EAS Build/Update로 앱을 배포한다. 사용자가 "/deploy" 또는 "배포해줘"라고 할 때 사용.
---

# /deploy

배포는 되돌리기 어렵거나 사용자 기기에 직접 영향을 준다 — 각 단계 전에 무엇을 하는지 설명하고 진행해도 되는지 확인한다.

## 사전 확인

1. `git status`가 깨끗한지 (커밋 안 된 변경사항이 배포에 섞이지 않도록)
2. `eas.json` 존재 여부 확인. 없으면 `eas build:configure`가 먼저 필요하다고 안내.
3. `app.json`의 `version`(및 `ios.buildNumber`/`android.versionCode`)을 올릴지 사용자에게 확인.

## OTA 업데이트 (JS/에셋만 변경된 경우)

```bash
eas update --branch <채널명> --message "<변경 요약>"
```

- 네이티브 코드/설정 변경(새 네이티브 모듈, `app.json`의 plugins 등)이 있으면 OTA로는 부족하다 — 아래 빌드 필요.

## 신규 빌드 (네이티브 변경이 있는 경우)

```bash
eas build --platform <ios|android|all> --profile <profile>
```

- 빌드 완료 후 스토어 제출은 별도 확인 후 `eas submit`으로 진행 (자동 진행 금지 — 스토어 제출은 되돌리기 어렵다).

## 배포 후

- 배포 내역을 간단히 `docs/exec-plans/`나 커밋 메시지에 남긴다 (무엇을, 어느 채널/프로필로 배포했는지).
