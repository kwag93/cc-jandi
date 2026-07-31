---
name: alert
description: 심각도에 따라 색상이 다른 알림을 잔디 채널에 보냅니다. "잔디에 에러 알림 보내줘", "장애 알림", "경고 보내줘", "성공 알림 전송" 처럼 info/success/warning/error 구분이 필요한 요청에 사용합니다.
argument-hint: "[info|success|warning|error] [메시지]"
---

# 잔디 심각도별 알림

"$ARGUMENTS"의 첫 단어를 심각도로, 나머지를 본문으로 삼아 `send_rich_message`를 호출한다.
첫 단어가 아래 넷 중 하나가 아니면 전체를 본문으로 보고 심각도는 `info`로 둔다.

| 심각도 | 색상 | Hex |
|--------|------|-----|
| info | 파랑 | #4A90D9 |
| success | 초록 | #2ECC71 |
| warning | 주황 | #F39C12 |
| error | 빨강 | #E74C3C |

## 예시

- `/cc-jandi:alert error DB 연결 실패` → 빨간색 "DB 연결 실패"
- `/cc-jandi:alert success 배포 완료` → 초록색 "배포 완료"
- `/cc-jandi:alert 디스크 정리 완료` → 파란색(기본) "디스크 정리 완료"
