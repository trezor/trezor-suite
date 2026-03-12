---
name: trezor-mcp
description: Trigger on any mention of Trezor wallet interaction, crypto addresses, sending crypto, checking balances, signing messages, or hardware wallet operations via MCP. Also trigger when users mention configuring or troubleshooting the Trezor MCP server connection.
---

# Trezor Suite MCP Server

The Trezor Suite MCP server lets AI agents interact with Trezor hardware wallets over the Model Context Protocol. It runs locally inside Trezor Suite Desktop and exposes tools for getting addresses, checking balances, sending transactions, and signing/verifying messages. All sensitive operations require physical confirmation on the Trezor device.

## Setup & Configuration

### Prerequisites

1. **Trezor Suite Desktop** installed and running
2. **Trezor device** connected via USB
3. **MCP server enabled**: Settings → Debug → toggle **MCP Server** on

Once enabled, the server listens at `http://127.0.0.1:21340/mcp` (localhost only).

### Client Configuration

Add this JSON block to your MCP client config:

```json
{
    "mcpServers": {
        "trezor-suite": {
            "url": "http://127.0.0.1:21340/mcp"
        }
    }
}
```

**Where to put it:**

| Client | Config file |
|---|---|
| **Claude Code** | `~/.claude.json` (global) or `.mcp.json` (project) |
| **Claude Desktop** | `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows) |
| **VS Code (Copilot)** | `.vscode/mcp.json` in workspace |
| **Cursor** | Cursor Settings → MCP → add URL |
| **Windsurf** | Windsurf Settings → MCP → add URL |

### Verifying the Connection

- **Claude Code**: run `/mcp` to see connected servers
- **Manual test**: `curl -X POST http://127.0.0.1:21340/mcp -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","id":"1","method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}}}'`

A successful response returns `protocolVersion` and `serverInfo`.

## Available Tools — Quick Reference

| Tool | Description | Device confirmation? |
|---|---|---|
| `trezor_get_address` | Get a receive address for a coin | Only if `showOnTrezor: true` |
| `trezor_get_public_key` | Get extended public key (xpub) | Yes |
| `trezor_get_account_info` | Get balance, transactions, UTXOs | No |
| `trezor_send_transaction` | Compose, sign, and broadcast a transaction | Yes |
| `trezor_push_transaction` | Broadcast a pre-signed transaction | No |
| `trezor_sign_message` | Sign a message with a device key | Yes |
| `trezor_verify_message` | Verify a signed message | No |

## Common Workflows

### Get a Receive Address

Use `trezor_get_address` with the coin and derivation path.

**Bitcoin (native segwit):**
```json
{ "coin": "btc", "path": "m/84'/0'/0'/0/0", "showOnTrezor": true }
```

**Ethereum:**
```json
{ "coin": "eth", "path": "m/44'/60'/0'/0/0", "showOnTrezor": true }
```

Set `showOnTrezor: true` when the user wants to verify the address on their device screen. For programmatic lookups where verification is not needed, omit it or set it to `false`.

### Check Account Balance

Use `trezor_get_account_info` with the coin and an account-level path.

**Bitcoin:**
```json
{ "coin": "btc", "path": "m/84'/0'/0'", "details": "basic" }
```

**Ethereum:**
```json
{ "coin": "eth", "path": "m/44'/60'/0'/0/0", "details": "tokenBalances" }
```

The response includes `balance` (in the smallest unit — satoshis for BTC, wei for ETH), `availableBalance`, and transaction history depending on the `details` level:
- `"basic"` — balance only
- `"tokens"` / `"tokenBalances"` — include token info (useful for EVM)
- `"txids"` / `"txs"` — include transaction IDs or full transaction objects

### Send a Transaction

Use `trezor_send_transaction`. For simple transfers you only need `coin`, `to`, and `value` — nonce, fees, and UTXOs are auto-filled.

**Send 0.001 BTC:**
```json
{ "coin": "btc", "to": "bc1q...", "value": "0.001" }
```
For UTXO coins, the tool auto-handles account discovery, UTXO selection, fee estimation, signing, and broadcasting in one call.

**Send 0.1 ETH:**
```json
{ "coin": "eth", "to": "0xABC...123", "value": "0.1" }
```
EVM auto-fill: nonce from account state, fees estimated via EIP-1559 (falls back to legacy if `gasPrice` is explicitly provided).

