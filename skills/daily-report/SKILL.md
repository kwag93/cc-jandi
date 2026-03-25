---
description: 오늘의 git 활동(커밋 수, 변경 파일)을 요약하여 잔디 채널에 일일 리포트를 전송합니다. 일일 업무 보고에 사용합니다.
---

# 잔디 일일 리포트

오늘의 git 활동을 요약하여 잔디 채널에 리포트를 전송합니다.

## 동작

1. Bash로 오늘의 git 활동 수집:
   - `git log --since="00:00" --oneline` → 오늘 커밋 목록
   - `git log --since="00:00" --format="" --name-only | sort -u` → 변경 파일 목록
2. `send_rich_message` 도구를 호출:
   - body: "일일 리포트 - {날짜}"
   - color: #4A90D9 (info 파랑)
   - connectInfo:
     - title: "오늘의 커밋 ({N}건)"
     - description: 커밋 목록 요약

## 예시

- `/cc-jandi:daily-report` → 오늘의 활동 요약 전송
