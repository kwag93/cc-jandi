# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Model Context Protocol (MCP) server for Jandi (Korean team collaboration tool) built with mcp-framework. It supports all 4 Jandi webhook types: **Incoming Webhook** (channel messages), **Team Incoming Webhook** (personal messages), **Outgoing Webhook**, and **Team Outgoing Webhook**. The server automatically discovers and loads tools recursively from the `src/tools/` directory.

## Common Commands

### Development
```bash
# Install dependencies
npm install

# Build the project (compiles TypeScript and packages with mcp-build)
npm run build

# Watch for changes and auto-compile
npm run watch

# Start the server locally
npm run start
```

### Configuration
```bash
# Copy environment template
cp .env.example .env

# Edit .env with your Jandi webhook tokens
# See .env.example for all available configuration options
```

### Testing
```bash
# Test locally using npm link
npm link
jandi-mcp

# Test with Claude Desktop by updating claude_desktop_config.json
```

## Architecture

### Directory Structure
```
src/
  index.ts                          # Server entry point
  types/
    common.ts                       # Shared types: JandiConnectInfo, JandiColors, BaseWebhookConfig, etc.
    incoming.ts                     # IncomingWebhookConfig, IncomingMessage, IncomingResponse
    team-incoming.ts                # TeamIncomingWebhookConfig, TeamIncomingMessage, TeamIncomingResponse
    outgoing.ts                     # OutgoingWebhookPayload, TeamOutgoingWebhookPayload, OutgoingWebhookResponse
    index.ts                        # All type re-exports + backward compatibility aliases
    jandi.ts                        # Backward compatibility facade (deprecated, use index.ts)
  services/
    base/
      BaseWebhookService.ts         # Abstract base: validation, error handling, HTTP
    IncomingWebhookService.ts        # Incoming Webhook service
    TeamIncomingWebhookService.ts    # Team Incoming Webhook service
    configService.ts                 # Multi-type token management
    index.ts                         # Service re-exports
  utils/
    resolveToken.ts                  # Incoming token resolution (deduplicates tool logic)
    resolveTeamToken.ts              # Team token resolution
    index.ts                         # Utility re-exports
  tools/
    incoming/
      SendMessageTool.ts             # send_message - Basic channel message
      SendRichMessageTool.ts         # send_rich_message - Rich channel message
      ValidateTokenTool.ts           # validate_token - Token validation
      TestWebhookTool.ts             # test_webhook - Comprehensive testing
    team-incoming/
      SendTeamMessageTool.ts         # send_team_message - Personal message by email
      SendTeamRichMessageTool.ts     # send_team_rich_message - Rich personal message
      ValidateTeamTokenTool.ts       # validate_team_token - Team token validation
    outgoing/
      SimulateOutgoingPayloadTool.ts # simulate_outgoing_payload - Test payload generation
      GenerateOutgoingHandlerTool.ts # generate_outgoing_handler - Handler server code gen
      ValidateOutgoingResponseTool.ts# validate_outgoing_response - Response format validation
    GenerateWebhookScriptTool.ts     # generate_webhook_script - Multi-type script generation
```

### Key Services

#### BaseWebhookService (Abstract)
Common webhook logic shared by all services:
- HTTP headers, request timeout
- Message validation (5000 chars, 256KB limits)
- Jandi-specific error handling (40000, 42900)
- Generic `sendRequest()` method

#### IncomingWebhookService
Handles Incoming Webhook (channel messages):
- URL: `https://wh.jandi.com/connect-api/webhook/{token}`
- `sendMessage()`, `validateToken()`
- `createBasicMessage()`, `createRichMessage()`, `createStatusMessage()`

#### TeamIncomingWebhookService
Handles Team Incoming Webhook (personal messages):
- URL: `https://wh.jandi.com/connect-api/team-webhook/{teamId}/{token}`
- Email validation (max 100 recipients)
- `sendMessage()`, `validateToken()`

#### ConfigService
Manages webhook tokens across all types:
- **Incoming**: `JANDI_TOKEN`, `JANDI_TOKEN_{alias}`, `JANDI_URL_{alias}`
- **Team Incoming**: `JANDI_TEAM_ID_{alias}` + `JANDI_TEAM_TOKEN_{alias}`, `JANDI_TEAM_URL_{alias}`
- **Outgoing**: `JANDI_OUTGOING_TOKEN_{alias}`

### Available Tools (11)

#### Incoming Webhook Tools
| Tool | Name | Description |
|------|------|-------------|
| SendMessageTool | `send_message` | Send basic text to channel |
| SendRichMessageTool | `send_rich_message` | Send rich message with color/attachments |
| ValidateTokenTool | `validate_token` | Validate webhook token |
| TestWebhookTool | `test_webhook` | Comprehensive webhook testing |

#### Team Incoming Webhook Tools
| Tool | Name | Description |
|------|------|-------------|
| SendTeamMessageTool | `send_team_message` | Send text to specific users by email |
| SendTeamRichMessageTool | `send_team_rich_message` | Send rich message to specific users |
| ValidateTeamTokenTool | `validate_team_token` | Validate team webhook token |

