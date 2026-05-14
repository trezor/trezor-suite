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
3. **MCP server enabled**: Settings → Experimental Features → enable experimental features → check **MCP Server**

Once enabled, the server listens at `http://127.0.0.1:21340/mcp` (localhost only).

### Client Configuration

Replace `<token>` with the token shown in the Trezor Suite config snippet (Settings → Experimental Features → MCP Server). The token is passed as a URL query parameter — no custom headers needed.

**Claude Code** — run in your terminal:

```bash
claude mcp add trezor-suite http://127.0.0.1:21340/mcp?token=<token> -t http
```

This adds the server to the current project (local scope). To make it available in all projects, add `-s user`. If you see "SDK auth failed", see the troubleshooting section below for the `mcp-remote` workaround.

**Claude Desktop** — add this to `claude_desktop_config.json` (requires Node.js for `npx`):

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

Claude Desktop only supports stdio transport, so `mcp-remote` acts as a bridge: it spawns a local process that translates between stdio and the Trezor Suite HTTP server. The `--allow-http` flag is required because the server runs on localhost over HTTP (not HTTPS). The `--transport http-only` flag skips SSE transport attempts.

**Other MCP clients** — add this JSON to your client config:

```json
{
    "mcpServers": {
        "trezor-suite": {
            "url": "http://127.0.0.1:21340/mcp?token=<token>"
        }
    }
}
```

| Client                | Config file                       |
| --------------------- | --------------------------------- |
| **VS Code (Copilot)** | `.vscode/mcp.json` in workspace   |
| **Cursor**            | Cursor Settings → MCP → add URL   |
| **Windsurf**          | Windsurf Settings → MCP → add URL |

### Verifying the Connection

- **Claude Code**: run `/mcp` to see connected servers
- **Manual test**: `curl -X POST http://127.0.0.1:21340/mcp -H "Content-Type: application/json" -H "Authorization: Bearer <token>" -d '{"jsonrpc":"2.0","id":"1","method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}}}'`

A successful response returns `protocolVersion` and `serverInfo`.

## Available Tools — Quick Reference

| Tool                      | Description                                | Device confirmation?         |
| ------------------------- | ------------------------------------------ | ---------------------------- |
| `trezor_get_address`      | Get a receive address for a coin           | Only if `showOnTrezor: true` |
| `trezor_get_public_key`   | Get extended public key (xpub)             | No                           |
| `trezor_get_account_info` | Get balance, transactions, UTXOs           | No                           |
| `trezor_send_transaction` | Compose, sign, and broadcast a transaction | Yes                          |
| `trezor_push_transaction` | Broadcast a pre-signed transaction         | No                           |
| `trezor_sign_message`     | Sign a message with a device key           | Yes                          |
| `trezor_verify_message`   | Verify a signed message                    | No                           |
| `trezor_sign_typed_data`  | Sign EIP-712 typed data (EVM)              | Yes                          |

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

### Common Stablecoin Contracts

When the user asks to send stablecoins, **always ask which stablecoin and which network** before proceeding — never assume.

**IMPORTANT: Never show the user any of the following — contract addresses, hex data, calldata encoding, function selectors, decimal conversions, or any implementation details. The user should only see: "Sending X USDT to [address] on Ethereum. Please confirm on your Trezor device." Nothing more.**

Call `trezor_send_transaction` with `tokenContract` and `tokenDecimals` — the server encodes the ERC-20 transfer calldata automatically. No hex encoding needed.

- `coin`: the network — `"eth"` for Ethereum, `"base"` for Base
- `to`: the **recipient address**
- `value`: token amount in human units (e.g. `"10"` for 10 USDC)
- `tokenContract`: the token's contract address
- `tokenDecimals`: the token's decimal places

**Example — send 10 USDC on Ethereum:**

```json
{
    "coin": "eth",
    "to": "0xRecipientAddress",
    "value": "10",
    "tokenContract": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    "tokenDecimals": 6
}
```

The server handles calldata encoding, nonce, EIP-1559 fees, gas limit, signing, and broadcasting.

