# MCP Server

Trezor Suite includes a built-in [MCP (Model Context Protocol)](https://modelcontextprotocol.io/) server that allows AI agents to interact with your Trezor device. The server runs on localhost only and uses the standard **Streamable HTTP** transport.

## Enabling the MCP Server

1. Open Trezor Suite Desktop
2. Go to **Settings → Experimental Features** and enable experimental features
3. Toggle **MCP Server** on

Once enabled, the server runs at `http://127.0.0.1:21340/mcp`.

## Client Configuration

Replace `<token>` with the token shown in Trezor Suite (Settings → Experimental Features → MCP Server). The token is passed as a URL query parameter — no custom headers needed.

### Claude Code

Run in your terminal:

```bash
claude mcp add trezor-suite http://127.0.0.1:21340/mcp?token=<token> -t http
```

This adds the server to the current project (local scope). To make it available in all projects, add `-s user`.

> **Troubleshooting:** If you see "SDK auth failed", Claude Code's HTTP transport may be triggering OAuth. Use the `mcp-remote` bridge as a workaround: `claude mcp add-json trezor-suite '{"command":"npx","args":["mcp-remote","http://127.0.0.1:21340/mcp?token=<token>","--transport","http-only","--allow-http"]}'`

### Claude Desktop

Claude Desktop only supports stdio transport, so it needs the `mcp-remote` bridge (requires Node.js). Add this to your config file:

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
    "mcpServers": {
        "trezor-suite": {
            "command": "npx",
            "args": [
                "mcp-remote",
                "http://127.0.0.1:21340/mcp?token=<token>",
                "--transport",
                "http-only",
                "--allow-http"
            ]
        }
    }
}
```

### Other MCP Clients (Cursor, VS Code, Windsurf)

```json
{
    "mcpServers": {
        "trezor-suite": {
            "url": "http://127.0.0.1:21340/mcp?token=<token>"
        }
    }
}
```

### Cursor

1. Open **Cursor Settings**
2. Navigate to the **MCP** section
3. Add a new server with the URL `http://127.0.0.1:21340/mcp?token=<token>`

### VS Code (GitHub Copilot)

Create or edit `.vscode/mcp.json` in your workspace:

```json
{
    "mcpServers": {
        "trezor-suite": {
            "url": "http://127.0.0.1:21340/mcp?token=<token>"
        }
    }
}
```

### Windsurf

Add the MCP server via **Windsurf Settings → MCP** using the URL `http://127.0.0.1:21340/mcp?token=<token>`.

## Available Tools

The MCP server exposes the following tools:

| Tool                      | Description                                     | Device confirmation?         |
| ------------------------- | ----------------------------------------------- | ---------------------------- |
| `trezor_get_address`      | Get a receive address from the connected device | Only if `showOnTrezor: true` |
| `trezor_get_public_key`   | Get extended public key (xpub)                  | No                           |
| `trezor_get_account_info` | Get account info (balance, transactions, etc.)  | No                           |
| `trezor_send_transaction` | Compose, sign, and broadcast a transaction      | Yes                          |
| `trezor_push_transaction` | Broadcast a signed transaction to the network   | No                           |
| `trezor_sign_message`     | Sign a message with a device key                | Yes                          |
| `trezor_verify_message`   | Verify a signed message                         | No                           |
| `trezor_sign_typed_data`  | Sign EIP-712 typed data (EVM)                   | Yes                          |

All user-facing tool calls require Suite popup approval (unless previously remembered). Internal auto-fill calls (nonce lookup, fee estimation) run silently.

## Claude Code Skill

A ready-made [Claude Code skill](skills/trezor-mcp/) is available that teaches Claude how to use the MCP tools effectively — including coin/path conventions, transaction auto-fill behavior, and common workflows.

To install it, download the [`skills/trezor-mcp`](skills/trezor-mcp/) folder and copy it into Claude Code's skills directory on your machine:

- **macOS / Linux**: `~/.claude/skills/trezor-mcp/`
- **Windows**: `%USERPROFILE%\.claude\skills\trezor-mcp\`

Make sure the folder contains `SKILL.md` and the `references/` subfolder. Once in place, Claude Code will automatically trigger the skill when you mention Trezor wallet operations.
