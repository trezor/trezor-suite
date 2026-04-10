# AI Trezor Hive Memory

Self-hosted MCP + REST service backed by Neo4j and Postgres.
Designed to run on an internal VM behind a company VPN.

## Quick start

```bash
cp env.example .env   # edit credentials
docker compose up -d
```

The gateway listens on `http://<host>:8080` by default.

| Endpoint                 | Method              | Description                |
| ------------------------ | ------------------- | -------------------------- |
| `/mcp`                   | POST / GET / DELETE | Streamable HTTP MCP        |
| `/api/impact?symbol=...` | GET                 | Dependency impact analysis |
| `/api/learn`             | POST                | Store a session learning   |
| `/api/health`            | GET                 | Health check               |

## MCP tools

| Tool                     | Description                                                 |
| ------------------------ | ----------------------------------------------------------- |
| `get_dependency_impact`  | Analyse transitive dependency impact of a symbol or package |
| `store_session_learning` | Store a learning/insight into the knowledge graph           |

---

## Client integration

All examples below assume the gateway is reachable at `http://trezor-hive-memory.internal:8080`.
Replace with your actual host/IP.

### Claude Code (CLI)

Add the server to your project-level or user-level settings:

**Project** – `.mcp.json` in the repo root:

```json
{
    "mcpServers": {
        "trezor-hive-memory": {
            "type": "url",
            "url": "http://trezor-hive-memory.internal:8080/mcp"
        }
    }
}
```

**User** – `~/.claude.json`:

```json
{
    "mcpServers": {
        "trezor-hive-memory": {
            "type": "url",
            "url": "http://trezor-hive-memory.internal:8080/mcp"
        }
    }
}
```

Then restart Claude Code. The tools `get_dependency_impact` and `store_session_learning` will appear automatically.

### VS Code (Copilot Chat)

Add to your **workspace** `.vscode/mcp.json`:

```json
{
    "servers": {
        "trezor-hive-memory": {
            "type": "http",
            "url": "http://trezor-hive-memory.internal:8080/mcp"
        }
    }
}
```

Or add to **user** `settings.json`:

```json
{
    "mcp": {
        "servers": {
            "trezor-hive-memory": {
                "type": "http",
                "url": "http://trezor-hive-memory.internal:8080/mcp"
            }
        }
    }
}
```

Reload VS Code. MCP tools will be available in Copilot Chat when using Agent mode.

### Cursor

Open **Settings > MCP** and add a new server:

- **Name**: `trezor-hive-memory`
- **Type**: `http`
- **URL**: `http://trezor-hive-memory.internal:8080/mcp`

Alternatively, add to `.cursor/mcp.json` in the repo root:

```json
{
    "mcpServers": {
        "trezor-hive-memory": {
            "type": "url",
            "url": "http://trezor-hive-memory.internal:8080/mcp"
        }
    }
}
```

### Windsurf

Add to `~/.codeium/windsurf/mcp_config.json`:

```json
{
    "mcpServers": {
        "trezor-hive-memory": {
            "serverUrl": "http://trezor-hive-memory.internal:8080/mcp"
        }
    }
}
```

### Zed

Add to your Zed settings (`~/.config/zed/settings.json`):

```json
{
    "context_servers": {
        "trezor-hive-memory": {
            "settings": {
                "url": "http://trezor-hive-memory.internal:8080/mcp"
            }
        }
    }
}
```

### ChatGPT / Codex (OpenAI)

When adding an MCP connector in ChatGPT or the Codex CLI, provide:

- **URL**: `http://trezor-hive-memory.internal:8080/mcp`
- **Transport**: Streamable HTTP

In the Codex CLI config (`~/.codex/config.json`):

```json
{
    "mcpServers": {
        "trezor-hive-memory": {
            "type": "url",
            "url": "http://trezor-hive-memory.internal:8080/mcp"
        }
    }
}
```

### JetBrains IDEs (AI Assistant)

Go to **Settings > Tools > AI Assistant > MCP Servers**, click **+**, and enter:

- **Name**: `trezor-hive-memory`
- **URL**: `http://trezor-hive-memory.internal:8080/mcp`
- **Transport**: HTTP

### Generic / programmatic

Any MCP client that supports the **Streamable HTTP** transport can connect:

```
POST http://trezor-hive-memory.internal:8080/mcp
Content-Type: application/json

{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"my-client","version":"1.0.0"}}}
```

The server returns an `mcp-session-id` header. Include it in subsequent requests for session continuity.

---

## Security notes

- The gateway binds to `0.0.0.0:8080` — ensure it is only reachable via VPN.
- Place a reverse proxy (Traefik / Nginx) in front for TLS termination, rate-limiting, and access logging.
- JWT auth middleware is included as a placeholder — wire in your identity provider by setting `JWT_SECRET` to a real secret and implementing token validation in `src/middleware/jwt-auth.ts`.
