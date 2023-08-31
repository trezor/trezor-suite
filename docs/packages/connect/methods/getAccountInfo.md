## Get account info

Gets an info of specified account.

```javascript
const result = await TrezorConnect.getAccountInfo(params);
```

### Params

[Optional common params](commonParams.md)

#### Using path

-   `path` — _required_ `string | Array<number>` minimum length is `3`. [read more](../path.md)
-   `coin` — _required_ `string` determines network definition specified in [coins.json](https://github.com/trezor/trezor-suite/blob/develop/packages/connect-common/files/coins.json) file. Coin `shortcut`, `name` or `label` can be used.

#### Using public key

-   `descriptor` — _required_ `string` public key of account
-   `coin` — _required_ `string` determines network definition specified in [coins.json](https://github.com/trezor/trezor-suite/blob/develop/packages/connect-common/files/coins.json) file. Coin `shortcut`, `name` or `label` can be used.

#### Using discovery

BIP-0044 account discovery is performed and user is presented with a list of accounts. Result is returned after account selection.

-   `coin` — _required_ `string` determines network definition specified in [coins.json](https://github.com/trezor/trezor-suite/blob/develop/packages/connect-common/files/coins.json) file. Coin `shortcut`, `name` or `label` can be used.

### Other optional params

params are forwarded to [BlockBook backend](https://github.com/trezor/blockbook/blob/master/docs/api.md#api-v2) using `@trezor/blockchain-link` package

-   `details` — specifies level of details returned by request

    -   `basic` (default) return only account balances, without any derived addresses or transaction history
    -   `tokens` - response with derived addresses (Bitcoin-like accounts) and ERC20 tokens (Ethereum-like accounts), subject of `tokens` param
    -   `tokenBalances` - same as `tokens` with balances, subject of `tokens` param
    -   `txs` - `tokenBalances` + complete account transaction history

-   `tokens` — specifies which tokens (xpub addresses) are returned by the request (default nonzero)

    -   `nonzero` - (Default) return only addresses with nonzero balance
    -   `used` - return addresses with at least one transaction
    -   `derived` - return all derived addresses

-   `page` — `number` transaction history page index, subject of `details: txs`
-   `pageSize` — `number` transaction history page size, subject of `details: txs`
-   `from` — `number` transaction history from block filter, subject of `details: txs`
-   `to` — `number` transaction history to block filter, subject of `details: txs`
-   `gap` — `number` address derivation gap size, subject of `details: tokens`
-   `contractFilter` — `string` Ethereum-like accounts only: get ERC20 token info and balance
-   `marker` — `{ ledger: number, seq: number }` XRP accounts only, transaction history page marker
-   `defaultAccountType` — `'normal' | 'segwit' | 'legacy'` Bitcoin-like accounts only: specify which account group is displayed as default in popup, subject of `Using discovery`
-   `suppressBackupWarning` - `boolean` By default, this method will emit an event to show a warning if the wallet does not have a backup. This option suppresses the message.

### Example

Get info about first bitcoin account

```javascript
TrezorConnect.getAccountInfo({
    path: "m/49'/0'/0'",
    coin: 'btc',
});
```

Get info about account using public key (device is not used)

```javascript
TrezorConnect.getAccountInfo({
    descriptor:
        'xpub6CVKsQYXc9awxgV1tWbG4foDvdcnieK2JkbpPEBKB5WwAPKBZ1mstLbKVB4ov7QzxzjaxNK6EfmNY5Jsk2cG26EVcEkycGW4tchT2dyUhrx',
    coin: 'btc',
});
```

Get info about account using BIP-0044 account discovery

```javascript
TrezorConnect.getAccountInfo({
    coin: 'btc',
});
```

### Result

[AccountInfo type](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/src/types/account.ts)

```javascript
{
    success: true,
    payload: {
        id: number,                           // account id
        path: string,                         // serialized path
        descriptor: string,                   // account public key
        legacyXpub?: string,                  // (optional) account public key in legacy format (only for segwit and segwit native accounts)
        balance: string,                      // account balance (confirmed transactions only)
        availableBalance: string,             // account balance (including unconfirmed transactions)
        addresses: {
            // subject of details:tokens param
            unused: Array<AccountAddress>, // unused addresses
            used: Array<AccountAddress>,   // used addresses
            change: Array<AccountAddress>, // change addresses (internal)
        }, // list of derived addresses grouped by purpose (Bitcoin-like accounts)
        history: Array<{
            total: number,
            unconfirmed: number,
            transactions?: Array<AccountTransaction>, // subject of details:txs param
        }> // account history object
        utxo?: Array<AccountUtxo>, // account utxos (Bitcoin-like accounts), subject of details:tokens param
        tokens?: Array<TokenInfo>, // account ERC20 tokens (Ethereum-like accounts), subject of details:tokens param
        misc?: {
            // Ethereum-like accounts only
            nonce: string,
            erc20Contract?: TokenInfo, // subject of contractFilter param
            // XRP accounts only
            sequence?: number,
            reserve?: string,
        },
        page?: {
            // subject of details:txs param
            index: number, // current page index
            size: number,  // current page size
            total: number, // total pages count
        },
        marker?: {
            // XRP accounts only
            // subject of details:txs param
            ledger: number,
            seq: number,
        }

    } //
}
```

Error

```javascript
{
    success: false,
    payload: {
        error: string // error message
    }
}
```
