import { fileURLToPath } from "url";
import { dirname } from "path";
import { MCPServer } from "mcp-framework";
import { ConfigService } from "./services/configService.js";

ConfigService.initialize();

const __dirname = dirname(fileURLToPath(import.meta.url));
const server = new MCPServer({ basePath: __dirname });

server.start();