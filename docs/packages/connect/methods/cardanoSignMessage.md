## Cardano: Sign message

Asks device to sign given message. User is presented with the first few bytes of the message and the hash of the whole message. User is asked to confirm details on Trezor.

```javascript
const result = await TrezorConnect.cardanoSignMessage(params);
```

### Params

[Optional common params](commonParams.md)

[CardanoSignMessage type](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/src/types/api/cardano/index.ts)

-   `signingPath` - _required_ `string | Array<number>` minimum length is `5`. [read more](../path.md)
-   `payload` - _required_ `string` message bytes in hex.
-   `hashPayload` - _required_ `boolean` if true, device will hash the payload before signing. Must be enabled if payload exceeds 1024 bytes.
-   `preferHexDisplay` - _optional_ `boolean` if true, device will always decode payload as hex bytes.
-   `networkId` - _optional_ `number` network identifier. Required if `addressParameters` are set.
-   `protocolMagic` - _optional_ `number` protocol magic. Required if `addressParameters` are set.
-   `addressParameters` - _optional_ `CardanoAddressParameters` object. [read more](./cardanoGetAddress.md#address-parameters) Used to derive address for message header. If not set then the key hash given by `signingPath` will be used instead.
-   `derivationType` — _optional_ `CardanoDerivationType` enum. determines used derivation type. Default is set to ICARUS_TREZOR=2

### Displaying payload

If `hashPayload` is `true`, the device will display just the first 56 bytes of the payload. Otherwise 1024 bytes are displayed.

By default, the payload is decoded as ASCII given the conditions below are satisfied. If they are not satisfied or `preferHexDisplay` is `true`, the payload is displayed as hex bytes. The ASCII conditions are:

-   The payload is a valid ASCII string.
-   It must be clear to the user what the contents of the payload are, specifically there is:
    -   At least one character
    -   No control characters
    -   No leading, trailing nor multiple consecutive spaces

### Example

Sign hash of "Hello Trezor!":

```javascript
TrezorConnect.cardanoSignMessage({
    signingPath: "m/1852'/1815'/0'/0/0",
    payload: '48656c6c6f205472657a6f7221', // "Hello Trezor!" in hex
    hashPayload: true,
    preferHexDisplay: false,
});
```

Sign hash of "Hello Trezor!" using address parameters for header:

```javascript
TrezorConnect.cardanoSignMessage({
    signingPath: "m/1852'/1815'/0'/0/0",
    payload: '48656c6c6f205472657a6f7221', // "Hello Trezor!" in hex
    hashPayload: true,
    preferHexDisplay: false,
    networkId: 1,
    protocolMagic: 764824073,
    addressParameters: {
        addressType: 0,
        path: "m/1852'/1815'/0'/0/0",
        stakingPath: "m/1852'/1815'/0'/2/0",
    },
});
```

### Result

[CardanoSignedMessage type](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/src/types/api/cardano/index.ts)

```javascript
{
    success: true,
    payload: {
      signature: string,
      payload: string,
      pubKey: string,
      headers: {
        protected: {
          1: -8, // EdDSA algorithm
          address: string,
        },
        unprotected: {
          hashed: boolean,
          version: number,
        }
      }
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
