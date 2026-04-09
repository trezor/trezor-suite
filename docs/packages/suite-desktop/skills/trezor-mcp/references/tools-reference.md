# Trezor MCP Tools Reference

Detailed parameter reference, example payloads, supported coins, and error codes for the Trezor Suite MCP server.

**Server endpoint:** `POST http://127.0.0.1:21340/mcp`
**Authentication:** `Authorization: Bearer <token>` header required on every request
**Protocol:** JSON-RPC 2.0 (Streamable HTTP transport)
**MCP version:** `2025-03-26`

---

## Tool Parameters

### trezor_get_address

Get a receive address from the Trezor device.

| Parameter      | Type    | Required | Default | Description                                           |
| -------------- | ------- | -------- | ------- | ----------------------------------------------------- |
| `coin`         | string  | Yes      | —       | Coin symbol (e.g., `"btc"`, `"eth"`, `"ltc"`)         |
| `path`         | string  | Yes      | —       | BIP44 derivation path (e.g., `"m/84'/0'/0'/0/0"`)     |
| `showOnTrezor` | boolean | No       | `false` | Display the address on device screen for verification |

Automatically selects the correct method (`getAddress` for UTXO coins, `ethereumGetAddress` for EVM chains) based on coin type.

### trezor_get_public_key

Get the extended public key (xpub) for a derivation path.

| Parameter | Type   | Required | Default | Description                                   |
| --------- | ------ | -------- | ------- | --------------------------------------------- |
| `coin`    | string | Yes      | —       | Coin symbol (e.g., `"btc"`, `"ltc"`)          |
| `path`    | string | Yes      | —       | BIP44 derivation path (e.g., `"m/84'/0'/0'"`) |

### trezor_get_account_info

Get account information including balance, transaction history, and UTXOs.

| Parameter    | Type   | Required | Default   | Description                                                                |
| ------------ | ------ | -------- | --------- | -------------------------------------------------------------------------- |
| `coin`       | string | Yes      | —         | Coin symbol                                                                |
| `path`       | string | No       | —         | BIP44 account-level derivation path                                        |
| `descriptor` | string | No       | —         | Account descriptor (xpub for BTC, address for ETH). Alternative to `path`  |
| `details`    | string | No       | `"basic"` | Detail level: `"basic"`, `"tokens"`, `"tokenBalances"`, `"txids"`, `"txs"` |

Provide either `path` or `descriptor` (at least one recommended).

### trezor_send_transaction

Compose, sign, and broadcast a cryptocurrency transaction.

**Common parameters:**

| Parameter      | Type    | Required | Default | Description                                                                   |
| -------------- | ------- | -------- | ------- | ----------------------------------------------------------------------------- |
| `coin`         | string  | Yes      | —       | Coin symbol                                                                   |
| `to`           | string  | Yes\*    | —       | Destination address (\*required for EVM and XRP)                              |
| `value`        | string  | Yes\*    | —       | Amount in native unit, e.g., `"0.1"` for 0.1 ETH (\*required for EVM and XRP) |
| `accountIndex` | number  | No       | `0`     | Account index (0-based). Ignored if `path` is provided                        |
| `path`         | string  | No       | —       | BIP44 path override. Auto-derived from coin + accountIndex if omitted         |
| `broadcast`    | boolean | No       | `true`  | Whether to broadcast after signing                                            |
| `transaction`  | object  | No       | —       | Full transaction object for manual composition                                |

**EVM-specific parameters** (eth, pol, bsc, arb, base, op, avax, etc, tsep, thod):

| Parameter              | Type   | Required | Default                | Description                                                           |
| ---------------------- | ------ | -------- | ---------------------- | --------------------------------------------------------------------- |
| `nonce`                | string | No       | auto-filled            | Transaction nonce                                                     |
| `gasLimit`             | string | No       | `"21000"` / `"100000"` | Gas limit (21000 for transfers, 100000 if `data` present)             |
| `gasPrice`             | string | No       | —                      | Legacy gas price in wei. If set, uses legacy mode instead of EIP-1559 |
| `maxFeePerGas`         | string | No       | auto-estimated         | EIP-1559 max fee per gas in wei                                       |
| `maxPriorityFeePerGas` | string | No       | auto-estimated         | EIP-1559 priority fee in wei                                          |
| `data`                 | string | No       | —                      | Contract call data (hex string)                                       |
| `chainId`              | number | No       | auto-derived           | EVM chain ID                                                          |

**XRP-specific parameters** (xrp, txrp):

| Parameter        | Type   | Required | Default | Description                          |
| ---------------- | ------ | -------- | ------- | ------------------------------------ |
| `destinationTag` | number | No       | —       | Destination tag for XRP transactions |

