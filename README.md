# 잔디 MCP 서버

[![npm version](https://badge.fury.io/js/jandi-mcp.svg)](https://badge.fury.io/js/jandi-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

잔디(Jandi) 팀 협업 도구용 Model Context Protocol (MCP) 서버입니다. 웹훅을 통해 잔디 채널에 메시지를 보내고 자동화 스크립트를 생성할 수 있습니다.

## 즉시 사용하기

```bash
npx jandi-mcp
```

> 💡 **별도 설치 없이 바로 사용 가능합니다!** Claude Desktop 설정만 하면 됩니다.

## 주요 기능

- 🚀 **메시지 전송**: 잔디 채널에 기본 및 리치 메시지 전송
- 🎨 **리치 메시지**: 색상, 첨부 파일, 이미지 지원
- 🔧 **스크립트 생성**: Python, Node.js, curl, bash 자동화 스크립트 생성
- 🛡️ **토큰 관리**: 다중 웹훅 토큰 및 별칭 지원
- ✅ **검증**: 토큰 검증 및 웹훅 테스트
- 🚨 **에러 처리**: 속도 제한 대응 포함 종합적인 에러 처리

## 빠른 시작

### 1. 잔디 웹훅 토큰 발급

<details>
<summary>잔디 커넥트에서 웹훅 토큰 발급하기 (클릭하여 펼치기)</summary>

1. 잔디 앱 또는 웹에서 원하는 토픽으로 이동
2. 토픽 상단 또는 메뉴바의 플러그 모양 아이콘 클릭
3. **인커밍 웹훅** 선택
4. 웹훅 이름 입력 후 **커넥트 추가** 클릭
5. 생성된 웹훅 URL에서 토큰 부분 복사
   - 예: `https://wh.jandi.com/connect-api/webhook/abcdef0123456789abcdef0123456789`
   - 토큰: `abcdef0123456789abcdef0123456789`

</details>

### 2. Claude Desktop에 MCP 서버 추가

<details>
<summary>Claude Desktop 설정하기 (클릭하여 펼치기)</summary>

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "jandi-mcp": {
      "command": "npx",
      "args": ["jandi-mcp"],
      "env": {
        "JANDI_TOKEN": "여기에_발급받은_토큰_입력"
      }
    }
  }
}
```

여러 토큰을 사용하려면:
```json
{
  "mcpServers": {
    "jandi-mcp": {
      "command": "npx",
      "args": ["jandi-mcp"],
      "env": {
        "JANDI_TOKEN": "기본_토큰",
        "JANDI_TOKEN_DEV": "개발용_토큰",
        "JANDI_TOKEN_PROD": "배포용_토큰"
      }
    }
  }
}
```

</details>

### 3. 바로 사용하기

설정 완료 후 Claude Desktop을 재시작하면 바로 사용할 수 있습니다!

**기본 메시지 전송 예시:**
```
잔디에 "배포 완료!" 메시지를 보내줘
```

**리치 메시지 전송 예시:**
```
잔디에 초록색으로 "🚀 배포 완료"라는 메시지를 보내고, 제목은 "상태", 설명은 "모든 서비스가 정상 작동 중"으로 해줘
```

## 사용 예시

### 기본 메시지 전송
```
잔디에 "빌드 완료!" 메시지를 보내줘
```

### 리치 메시지 전송
```
잔디에 빨간색으로 "⚠️ 서버 경고" 메시지를 보내고, 제목은 "CPU 사용률", 설명은 "80% 초과"로 해줘
```

### 토큰 검증
```
잔디 토큰이 유효한지 확인해줘
```

### 스크립트 생성
```
Python으로 잔디 메시지 보내는 스크립트를 만들어줘
```

## 고급 설정

<details>
<summary>로컬 개발용 설정 (클릭하여 펼치기)</summary>

프로젝트를 로컬에서 개발하려면:

1. **저장소 클론**
   ```bash
   git clone https://github.com/kwag93/jandi-mcp.git
   cd jandi-mcp
   ```

2. **의존성 설치**
   ```bash
   npm install
   ```

3. **환경 설정**
   ```bash
   cp .env.example .env
   # .env 파일에 토큰 입력
   ```

4. **빌드**
   ```bash
   npm run build
   ```

5. **Claude Desktop 설정**
   ```json
   {
     "mcpServers": {
       "jandi-mcp": {
         "command": "node",
         "args": ["/절대/경로/to/jandi-mcp/dist/index.js"]
       }
     }
   }
   ```

</details>

<details>
<summary>환경 변수 설정 (클릭하여 펼치기)</summary>

`.env` 파일 또는 Claude Desktop 설정에서 다음 환경 변수를 사용할 수 있습니다:

```env
# 기본 토큰 (필수)
JANDI_TOKEN=your_default_token_here