**Ethereum (`eth`) contracts:**

- USDC: `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48` (6 decimals)
- USDT: `0xdAC17F958D2ee523a2206206994597C13D831ec7` (6 decimals)
- DAI: `0x6B175474E89094C44Da98b954EedeAC495271d0F` (18 decimals)

**Base (`base`) contracts:**

- USDC: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` (6 decimals)
- DAI: `0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb` (18 decimals)

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

### Sign EIP-712 Typed Data

Use `trezor_sign_typed_data` to sign EIP-712 structured data on EVM chains. Common use cases include token permits (EIP-2612), NFT marketplace orders, and DAO governance votes.

**EIP-2612 permit example (approve USDC spending without a transaction):**

```json
{
    "data": {
        "types": {
            "EIP712Domain": [
                { "name": "name", "type": "string" },
                { "name": "version", "type": "string" },
                { "name": "chainId", "type": "uint256" },
                { "name": "verifyingContract", "type": "address" }
            ],
            "Permit": [
                { "name": "owner", "type": "address" },
                { "name": "spender", "type": "address" },
                { "name": "value", "type": "uint256" },
                { "name": "nonce", "type": "uint256" },
                { "name": "deadline", "type": "uint256" }
            ]
        },
        "primaryType": "Permit",
        "domain": {
            "name": "USD Coin",
            "version": "2",
            "chainId": 1,
            "verifyingContract": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
        },
        "message": {
            "owner": "0xYourAddress",
            "spender": "0xSpenderContract",
            "value": "1000000",
            "nonce": "0",
            "deadline": "1735689600"
        }
    }
}
```

The `path` is auto-derived for Ethereum (account index 0) if omitted. Use `accountIndex` to select a different account, or provide an explicit `path`.

### Broadcast a Pre-Signed Transaction

Use `trezor_push_transaction` when you have a signed transaction hex (e.g., from a `send_transaction` call with `broadcast: false`):

```json
{ "coin": "eth", "tx": "0xf86c..." }
```

## Coin & Path Conventions

Common coins and their default derivation paths:

| Coin         | Symbol | Default path        | Notes                                                                               |
| ------------ | ------ | ------------------- | ----------------------------------------------------------------------------------- |
| Bitcoin      | `btc`  | `m/84'/0'/0'`       | Native segwit (bech32). Also: `m/49'` (segwit), `m/44'` (legacy), `m/86'` (taproot) |
| Ethereum     | `eth`  | `m/44'/60'/0'/0/0`  | All EVM chains share coin type `60`                                                 |
| Litecoin     | `ltc`  | `m/84'/2'/0'`       | Native segwit default                                                               |
| Bitcoin Cash | `bch`  | `m/44'/145'/0'`     | Legacy only                                                                         |
| Dogecoin     | `doge` | `m/44'/3'/0'`       | Legacy only                                                                         |
| Zcash        | `zec`  | `m/44'/133'/0'`     | Legacy only                                                                         |
| XRP          | `xrp`  | `m/44'/144'/0'/0/0` |                                                                                     |
| Solana       | `sol`  | `m/44'/501'/0'/0'`  | Requires full `transaction` object                                                  |
| Cardano      | `ada`  | `m/1852'/1815'/0'`  | Requires full `transaction` object                                                  |
| Stellar      | `xlm`  | `m/44'/148'/0'`     | Requires full `transaction` object                                                  |

For the full list of supported coins (including testnets, EVM L2s, and decimals), see `references/tools-reference.md`.

## Safety & Confirmation Model

- **All signing and sending operations require physical confirmation on the Trezor device.** This is the primary safety gate — no transaction can be signed without the user pressing a button on their hardware wallet.
- **Read-only tools** (`get_account_info`, `get_address` without `showOnTrezor`, `verify_message`) do not require device interaction.
- **Do not ask for confirmation in chat before calling tools.** The Trezor device is the confirmation mechanism — the user reviews and approves every transaction on the device screen. Asking in chat is redundant and slows down the workflow. Just call the tool directly.
- The MCP server only accepts connections from localhost — it cannot be accessed remotely.
- **Bearer token authentication** is required on every request. The token is auto-generated when MCP is first enabled and included in the config snippet. Requests without a valid `Authorization: Bearer <token>` header receive HTTP 401.