**UTXO coins** (btc, ltc, bch, doge, zec): Only `coin`, `to`, and `value` are needed. The tool internally calls `composeTransaction` which handles UTXO selection, fee estimation, signing, and broadcasting.

**Other chains** (sol, ada, xlm, trx): Require a full `transaction` object with chain-specific parameters per TrezorConnect docs.

### trezor_push_transaction

Broadcast a signed transaction to the network.

| Parameter | Type   | Required | Default | Description                   |
| --------- | ------ | -------- | ------- | ----------------------------- |
| `coin`    | string | Yes      | —       | Coin symbol                   |
| `tx`      | string | Yes      | —       | Signed transaction hex string |

### trezor_sign_message

Sign a message with a private key on the Trezor device.

| Parameter | Type   | Required | Default | Description                               |
| --------- | ------ | -------- | ------- | ----------------------------------------- |
| `coin`    | string | Yes      | —       | Coin symbol                               |
| `path`    | string | Yes      | —       | BIP44 derivation path for the signing key |
| `message` | string | Yes      | —       | The message to sign                       |

Automatically selects `signMessage` (Bitcoin) or `ethereumSignMessage` (EVM) based on coin type.

### trezor_verify_message

Verify a signed message.

| Parameter   | Type   | Required | Default | Description                               |
| ----------- | ------ | -------- | ------- | ----------------------------------------- |
| `coin`      | string | Yes      | —       | Coin symbol                               |
| `address`   | string | Yes      | —       | Address that allegedly signed the message |
| `message`   | string | Yes      | —       | Original message                          |
| `signature` | string | Yes      | —       | Signature to verify                       |

Automatically selects `verifyMessage` (Bitcoin) or `ethereumVerifyMessage` (EVM) based on coin type.

### trezor_sign_typed_data

Sign EIP-712 typed structured data using the Trezor device (EVM chains only).

| Parameter            | Type    | Required | Default      | Description                                            |
| -------------------- | ------- | -------- | ------------ | ------------------------------------------------------ |
| `path`               | string  | No       | auto-derived | BIP44 derivation path (e.g., `"m/44'/60'/0'/0/0"`)     |
| `accountIndex`       | number  | No       | `0`          | Account index (0-based). Ignored if `path` is provided |
| `data`               | object  | Yes      | —            | EIP-712 typed data object (see structure below)        |
| `metamask_v4_compat` | boolean | No       | `true`       | Use MetaMask V4 compatibility mode for hashing         |

**`data` object structure:**

| Field         | Type   | Required | Description                                                                 |
| ------------- | ------ | -------- | --------------------------------------------------------------------------- |
| `types`       | object | Yes      | Type definitions including `EIP712Domain` and custom types                  |
| `primaryType` | string | Yes      | The primary type being signed (e.g., `"Permit"`, `"Order"`)                 |
| `domain`      | object | Yes      | Domain separator fields (`name`, `version`, `chainId`, `verifyingContract`) |
| `message`     | object | Yes      | The message data matching the `primaryType` schema                          |

If `path` is omitted, it is auto-derived for Ethereum (SLIP-44 coin type `60`) from the given `accountIndex`. For EVM-compatible chains that use a different coin type (for example, Ethereum Classic with coin type `61`), you must provide an explicit `path` matching that chain's derivation scheme.

---

## Example JSON-RPC Payloads

### Initialize Session

```json
{
    "jsonrpc": "2.0",
    "id": "1",
    "method": "initialize",
    "params": {
        "protocolVersion": "2025-03-26",
        "capabilities": {},
        "clientInfo": { "name": "my-agent", "version": "1.0.0" }
    }
}
```

Response (note the `Mcp-Session-Id` header — include it in subsequent requests):

```json
{
    "jsonrpc": "2.0",
    "id": "1",
    "result": {
        "protocolVersion": "2025-03-26",
        "serverInfo": { "name": "trezor-suite-mcp-server", "version": "1.0.0" },
        "capabilities": { "tools": {} }
    }
}
```

### List Tools

```json
{
    "jsonrpc": "2.0",
    "id": "2",
    "method": "tools/list",
    "params": {}
}
```

### Call a Tool

```json
{
    "jsonrpc": "2.0",
    "id": "3",
    "method": "tools/call",
    "params": {
        "name": "trezor_get_account_info",
        "arguments": {
            "coin": "btc",
            "path": "m/84'/0'/0'",
            "details": "basic"
        }
    }
}
```

**Success response:**

```json
{
    "jsonrpc": "2.0",
    "id": "3",
    "result": {
        "content": [
            {
                "type": "text",
                "text": "{\"balance\":\"123456\",\"availableBalance\":\"123456\", ...}"
            }
        ]
    }
}
```

**Error response:**