# 환경별 토큰
JANDI_TOKEN_DEV=your_dev_token_here
JANDI_TOKEN_PROD=your_prod_token_here
JANDI_TOKEN_TEAM1=your_team1_token_here

# 커스텀 웹훅 URL (선택사항)
JANDI_URL_DEV=https://script.google.com/macros/s/your_gas_script_id/exec
```

</details>

<details>
<summary>다른 MCP 클라이언트에서 사용하기 (클릭하여 펼치기)</summary>

Claude Desktop 외에도 다른 MCP 클라이언트에서 사용할 수 있습니다:

**VS Code 확장 프로그램:**
```json
{
  "mcp": {
    "servers": {
      "jandi-mcp": {
        "command": "npx",
        "args": ["jandi-mcp"]
      }
    }
  }
}
```

**Cursor:**
```json
{
  "mcpServers": {
    "jandi-mcp": {
      "command": "npx",
      "args": ["jandi-mcp"]
    }
  }
}
```

</details>

## 사용 가능한 도구

### 메시지 전송 도구

| 도구 | 설명 | 사용법 |
|------|------|--------|
| `send_message` | 기본 텍스트 메시지 전송 | "잔디에 메시지 보내줘" |
| `send_rich_message` | 색상과 첨부 파일이 있는 리치 메시지 전송 | "잔디에 초록색으로 성공 메시지 보내줘" |

### 유틸리티 도구

| 도구 | 설명 | 사용법 |
|------|------|--------|
| `validate_token` | 웹훅 토큰 검증 | "잔디 토큰 확인해줘" |
| `test_webhook` | 웹훅 연결 테스트 | "잔디 웹훅 테스트해줘" |

### 스크립트 생성 도구

| 도구 | 설명 | 사용법 |
|------|------|--------|
| `generate_webhook_script` | 자동화 스크립트 생성 | "Python 잔디 메시지 스크립트 만들어줘" |

## 에러 처리

MCP 서버는 다양한 잔디 관련 에러를 처리합니다:

- **40000**: 유효하지 않은 웹훅 토큰 또는 비활성화된 웹훅
- **42900**: 속도 제한 초과 (분당 60회, 10분당 500회)
- **메시지 제한**: 최대 5,000자, 최대 256KB 데이터 크기

## 잔디 웹훅 형식

메시지는 다음 형식으로 잔디에 전송됩니다:

```json
{
  "body": "메인 메시지 내용",
  "connectColor": "#FAC11B",
  "connectInfo": [{
    "title": "섹션 제목",
    "description": "섹션 상세 내용",
    "imageUrl": "https://example.com/image.png"
  }]
}
```

## 속도 제한

잔디 웹훅 속도 제한:
- 분당 60회 요청
- 10분당 500회 요청

MCP 서버는 자동으로 속도 제한 에러를 처리하고 적절한 에러 메시지를 제공합니다.

## 문의 및 지원

- [GitHub Issues](https://github.com/kwag93/jandi-mcp/issues) - 버그 리포트 및 기능 요청
- [잔디 커넥트 문서](https://support.jandi.com/ko/categories/커넥트-fdf97953) - 잔디 웹훅 설정 가이드
- [MCP 프레임워크](https://github.com/QuantGeekDev/mcp-framework) - MCP 프레임워크 문서

## 기여하기

이 프로젝트에 기여하고 싶으시다면:

1. 이 저장소를 Fork 해주세요
2. 기능 브랜치를 생성하세요 (`git checkout -b feature/amazing-feature`)
3. 변경 사항을 커밋하세요 (`git commit -m 'Add amazing feature'`)
4. 브랜치에 Push 하세요 (`git push origin feature/amazing-feature`)
5. Pull Request를 생성하세요

## 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.
