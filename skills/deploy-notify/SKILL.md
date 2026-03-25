---
description: 현재 git 상태(브랜치, 최근 커밋, 변경 파일)를 자동 수집하여 배포 결과 알림을 잔디 채널에 전송합니다. 배포 후 알림에 사용합니다.
---

# 잔디 배포 알림

git 정보를 자동 수집하여 배포 결과를 잔디 채널에 리치 메시지로 전송합니다.

## 동작

1. Bash로 git 정보 수집:
   - `git rev-parse --abbrev-ref HEAD` → 브랜치명
   - `git log -1 --format="%h %s"` → 최근 커밋
   - `git diff --stat HEAD~1` → 변경 파일
2. "$ARGUMENTS"를 추가 메시지(환경명 등)로 사용
3. `send_rich_message` 도구를 호출:
   - body: "$ARGUMENTS" 또는 "배포 완료"
   - color: #2ECC71 (success 초록)
   - connectInfo에 git 정보 첨부:
     - title: "Git 정보"
     - description: 브랜치, 커밋 해시, 변경 파일 수

## 예시

- `/cc-jandi:deploy-notify production 배포 완료`
- `/cc-jandi:deploy-notify staging 핫픽스 적용`