```json
{
    "jsonrpc": "2.0",
    "id": "3",
    "result": {
        "content": [
            {
                "type": "text",
                "text": "Error: Unknown coin 'xyz' and no explicit 'path' provided."
            }
        ],
        "isError": true
    }
}
```

### Send Transaction (EVM)

```json
{
    "jsonrpc": "2.0",
    "id": "4",
    "method": "tools/call",
    "params": {
        "name": "trezor_send_transaction",
        "arguments": {
            "coin": "eth",
            "to": "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18",
            "value": "0.05"
        }
    }
}
```

### Send Transaction (BTC)

```json
{
    "jsonrpc": "2.0",
    "id": "5",
    "method": "tools/call",
    "params": {
        "name": "trezor_send_transaction",
        "arguments": {
            "coin": "btc",
            "to": "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4",
            "value": "0.001"
        }
    }
}
```

### Sign EIP-712 Typed Data

```json
{
    "jsonrpc": "2.0",
    "id": "6",
    "method": "tools/call",
    "params": {
        "name": "trezor_sign_typed_data",
        "arguments": {
            "data": {
                "types": {
                    "EIP712Domain": [
                        { "name": "name", "type": "string" },
                        { "name": "version", "type": "string" },
                        { "name": "chainId", "type": "uint256" },
                        { "name": "verifyingContract", "type": "address" }
                    ],
                    "Mail": [
                        { "name": "from", "type": "string" },
                        { "name": "to", "type": "string" },
                        { "name": "contents", "type": "string" }
                    ]
                },
                "primaryType": "Mail",
                "domain": {
                    "name": "Example DApp",
                    "version": "1",
                    "chainId": 1,
                    "verifyingContract": "0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC"
                },
                "message": {
                    "from": "Alice",
                    "to": "Bob",
                    "contents": "Hello, Bob!"
                }
            }
        }
    }
}
```

---

## Supported Coins

### Mainnet

| Coin             | Symbol | Default Path        | Decimals | Chain ID | Notes                                                       |
| ---------------- | ------ | ------------------- | -------- | -------- | ----------------------------------------------------------- |
| Bitcoin          | `btc`  | `m/84'/0'/i'`       | 8        | —        | Also: `m/49'` (segwit), `m/44'` (legacy), `m/86'` (taproot) |
| Ethereum         | `eth`  | `m/44'/60'/0'/0/i`  | 18       | 1        |                                                             |
| Polygon          | `pol`  | `m/44'/60'/0'/0/i`  | 18       | 137      |                                                             |
| BNB Smart Chain  | `bsc`  | `m/44'/60'/0'/0/i`  | 18       | 56       |                                                             |
| Arbitrum One     | `arb`  | `m/44'/60'/0'/0/i`  | 18       | 42161    |                                                             |
| Base             | `base` | `m/44'/60'/0'/0/i`  | 18       | 8453     |                                                             |
| Optimism         | `op`   | `m/44'/60'/0'/0/i`  | 18       | 10       |                                                             |
| Avalanche        | `avax` | `m/44'/60'/0'/0/i`  | 18       | 43114    |                                                             |
| Ethereum Classic | `etc`  | `m/44'/61'/0'/0/i`  | 18       | 61       | Note: coin type `61`, not `60`                              |
| Litecoin         | `ltc`  | `m/84'/2'/i'`       | 8        | —        | Also: `m/49'` (segwit), `m/44'` (legacy)                    |
| Bitcoin Cash     | `bch`  | `m/44'/145'/i'`     | 8        | —        |                                                             |
| Dogecoin         | `doge` | `m/44'/3'/i'`       | 8        | —        |                                                             |
| Zcash            | `zec`  | `m/44'/133'/i'`     | 8        | —        |                                                             |
| XRP Ledger       | `xrp`  | `m/44'/144'/i'/0/0` | 6        | —        |                                                             |
| Solana           | `sol`  | `m/44'/501'/i'/0'`  | 9        | —        | Requires full `transaction` object                          |
| Tron             | `trx`  | `m/44'/195'/0'/0/i` | 6        | —        | Requires full `transaction` object                          |
| Cardano          | `ada`  | `m/1852'/1815'/i'`  | 6        | —        | Requires full `transaction` object                          |
| Stellar          | `xlm`  | `m/44'/148'/i'`     | 7        | —        | Requires full `transaction` object                          |

### Testnet

| Coin             | Symbol    | Default Path        | Decimals | Chain ID |
| ---------------- | --------- | ------------------- | -------- | -------- |
| Bitcoin Testnet  | `test`    | `m/84'/1'/i'`       | 8        | —        |
| Bitcoin Regtest  | `regtest` | `m/84'/1'/i'`       | 8        | —        |
| Ethereum Sepolia | `tsep`    | `m/44'/1'/0'/0/i`   | 18       | 11155111 |
| Ethereum Hoodi   | `thod`    | `m/44'/1'/0'/0/i`   | 18       | 560048   |
| Solana Devnet    | `dsol`    | `m/44'/501'/i'/0'`  | 9        | —        |
| XRP Testnet      | `txrp`    | `m/44'/144'/i'/0/0` | 6        | —        |
| Stellar Testnet  | `txlm`    | `m/44'/148'/i'`     | 7        | —        |

