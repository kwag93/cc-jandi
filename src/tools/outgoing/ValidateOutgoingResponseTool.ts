import { MCPTool } from "mcp-framework";
import { z } from "zod";
import { validateHexColor } from "../../utils/validateColor.js";

interface ValidateOutgoingResponseInput {
  body: string;
  connectColor?: string;
  connectInfo?: Array<{
    title?: string;
    description?: string;
    imageUrl?: string;
  }>;
}

class ValidateOutgoingResponseTool extends MCPTool<ValidateOutgoingResponseInput> {
  name = "validate_outgoing_response";
  description = "Validate a Jandi Outgoing Webhook response format. Checks body length, color format, connectInfo structure, and total size limits.";

  schema = {
    body: {
      type: z.string(),
      description: "The response body text to validate",
    },
    connectColor: {
      type: z.string().optional(),
      description: "Hex color code to validate (e.g., '#FF0000')",
    },
    connectInfo: {
      type: z.array(z.object({
        title: z.string().optional(),
        description: z.string().optional(),
        imageUrl: z.string().optional(),
      })).optional(),
      description: "Array of connectInfo sections to validate",
    },
  };

  async execute(input: ValidateOutgoingResponseInput) {
    const MAX_BODY_LENGTH = 5000;
    const MAX_DATA_SIZE = 256 * 1024;
    const issues: string[] = [];
    const warnings: string[] = [];

    // Validate body
    if (!input.body || input.body.trim().length === 0) {
      issues.push("body is required and cannot be empty");
    } else if (input.body.length > MAX_BODY_LENGTH) {
      issues.push(`body exceeds maximum length of ${MAX_BODY_LENGTH} characters (current: ${input.body.length})`);
    }

    // Validate color format
    if (input.connectColor) {
      const colorResult = validateHexColor(input.connectColor);
      if (!colorResult.valid) {
        issues.push(`connectColor: ${colorResult.error!}`);
      }
    }

    // Validate connectInfo
    if (input.connectInfo) {
      if (!Array.isArray(input.connectInfo)) {
        issues.push("connectInfo must be an array");
      } else {
        input.connectInfo.forEach((info, index) => {
          if (!info.title && !info.description && !info.imageUrl) {
            warnings.push(`connectInfo[${index}] has no title, description, or imageUrl - it will be empty`);
          }
          if (info.imageUrl && !info.imageUrl.match(/^https?:\/\/.+/)) {
            issues.push(`connectInfo[${index}].imageUrl must be a valid HTTP/HTTPS URL`);
          }
        });
      }
    }

    // Validate total data size
    const response = {
      body: input.body,
      connectColor: input.connectColor,
      connectInfo: input.connectInfo
    };
    const dataSize = JSON.stringify(response).length;
    if (dataSize > MAX_DATA_SIZE) {
      issues.push(`Total response data exceeds maximum size of ${MAX_DATA_SIZE} bytes (current: ${dataSize})`);
    }

    const isValid = issues.length === 0;

    return {
      success: true,
      valid: isValid,
      message: isValid
        ? "Outgoing webhook response format is valid"
        : "Outgoing webhook response has validation issues",
      issues: issues.length > 0 ? issues : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
      stats: {
        bodyLength: input.body?.length || 0,
        maxBodyLength: MAX_BODY_LENGTH,
        totalDataSize: dataSize,
        maxDataSize: MAX_DATA_SIZE,
        connectInfoSections: input.connectInfo?.length || 0
      },
      validResponseFormat: {
        body: "string (required, max 5000 chars)",
        connectColor: "string (optional, hex color e.g. '#FAC11B')",
        connectInfo: "array (optional, [{title?, description?, imageUrl?}])"
      }
    };
  }
}

export default ValidateOutgoingResponseTool;
