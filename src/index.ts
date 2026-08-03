import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { MCPServer } from "mcp-framework";
import { ConfigService } from "./services/configService.js";

ConfigService.initialize();

const __dirname = dirname(fileURLToPath(import.meta.url));

// mcp-framework derives the server identity from the package.json in the working
// directory, which under `npx` is the user's own project — it then falls back to
// "unnamed-mcp-server@0.0.0". Read our own manifest instead so MCP clients show the
// real name and version.
const pkg = JSON.parse(
  readFileSync(join(__dirname, "..", "package.json"), "utf8")
) as { name: string; version: string };

const server = new MCPServer({
  basePath: __dirname,
  name: pkg.name,
  version: pkg.version,
});

server.start();