#### Outgoing Webhook Tools (Development Helpers)
| Tool | Name | Description |
|------|------|-------------|
| SimulateOutgoingPayloadTool | `simulate_outgoing_payload` | Generate test payload JSON |
| GenerateOutgoingHandlerTool | `generate_outgoing_handler` | Generate handler server code |
| ValidateOutgoingResponseTool | `validate_outgoing_response` | Validate response format |

#### Common Tools
| Tool | Name | Description |
|------|------|-------------|
| GenerateWebhookScriptTool | `generate_webhook_script` | Generate scripts in Python/Node.js/curl/bash |

### Token Resolution Pattern
All tools use shared token resolution utilities (`utils/resolveToken.ts`, `utils/resolveTeamToken.ts`) to eliminate duplicated token lookup logic. The resolution order:
1. Direct `token` parameter
2. `tokenAlias` lookup from ConfigService
3. Default token fallback (incoming only)

### Tool Development Pattern
All tools follow the same pattern:
1. Extend `MCPTool<InputType>` class
2. Define input interface with TypeScript
3. Set `name` and `description` properties
4. Define `schema` using Zod for input validation
5. Use `resolveIncomingToken()` or `resolveTeamToken()` for token management
6. Use the appropriate webhook service for message sending
7. Implement `execute(input)` method with business logic

Example tool structure:
```typescript
import { MCPTool } from "mcp-framework";
import { z } from "zod";
import { IncomingWebhookService } from "../../services/IncomingWebhookService.js";
import { resolveIncomingToken } from "../../utils/resolveToken.js";

interface MyToolInput {
  message: string;
  tokenAlias?: string;
}

class MyTool extends MCPTool<MyToolInput> {
  name = "my_tool";
  description = "Tool description";

  schema = {
    message: { type: z.string(), description: "Message text" },
    tokenAlias: { type: z.string().optional(), description: "Token alias" },
  };

  async execute(input: MyToolInput) {
    const resolved = resolveIncomingToken(input);
    if (!resolved.success) return { success: false, error: resolved.error };

    const message = IncomingWebhookService.createBasicMessage(input.message);
    return IncomingWebhookService.sendMessage(resolved.config, message);
  }
}

export default MyTool;
```

## Environment Configuration

```env
# Incoming Webhook (channel messages)
JANDI_TOKEN=your_default_token_here
JANDI_TOKEN_DEV=your_dev_token_here
JANDI_URL_DEV=https://custom-url  # optional

# Team Incoming Webhook (personal messages)
JANDI_TEAM_ID_SALES=your_team_id
JANDI_TEAM_TOKEN_SALES=your_team_token
JANDI_TEAM_URL_SALES=https://custom  # optional

# Outgoing Webhook (verification tokens)
JANDI_OUTGOING_TOKEN_DEPLOY=verification_token
```

## Error Handling

The server handles Jandi-specific errors via `BaseWebhookService`:
- **40000**: Invalid webhook token or inactive webhook
- **42900**: Rate limit exceeded (60 req/min, 500 req/10min)
- **Message validation**: 5000 characters max, 256KB data size max

## Jandi Webhook Formats

### Incoming / Team Incoming (Request)
```json
{
  "body": "Main message content",
  "connectColor": "#FAC11B",
  "connectInfo": [{
    "title": "Section Title",
    "description": "Section details",
    "imageUrl": "https://example.com/image.png"
  }]
}
```
Team Incoming adds `"to": "user@example.com"` for recipient targeting.

### Outgoing Webhook (Payload from Jandi)
```json
{
  "token": "verification_token",
  "teamName": "MyTeam",
  "roomName": "General",
  "writerName": "User",
  "text": "Message text",
  "keyword": "trigger",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

### Outgoing Webhook (Response to Jandi)
Same format as Incoming message: `{ body, connectColor?, connectInfo? }`

## Claude Desktop Integration

### Local Development
Add to `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "jandi-mcp": {
      "command": "node",
      "args": ["/absolute/path/to/jandi-mcp/dist/index.js"]
    }
  }
}
```

### After Publishing
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

## Build System

The project uses TypeScript with ES modules. The build process:
1. `tsc` compiles TypeScript to JavaScript in `dist/`
2. `mcp-build` packages the server for distribution
3. The `bin` field in package.json points to `dist/index.js`

Node.js version requirement: >=18.19.0

## Common Development Tasks

### Adding a New Incoming Tool
1. Create a new file in `src/tools/incoming/`
2. Extend `MCPTool<InputType>`
3. Use `resolveIncomingToken()` for token management
4. Use `IncomingWebhookService` for message sending
5. Build and test: `npm run build`

### Adding a New Team Incoming Tool
1. Create a new file in `src/tools/team-incoming/`
2. Use `resolveTeamToken()` for token management
3. Use `TeamIncomingWebhookService` for message sending

### Adding a New Outgoing Tool
1. Create a new file in `src/tools/outgoing/`
2. Import types from `../../types/outgoing.js`

### Testing Token Configuration
1. Set up `.env` file with tokens
2. Use `validate_token` tool for incoming webhooks
3. Use `validate_team_token` tool for team webhooks
4. Use `test_webhook` tool for comprehensive testing

### Generating Scripts
Use `generate_webhook_script` tool with `webhookType` parameter to create scripts for incoming or team-incoming webhooks in Python, Node.js, curl, or bash.
