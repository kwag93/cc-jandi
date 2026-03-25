---
description: 심각도(info/success/warning/error)에 따라 색상 코딩된 알림을 잔디 채널에 전송합니다. 에러, 경고 등 심각도가 있는 알림에 사용합니다.
---

# 잔디 심각도별 알림

"$ARGUMENTS"에서 첫 단어를 심각도로, 나머지를 메시지로 파싱하여 색상 코딩된 리치 메시지를 전송합니다.

## 심각도별 색상

| 심각도 | 색상 | Hex |
|--------|------|-----|
| info | 파랑 | #4A90D9 |
| success | 초록 | #2ECC71 |
| warning | 주황 | #F39C12 |
| error | 빨강 | #E74C3C |

## 동작

1. "$ARGUMENTS"의 첫 단어(info/success/warning/error)를 심각도로 파싱
2. 나머지 텍스트를 메시지 본문으로 사용
3. `send_rich_message` 도구를 호출하여 색상 코딩된 메시지 전송
4. 심각도가 지정되지 않으면 기본값 info 사용

## 예시

- `/cc-jandi:alert error DB 연결 실패` → 빨간색 "DB 연결 실패"
- `/cc-jandi:alert success 배포 완료` → 초록색 "배포 완료"
- `/cc-jandi:alert warning 디스크 80% 사용` → 주황색 "디스크 80% 사용"
