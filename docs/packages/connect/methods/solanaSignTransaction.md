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

### Example

```javascript
TrezorConnect.solanaSignTransaction({
    path: "m/44'/501'/0'/0'",
    serializedTx:
        '0200030500d1699dcb1811b50bb0055f13044463128242e37a463b52f6c97a1f6eef88ad8c72b471e11674bdcd1e5f85421be42097d5d9c8642172ab73ccf6ff003a43f3000000000000000000000000000000000000000000000000000000000000000006a1d8179137542a983437bdfe2a7ab2557f535c8a78722b68a49dc00000000006a7d517192c5c51218cc94c3d4af17f58daee089ba1fd44e3dbd98a000000001aea57c9906a7cad656ff61b3893abda63f4b6b210c939855e7ab6e54049213d02020200013400000000002d310100000000e80300000000000006a1d8179137542a983437bdfe2a7ab2557f535c8a78722b68a49dc00000000003020104740000000000d1699dcb1811b50bb0055f13044463128242e37a463b52f6c97a1f6eef88ad00d1699dcb1811b50bb0055f13044463128242e37a463b52f6c97a1f6eef88ad000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
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