**Send 10 XRP:**
```json
{ "coin": "xrp", "to": "rN7d...", "value": "10", "destinationTag": 12345 }
```
XRP auto-fill: sequence number and fee (defaults to 12 drops if estimation fails).

**Important:** The user confirms the transaction details physically on their Trezor device — do not ask for separate confirmation in chat. Just call the tool directly and let the device handle approval.

To send from a non-default account, use `accountIndex` (0-based) or provide an explicit `path`.

If you need to sign without broadcasting, set `"broadcast": false`. The response will contain the signed transaction hex, which you can later broadcast with `trezor_push_transaction`.

### Sign & Verify a Message

**Sign:**
```json
{ "coin": "btc", "path": "m/84'/0'/0'/0/0", "message": "Hello, world!" }
```
Returns `{ "address": "bc1q...", "signature": "base64..." }`.

**Verify:**
```json
{ "coin": "btc", "address": "bc1q...", "message": "Hello, world!", "signature": "base64..." }
```
Returns a success/failure result.

### Broadcast a Pre-Signed Transaction

Use `trezor_push_transaction` when you have a signed transaction hex (e.g., from a `send_transaction` call with `broadcast: false`):
```json
{ "coin": "eth", "tx": "0xf86c..." }
```

## Coin & Path Conventions

Common coins and their default derivation paths:

| Coin | Symbol | Default path | Notes |
|---|---|---|---|
| Bitcoin | `btc` | `m/84'/0'/0'` | Native segwit (bech32). Also: `m/49'` (segwit), `m/44'` (legacy), `m/86'` (taproot) |
| Ethereum | `eth` | `m/44'/60'/0'/0/0` | All EVM chains share coin type `60` |
| Litecoin | `ltc` | `m/84'/2'/0'` | Native segwit default |
| Bitcoin Cash | `bch` | `m/44'/145'/0'` | Legacy only |
| Dogecoin | `doge` | `m/44'/3'/0'` | Legacy only |
| Zcash | `zec` | `m/44'/133'/0'` | Legacy only |
| XRP | `xrp` | `m/44'/144'/0'/0/0` | |
| Solana | `sol` | `m/44'/501'/0'/0'` | Requires full `transaction` object |
| Cardano | `ada` | `m/1852'/1815'/0'` | Requires full `transaction` object |
| Stellar | `xlm` | `m/44'/148'/0'` | Requires full `transaction` object |

For the full list of supported coins (including testnets, EVM L2s, and decimals), see `references/tools-reference.md`.

## Safety & Confirmation Model

- **All signing and sending operations require physical confirmation on the Trezor device.** This is the primary safety gate — no transaction can be signed without the user pressing a button on their hardware wallet.
- **Read-only tools** (`get_account_info`, `get_address` without `showOnTrezor`, `verify_message`) do not require device interaction.
- **Do not ask for confirmation in chat before calling tools.** The Trezor device is the confirmation mechanism — the user reviews and approves every transaction on the device screen. Asking in chat is redundant and slows down the workflow. Just call the tool directly.
- The MCP server only accepts connections from localhost — it cannot be accessed remotely.

## Troubleshooting

| Problem | Cause | Fix |
|---|---|---|
| "Connection refused" | MCP server not enabled or Trezor Suite not running | Open Trezor Suite → Settings → Debug → enable MCP Server |
| "Failed to reconnect" / server unreachable | Suite crashed or port conflict | Restart Trezor Suite, verify nothing else uses port 21340 |
| HTTP 404 "Session not found" | Session expired (Suite was restarted) | Re-initialize: send a new `initialize` request. In Claude Code, restart the MCP connection via `/mcp` |
| Tool call hangs / times out | User hasn't confirmed on Trezor device | Check the Trezor device screen — it is waiting for button press |
| HTTP 403 Forbidden | Request not from localhost | Ensure the MCP client is running on the same machine as Trezor Suite |
| "Unknown coin" error | Unsupported coin symbol or typo | Check the supported coins table in `references/tools-reference.md` |

## References

For detailed tool parameters, all supported coins with paths and decimals, example JSON-RPC payloads, transaction auto-fill details, and error codes, read `references/tools-reference.md`.
