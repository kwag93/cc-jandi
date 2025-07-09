# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Model Context Protocol (MCP) server for Jandi (Korean team collaboration tool) built with mcp-framework. It provides tools for sending messages to Jandi channels via webhooks and generating automation scripts. The server automatically discovers and loads tools from the `src/tools/` directory.

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
# JANDI_TOKEN=your_default_token_here
# JANDI_TOKEN_DEV=your_dev_token_here
```

### Testing
```bash
# Test locally using npm link
npm link
jandi-mcp

# Test with Claude Desktop by updating claude_desktop_config.json
```

## Architecture

### Core Structure
- `src/index.ts` - Main server entry point that initializes MCPServer and ConfigService
- `src/tools/` - Directory containing all MCP tools
- `src/services/` - Core services (JandiService, ConfigService)
- `src/types/` - TypeScript type definitions
- `dist/` - Compiled JavaScript output directory

### Key Services

#### JandiService
Handles all communication with Jandi webhooks:
- Message sending with validation
- Error handling for Jandi-specific errors
- Rate limiting support
- Message format validation (5000 chars, 256KB limits)

#### ConfigService
Manages webhook tokens and configuration:
- Environment variable loading
- Multiple token support with aliases
- Token validation
- Custom webhook URL support

### Available Tools

1. **SendMessageTool** - Send basic text messages
2. **SendRichMessageTool** - Send rich messages with colors and attachments
3. **ValidateTokenTool** - Validate webhook tokens
4. **TestWebhookTool** - Test webhook connections
5. **GenerateWebhookScriptTool** - Generate automation scripts

### Tool Development Pattern
All tools follow the same pattern:
1. Extend `MCPTool<InputType>` class
2. Define input interface with TypeScript
3. Set `name` and `description` properties
4. Define `schema` using Zod for input validation
5. Implement `execute(input)` method with business logic

Example tool structure:
```typescript
interface MyToolInput {
  message: string;
  tokenAlias?: string;
}

class MyTool extends MCPTool<MyToolInput> {
  name = "my_tool";
  description = "Tool description";
  
  schema = {
    message: {
      type: z.string(),
      description: "Parameter description",
    },
    tokenAlias: {
      type: z.string().optional(),
      description: "Token alias from configuration",
    },
  };
  
  async execute(input: MyToolInput) {
    // Use ConfigService to get token
    const config = ConfigService.getToken(input.tokenAlias || 'default');
    
    // Use JandiService to send message
    const result = await JandiService.sendMessage(config, message);
    
    return result;
  }
}
```

## Environment Configuration

The server uses environment variables for configuration:

```env
# Required - default token
JANDI_TOKEN=your_default_token_here

# Optional - named tokens for different environments
JANDI_TOKEN_DEV=your_dev_token_here
JANDI_TOKEN_PROD=your_prod_token_here

# Optional - custom webhook URLs
JANDI_URL_DEV=https://script.google.com/macros/s/your_gas_script_id/exec
```

## Error Handling

The server handles Jandi-specific errors:
- **40000**: Invalid webhook token or inactive webhook
- **42900**: Rate limit exceeded (60 req/min, 500 req/10min)
- **Message validation**: 5000 characters max, 256KB data size max

## Jandi Webhook Format

Messages are sent using Jandi's webhook format:
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

### Adding a New Tool
1. Create a new file in `src/tools/`
2. Extend `MCPTool<InputType>`
3. Use `ConfigService` for token management
4. Use `JandiService` for message sending
5. Build and test: `npm run build`

### Testing Token Configuration
1. Set up `.env` file with tokens
2. Use `validate_token` tool to test
3. Use `test_webhook` tool for comprehensive testing

### Generating Scripts
Use `generate_webhook_script` tool to create automation scripts in various languages (Python, Node.js, curl, bash).