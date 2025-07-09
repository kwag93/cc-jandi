import { MCPTool } from "mcp-framework";
import { z } from "zod";
import { JandiService } from "../services/jandiService.js";
import { ConfigService } from "../services/configService.js";
import { JandiColors, MessageType } from "../types/jandi.js";

interface TestWebhookInput {
  token?: string;
  tokenAlias?: string;
  testType?: 'basic' | 'rich' | 'all';
}

class TestWebhookTool extends MCPTool<TestWebhookInput> {
  name = "test_webhook";
  description = "Test Jandi webhook connection by sending various test messages";

  schema = {
    token: {
      type: z.string().optional(),
      description: "Jandi webhook token to test (32-character hexadecimal string). If not provided, will use tokenAlias or default token",
    },
    tokenAlias: {
      type: z.string().optional(),
      description: "Token alias from configuration to test (e.g., 'default', 'dev', 'prod'). If not provided, will use 'default'",
    },
    testType: {
      type: z.enum(['basic', 'rich', 'all']).optional(),
      description: "Type of test to perform: 'basic' (simple message), 'rich' (rich message), 'all' (comprehensive test). Default is 'basic'",
    },
  };

  async execute(input: TestWebhookInput) {
    try {
      let config;

      // Determine which token to use
      if (input.token) {
        // Validate token format
        if (!ConfigService.validateTokenFormat(input.token)) {
          return {
            success: false,
            error: "Invalid token format. Token should be a 32-character hexadecimal string"
          };
        }
        config = { token: input.token };
      } else if (input.tokenAlias) {
        config = ConfigService.getToken(input.tokenAlias);
        if (!config) {
          return {
            success: false,
            error: `Token alias '${input.tokenAlias}' not found. Available aliases: ${ConfigService.listTokenAliases().join(', ')}`
          };
        }
      } else {
        config = ConfigService.getToken('default');
        if (!config) {
          return {
            success: false,
            error: "No default token configured. Please provide a token or tokenAlias, or set JANDI_TOKEN environment variable"
          };
        }
      }

      const testType = input.testType || 'basic';
      const timestamp = new Date().toISOString();
      const results: any[] = [];

      // Test basic message
      if (testType === 'basic' || testType === 'all') {
        const basicMessage = JandiService.createBasicMessage(
          `🧪 Basic webhook test - ${timestamp}`
        );
        const basicResult = await JandiService.sendMessage(config, basicMessage);
        results.push({
          type: 'basic',
          success: basicResult.success,
          error: basicResult.error
        });
      }

      // Test rich message
      if (testType === 'rich' || testType === 'all') {
        const richMessage = JandiService.createRichMessage(
          `🎨 Rich webhook test - ${timestamp}`,
          JandiColors.BLUE,
          [
            {
              title: 'Test Section',
              description: 'This is a test of rich message functionality with color and attachments.',
            }
          ]
        );
        const richResult = await JandiService.sendMessage(config, richMessage);
        results.push({
          type: 'rich',
          success: richResult.success,
          error: richResult.error
        });
      }

      // Test status messages (only for 'all' test type)
      if (testType === 'all') {
        const statusTypes = [MessageType.SUCCESS, MessageType.WARNING, MessageType.ERROR];
        
        for (const statusType of statusTypes) {
          const statusMessage = JandiService.createStatusMessage(
            `${statusType.toUpperCase()} status test - ${timestamp}`,
            statusType,
            `This is a test of ${statusType} message type`
          );
          const statusResult = await JandiService.sendMessage(config, statusMessage);
          results.push({
            type: `status_${statusType}`,
            success: statusResult.success,
            error: statusResult.error
          });
        }
      }

      // Analyze results
      const successCount = results.filter(r => r.success).length;
      const totalCount = results.length;
      const allSuccessful = successCount === totalCount;

      return {
        success: allSuccessful,
        message: allSuccessful 
          ? `All ${totalCount} webhook tests passed successfully`
          : `${successCount}/${totalCount} webhook tests passed`,
        tokenUsed: config.alias || 'direct',
        testType,
        timestamp,
        results,
        summary: {
          total: totalCount,
          successful: successCount,
          failed: totalCount - successCount
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Unexpected error during webhook test: ${error}`
      };
    }
  }
}

export default TestWebhookTool;