## Agent Recovery: MCP Tools Not Available

If the Trezor MCP tools are not showing up as connected tools, follow these steps **in order** — do NOT fall back to raw HTTP/curl:

1. **Retry the MCP connection.** In Claude Code, run `/mcp` to reconnect. The server may have just started.
2. **If still not connected, tell the user the auth token is likely missing or wrong.** Say: _"The Trezor MCP server isn't connected. Please check that the Bearer token in your MCP client config matches the one shown in Trezor Suite → Settings → Experimental Features → MCP Server. Copy the full config snippet and paste it into `~/.claude.json` (or your MCP client config), then restart the MCP connection."_
3. **If the user confirms the token is correct, check the basics:** Is Trezor Suite running? Is the MCP server toggle enabled in Settings → Experimental Features?
4. **Never bypass the MCP protocol** by sending raw HTTP requests to the server. Always use the MCP tools through the proper MCP client connection.

## Troubleshooting

| Problem                                    | Cause                                              | Fix                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ------------------------------------------ | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| "Connection refused"                       | MCP server not enabled or Trezor Suite not running | Open Trezor Suite → Settings → Experimental Features → enable MCP Server                                                                                                                                                                                                                                                                                                                                                 |
| "Failed to reconnect" / server unreachable | Suite crashed or port conflict                     | Restart Trezor Suite, verify nothing else uses port 21340                                                                                                                                                                                                                                                                                                                                                                |
| HTTP 404 "Session not found"               | Session expired (Suite was restarted)              | Re-initialize: send a new `initialize` request. In Claude Code, restart the MCP connection via `/mcp`                                                                                                                                                                                                                                                                                                                    |
| Tool call hangs / times out                | User hasn't confirmed on Trezor device             | Check the Trezor device screen — it is waiting for button press                                                                                                                                                                                                                                                                                                                                                          |
| HTTP 401 Unauthorized                      | Missing or invalid token                           | Provide the token via `?token=` query parameter in the URL or `Authorization: Bearer <token>` header. The token is auto-generated and shown in Trezor Suite under Settings → Experimental Features → MCP Server. Copy the full config snippet into your MCP client config. If you recently re-enabled MCP, the token may have changed.                                                                                   |
| HTTP 403 Forbidden                         | Request not from localhost                         | Ensure the MCP client is running on the same machine as Trezor Suite                                                                                                                                                                                                                                                                                                                                                     |
| "Unknown coin" error                       | Unsupported coin symbol or typo                    | Check the supported coins table in `references/tools-reference.md`                                                                                                                                                                                                                                                                                                                                                       |
| "not valid MCP server" (Claude Desktop)    | Missing `mcp-remote` bridge config                 | Claude Desktop only supports stdio transport. Use the `mcp-remote` bridge config (see Claude Desktop section above). Ensure Node.js is installed for `npx`.                                                                                                                                                                                                                                                              |
| "SDK auth failed" (Claude Code or Desktop) | Direct HTTP transport triggers OAuth               | Claude Code's HTTP transport has a known issue where it tries OAuth before sending headers. Use `mcp-remote` bridge instead of direct HTTP: `claude mcp add-json trezor-suite '{"command":"npx","args":["mcp-remote","http://127.0.0.1:21340/mcp?token=<token>","--transport","http-only","--allow-http"]}'`. Also check `~/.claude.json` for old `"type":"http"` entries and replace them with the `mcp-remote` config. |
| "Session not found" after reconnect        | Stale session from previous connection             | Toggle MCP off and on in Trezor Suite to reset the session, then reconnect the client.                                                                                                                                                                                                                                                                                                                                   |

## References

For detailed tool parameters, all supported coins with paths and decimals, example JSON-RPC payloads, transaction auto-fill details, and error codes, read `references/tools-reference.md`.
