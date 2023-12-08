## Solana: Sign transaction

Asks device to sign given transaction. User is asked to confirm all transaction details on Trezor.

```javascript
const result = await TrezorConnect.solanaSignTransaction(params);
```

### Params

[Optional common params](commonParams.md)

[SolanaSignTransaction type](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/src/types/api/solana/index.ts)

-   `path` — _required_ `string | Array<number>` minimum length is `2`. [read more](../path.md)
-   `serializedTx` — _required_ `string`
-   `additionalInfo` - _optional_ [SolanaTxAdditionalInfo](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/src/types/api/solana/index.ts#L18)
    -   `tokenAccountsInfos` - _optional_ `Array` of [SolanaTxTokenAccountInfo](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/src/types/api/solana/index.ts#L11)

### SolanaTxAdditionalInfo

The parameter is currently used only for sending `tokenAccountsInfos` to Trezor. `tokenAccountsInfos` are used when transferring tokens to associated token accounts. Using `tokenAccountsInfos` you can provide Trezor information about the recipient's base (system) account of the associated token account and Trezor can then safely display the base account address to the user instead of displaying the token account address which most users don't even know about.

_Displaying base address only works for transactions which transfer tokens or which create a token account and transfer tokens to that account._

### Examples

```javascript
TrezorConnect.solanaSignTransaction({
    path: "m/44'/501'/0'/0'",
    serializedTx:
        '0200030500d1699dcb1811b50bb0055f13044463128242e37a463b52f6c97a1f6eef88ad8c72b471e11674bdcd1e5f85421be42097d5d9c8642172ab73ccf6ff003a43f3000000000000000000000000000000000000000000000000000000000000000006a1d8179137542a983437bdfe2a7ab2557f535c8a78722b68a49dc00000000006a7d517192c5c51218cc94c3d4af17f58daee089ba1fd44e3dbd98a000000001aea57c9906a7cad656ff61b3893abda63f4b6b210c939855e7ab6e54049213d02020200013400000000002d310100000000e80300000000000006a1d8179137542a983437bdfe2a7ab2557f535c8a78722b68a49dc00000000003020104740000000000d1699dcb1811b50bb0055f13044463128242e37a463b52f6c97a1f6eef88ad00d1699dcb1811b50bb0055f13044463128242e37a463b52f6c97a1f6eef88ad000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
});
```

If you try the following request with the `all all ...` mnemonic you should see `BVRFH6vt5bNXub6WnnFRgaHFTcbkjBrf7x1troU1izGg` as the recipient although the tokens are really transferred to `J5rhFGUkeoHVnCvMyqWq1XPjfU1G1hsTh9tTQtST2out` (the associated token account of `BVRFH6vt5bNXub6WnnFRgaHFTcbkjBrf7x1troU1izGg`).

```javascript
TrezorConnect.solanaSignTransaction({
    path: "m/44'/501'/0'/0'",
    serializedTx:
        '0100040700d1699dcb1811b50bb0055f13044463128242e37a463b52f6c97a1f6eef88ad9bdc8c11af6a471f7373e52c917aac6304c71796b97b47350d46cf4c54bae9d9fdd530a73d5e74613b17aaeb9346f9fc3c5fd6a7ad126b269e3e73454e2a0b1b000000000000000000000000000000000000000000000000000000000000000081432588d91c8e02d613baa94e05994e78467cf5a8821d8f4c2e373e8b9b56ef8c97258f4e2489f1bb3d1029148e0d830b5a1399daff1084048e7bd8dbe9f85906ddf6e1d765a193d9cbe146ceeb79ac1cb485ed5f5b37913a8cf5857eff00a91aea57c9906a7cad656ff61b3893abda63f4b6b210c939855e7ab6e54049213d020506000201040306000604010402000a0c0b0000000000000009',
    additionalInfo: {
        tokenAccountsInfos: [
            {
                baseAddress: 'BVRFH6vt5bNXub6WnnFRgaHFTcbkjBrf7x1troU1izGg',
                tokenProgram: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
                tokenMint: '9hayiPmEobVfiTbw5R91StWeQzw9EJGfswLH5o33UDAW',
                tokenAccount: 'J5rhFGUkeoHVnCvMyqWq1XPjfU1G1hsTh9tTQtST2out',
            },
        ],
    },
});
```

### Result

[SolanaSignedTransaction type](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/src/types/api/solana/index.ts)

```javascript
{
    success: true,
    payload: {
        signature: string
    }
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
