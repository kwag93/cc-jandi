---
name: deploy-notify
description: 현재 git 브랜치와 최근 커밋을 수집해 배포 결과를 잔디 채널에 알립니다. "배포 알림 보내줘", "배포 완료 잔디에 공유", "릴리즈 알림 전송", "deploy 알림" 같은 요청에 사용합니다.
argument-hint: "[환경명이나 추가 메시지]"
allowed-tools: Bash(git rev-parse *) Bash(git log *) Bash(git diff *)
---

# 잔디 배포 알림

git 정보를 수집해 배포 결과를 리치 메시지로 전송한다.

1. 배포 정보를 모은다.
   - `git rev-parse --abbrev-ref HEAD` — 브랜치
   - `git log -1 --format="%h %s"` — 최근 커밋
   - `git diff --stat HEAD~1` — 변경 규모
2. `send_rich_message`를 호출한다.
   - `message`: "$ARGUMENTS", 비어 있으면 "배포 완료"
   - `color`: `#2ECC71`
   - `connectInfo`: `[{ title: "Git 정보", description: "브랜치 / 커밋 / 변경 파일 수" }]`

저장소가 아니거나 커밋이 하나뿐이면 해당 항목을 빼고 나머지만 담아 보낸다.

## 예시

- `/cc-jandi:deploy-notify production 배포 완료`
- `/cc-jandi:deploy-notify staging 핫픽스 적용`