In paths above, `i` is the account index (default `0`).

---

## Transaction Auto-Fill Details

### EVM Chains (eth, pol, bsc, arb, base, op, avax, etc)

| Field         | Auto-fill method                                                                                                                                                        |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Nonce**     | Silent `getAccountInfo` call → `misc.nonce`                                                                                                                             |
| **Gas limit** | `21000` for simple transfers, `100000` if `data` is present                                                                                                             |
| **Fees**      | `blockchainEstimateFee` with `{ blocks: [2], feeLevels: 'smart' }` → picks "normal" tier. Falls back to `0x0` if estimation fails (UI allows adjustment before signing) |
| **Chain ID**  | Derived from coin config                                                                                                                                                |
| **Value**     | Converted from native unit (e.g., `"0.1"` ETH) to wei using 18 decimals                                                                                                 |

Default mode is EIP-1559 (`maxFeePerGas` + `maxPriorityFeePerGas`). Switches to legacy mode only if `gasPrice` is explicitly provided.

### XRP

| Field        | Auto-fill method                                                        |
| ------------ | ----------------------------------------------------------------------- |
| **Sequence** | Silent `getAccountInfo` call → `misc.sequence`                          |
| **Fee**      | `blockchainEstimateFee` (no params) → defaults to `12` drops if fails   |
| **Amount**   | Converted from native unit (e.g., `"10"` XRP) to drops using 6 decimals |

### UTXO Coins (btc, ltc, bch, doge, zec)

A single `composeTransaction` call with `push: true` handles everything:

- Account discovery and UTXO selection
- Fee estimation
- Transaction signing
- Broadcasting

No individual fields need to be auto-filled — the entire flow is managed internally.

### Other Chains (sol, ada, xlm, trx)

No auto-fill is available. You must provide a complete `transaction` object with all chain-specific parameters as defined in the TrezorConnect documentation for the corresponding sign method (`solanaSignTransaction`, `cardanoSignTransaction`, `stellarSignTransaction`, `tronSignTransaction`).

---

## Error Codes

### JSON-RPC Errors (HTTP-level)

| Code     | Name             | Meaning                                            |
| -------- | ---------------- | -------------------------------------------------- |
| `-32700` | Parse error      | Malformed JSON in request body                     |
| `-32601` | Method not found | Unknown JSON-RPC method (typo in `"method"` field) |
| `-32602` | Invalid params   | Unknown tool name in `tools/call`                  |

### HTTP Status Codes

| Status | Meaning                                                                                                                               |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| `200`  | Success                                                                                                                               |
| `202`  | Notification accepted (request without `id`)                                                                                          |
| `401`  | Unauthorized — include `Authorization: Bearer <token>` header (token from Trezor Suite Settings → Experimental Features → MCP Server) |
| `403`  | Forbidden — request not from localhost                                                                                                |
| `404`  | Session not found — `Mcp-Session-Id` header doesn't match server session                                                              |
| `405`  | Method not allowed — `GET` is not supported                                                                                           |

### Tool-Level Errors

Returned as successful JSON-RPC responses with `isError: true`:

| Error message                                           | Cause                                          |
| ------------------------------------------------------- | ---------------------------------------------- |
| `"EVM transactions require 'to' and 'value' fields."`   | Missing required fields for EVM send           |
| `"Failed to get account info for nonce: ..."`           | Could not auto-fill nonce                      |
| `"Unknown coin 'xyz' and no explicit 'path' provided."` | Unrecognized coin symbol and no fallback path  |
| `"{COIN} transactions require a 'transaction' object."` | Missing transaction object for sol/ada/xlm/trx |

### Auto-Broadcast Failure

When signing succeeds but broadcast fails, the response has `success: true` with both results:

```json
{
    "success": true,
    "payload": {
        "signed": { "...sign result..." },
        "broadcastError": { "...error details..." }
    }
}
```

Use `trezor_push_transaction` to retry the broadcast manually with the signed transaction hex.

---

## Session Management

- Session ID is generated on the first `initialize` call and returned in the `Mcp-Session-Id` response header
- **All subsequent requests must include the `Mcp-Session-Id` header** — requests that omit it or send a mismatched value are rejected with HTTP 404
- If the server returns HTTP 404 "Session not found", send a new `initialize` request
- Send `DELETE /mcp` with the session header to terminate a session
- Sessions are in-memory only — they do not survive app restarts
