---
name: daily-report
description: 오늘의 git 활동을 요약해 잔디 채널에 일일 리포트를 보냅니다. "일일 보고 보내줘", "오늘 작업 정리해서 잔디에", "데일리 리포트 전송", "오늘 한 일 공유" 같은 요청에 사용합니다.
argument-hint: "[리포트에 덧붙일 메모]"
allowed-tools: Bash(git log *)
---

# 잔디 일일 리포트

오늘의 git 활동을 요약해 전송한다.

1. 활동을 수집한다.
   - `git log --since=midnight --oneline` — 오늘 커밋
   - `git log --since=midnight --format="" --name-only | sort -u` — 변경 파일
2. `send_rich_message`를 호출한다.
   - `message`: "일일 리포트 - {오늘 날짜}", "$ARGUMENTS"가 있으면 덧붙인다
   - `color`: `#4A90D9`
   - `connectInfo`: `[{ title: "오늘의 커밋 (N건)", description: 커밋 목록 요약 }]`

오늘 커밋이 없으면 그 사실을 본문에 적어 보낸다.

## 예시

- `/cc-jandi:daily-report`
- `/cc-jandi:daily-report 내일 릴리즈 예정`
