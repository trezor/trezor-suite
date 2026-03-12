# MCP Server

Trezor Suite includes a built-in [MCP (Model Context Protocol)](https://modelcontextprotocol.io/) server that allows AI agents to interact with your Trezor device. The server runs on localhost only and uses the standard **Streamable HTTP** transport.

## Enabling the MCP Server

1. Open Trezor Suite Desktop
2. Go to **Settings → Debug** (debug settings must be enabled)
3. Toggle **MCP Server** on

Once enabled, the server runs at `http://127.0.0.1:21340/mcp`.

## Client Configuration

Add the following to your MCP client configuration:

```json
{
    "mcpServers": {
        "trezor-suite": {
            "url": "http://127.0.0.1:21340/mcp"
        }
    }
}
```

### Claude Desktop

Add the config to your Claude Desktop configuration file:

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

### Claude Code

Add the config to one of:

- **Global**: `~/.claude.json`
- **Project-level**: `.mcp.json` in your project root

### Cursor

1. Open **Cursor Settings**
2. Navigate to the **MCP** section
3. Add a new server with the URL `http://127.0.0.1:21340/mcp`

### VS Code (GitHub Copilot)

Create or edit `.vscode/mcp.json` in your workspace:

```json
{
    "mcpServers": {
        "trezor-suite": {
            "url": "http://127.0.0.1:21340/mcp"
        }
    }
}
```

### Windsurf

Add the MCP server via **Windsurf Settings → MCP** using the URL `http://127.0.0.1:21340/mcp`.

## Available Tools

The MCP server exposes the following tools:

| Tool                      | Description                                     |
| ------------------------- | ----------------------------------------------- |
| `trezor_get_address`      | Get a receive address from the connected device |
| `trezor_get_public_key`   | Get a public key from the connected device      |
| `trezor_get_account_info` | Get account info (balance, transactions, etc.)  |
| `trezor_send_transaction` | Prepare and sign a transaction                  |
| `trezor_push_transaction` | Broadcast a signed transaction to the network   |
| `trezor_sign_message`     | Sign a message with a device key                |
| `trezor_verify_message`   | Verify a signed message                         |

All tool calls require user confirmation on the Trezor device for security.

## Claude Code Skill

A ready-made [Claude Code skill](skills/trezor-mcp/) is available that teaches Claude how to use the MCP tools effectively — including coin/path conventions, transaction auto-fill behavior, and common workflows.

To install it, download the [`skills/trezor-mcp`](skills/trezor-mcp/) folder and copy it into Claude Code's skills directory on your machine:

- **macOS / Linux**: `~/.claude/skills/trezor-mcp/`
- **Windows**: `%USERPROFILE%\.claude\skills\trezor-mcp\`

Make sure the folder contains `SKILL.md` and the `references/` subfolder. Once in place, Claude Code will automatically trigger the skill when you mention Trezor wallet operations.
