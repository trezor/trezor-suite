## NEM: Sign transaction

Asks device to sign given transaction. User is asked to confirm all transaction
details on Trezor.

```javascript
const result = await TrezorConnect.nemSignTransaction(params);
```

### Params

[Optional common params](commonParams.md)

[NEMSignTransaction type](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/src/types/api/nem/index.ts)

-   `path` - _required_ `string | Array<number>`
-   `transaction` - _required_ `Object` type of [NEMTransaction](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/src/types/api/nem/index.ts)
-   `chunkify` — _optional_ `boolean` determines if recipient address will be displayed in chunks of 4 characters. Default is set to `false`

### Example

Sign simple transaction

```javascript
// common utility for hexlify message
function hexlify(str) {
    var result = '';
    var padding = '00';
    for (var i=0, l=str.length; i<l; i++) {
        var digit = str.charCodeAt(i).toString(16);
        var padded = (padding+digit).slice(-2);
        result += padded;
    }
    return result;
}

TrezorConnect.nemSignTransaction(
    path: "m/44'/1'/0'/0'/0'",
    transaction: {
        timeStamp: 74649215,
        amount: 2000000,
        fee: 2000000,
        recipient: "TALICE2GMA34CXHD7XLJQ536NM5UNKQHTORNNT2J",
        type: 257,
        deadline: 74735615,
        version: (0x98 << 24),
        message: {
            payload: hexlify('test_nem_transaction_transfer'),
            type: 1,
        },
    }
});
```

Sign mosaic transaction

```javascript
TrezorConnect.nemSignTransaction(
    path: "m/44'/1'/0'/0'/0'",
    transaction: {
        timeStamp: 76809215,
        amount: 1000000,
        fee: 1000000,
        recipient: "TALICE2GMA34CXHD7XLJQ536NM5UNKQHTORNNT2J",
        type: 257,
        deadline: 76895615,
        version: (0x98 << 24),
        message: {},
        mosaics: [
            {
                mosaicId: {
                    namespaceId: "nem",
                    name: "xem",
                },
                quantity: 1000000,
            }
        ]
    }
});
```

### Result

[NEMSignedTx type](https://github.com/trezor/trezor-suite/blob/develop/packages/protobuf/src/messages.ts)

```javascript
{
    success: true,
    payload: {
        data: string,
        signature: string,
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
