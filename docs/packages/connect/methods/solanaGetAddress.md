## Solana: get address

Display requested address derived by given [BIP44 path](../path.md) on device and return it to the caller. User is presented with a description of the requested address and asked to confirm the export on Trezor.

```javascript
const result = await TrezorConnect.solanaGetAddress(params);
```

### Params

[Optional common params](commonParams.md)

[GetAddress type](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/src/types/params.ts)

#### Exporting single address

-   `path` — _required_ `string | Array<number>` minimum length is `2`. [read more](../path.md)
-   `address` — _required_ `string` address for validation (read `Handle button request` section below)
-   `showOnTrezor` — _optional_ `boolean` determines if address will be displayed on device. Default is set to `true`
-   `chunkify` — _optional_ `boolean` determines if address will be displayed in chunks of 4 characters. Default is set to `false`

#### Exporting bundle of addresses

-   `bundle` - `Array` of Objects with `path` and `showOnTrezor` fields

#### Handle button request

Since trezor-connect@6.0.4 there is a possibility to handle `UI.ADDRESS_VALIDATION` event which will be triggered once the address is displayed on the device.
You can handle this event and display custom UI inside of your application.

If certain conditions are fulfilled popup will not be used at all:

-   the user gave permissions to communicate with Trezor
-   device is authenticated by pin/passphrase
-   application has `TrezorConnect.on(UI.ADDRESS_VALIDATION, () => {});` listener registered
-   parameter `address` is set
-   parameter `showOnTrezor` is set to `true` (or not set at all)
-   application is requesting ONLY ONE(!) address

### Example

Display address of first Solana account:

```javascript
TrezorConnect.solanaGetAddress({
    path: "m/44'/501'/0'/0'",
});
```

Return a bundle of Solana addresses without displaying them on device:

```javascript
TrezorConnect.solanaGetAddress({
    bundle: [
        { path: "m/44'/501'/0'", showOnTrezor: false }, // account 1
        { path: "m/44'/501'/1'", showOnTrezor: false }, // account 2
        { path: "m/44'/501'/2'", showOnTrezor: false }, // account 3
    ],
});
```

### Result

[SolanaGetAddress type](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/src/types/api/solana/index.ts)

Result with only one address

```javascript
{
    success: true,
    payload: {
        path: Array<number>, // hardended path
        serializedPath: string,
        address: string,
    }
}
```

Result with a bundle of addresses

```javascript
{
    success: true,
    payload: [
        { path: Array<number>, serializedPath: string, address: string }, // account 1
        { path: Array<number>, serializedPath: string, address: string }, // account 2
        { path: Array<number>, serializedPath: string, address: string }  // account 3
    ]
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
