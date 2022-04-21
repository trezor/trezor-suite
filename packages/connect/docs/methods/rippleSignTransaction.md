## Ripple: Sign transaction

Asks device to sign given transaction. User is asked to confirm all transaction
details on Trezor.

ES6

```javascript
const result = await TrezorConnect.rippleSignTransaction(params);
```

CommonJS

```javascript
TrezorConnect.rippleSignTransaction(params).then(function (result) {});
```

### Params

[\***\*Optional common params\*\***](commonParams.md)

###### [flowtype](../../src/js/types/params.js#L149-L154)

-   `path` — _required_ `string | Array<number>` minimum length is `3`. [read more](path.md)
-   `transaction` - _required_ `Object` type of [RippleTransaction](../../src/js/types/ripple.js#L36-L42)

### Example

```javascript
TrezorConnect.rippleSignTransaction(
    path: "m/44'/144'/0'/0/0",
    transaction: {
        fee: '100000',
        flags: 0x80000000,
        sequence: 25,
        payment: {
            amount: '100000000',
            destination: 'rBKz5MC2iXdoS3XgnNSYmF69K1Yo4NS3Ws'
        }
    }
});
```

### Result

###### [flowtype](../../src/js/types/ripple.js#L49-L52)

```javascript
{
    success: true,
    payload: {
        serializedTx: string,
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
