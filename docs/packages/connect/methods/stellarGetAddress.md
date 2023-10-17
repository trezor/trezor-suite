## Stellar: get address

Display requested address on device and returns it to caller. User is presented with a description of the requested key and asked to confirm the export.

```javascript
const result = await TrezorConnect.stellarGetAddress(params);
```

### Params

[Optional common params](commonParams.md)

#### Exporting single address

-   `path` — _required_ `string | Array<number>` minimum length is `3`. [read more](../path.md)
-   `address` — _optional_ `string` address for validation (read `Handle button request` section below)
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

Display address of first stellar account:

```javascript
TrezorConnect.stellarGetAddress({
    path: "m/44'/148'/0'",
});
```

Return a bundle of stellar addresses without displaying them on device:

```javascript
TrezorConnect.stellarGetAddress({
    bundle: [
        { path: "m/44'/148'/0'", showOnTrezor: false }, // account 1
        { path: "m/44'/148'/1'", showOnTrezor: false }, // account 2
        { path: "m/44'/148'/2'", showOnTrezor: false }, // account 3
    ],
});
```

Validate address using custom UI inside of your application:

```javascript
import TrezorConnect, { UI } from '@trezor/connect';

TrezorConnect.on(UI.ADDRESS_VALIDATION, data => {
    console.log('Handle button request', data.address, data.serializedPath);
    // here you can display custom UI inside of your app
});

const result = await TrezorConnect.stellarGetAddress({
    path: "m/44'/148'/0'/0/0",
    address: 'GAXSFOOGF4ELO5HT5PTN23T5XE6D5QWL3YBHSVQ2HWOFEJNYYMRJENBV',
});
// dont forget to hide your custom UI after you get the result!
```

### Result

[Address type](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/src/types/params.ts)

Result with only one address

```javascript
{
    success: true,
    payload: {
        address: string,
        path: Array<number>,
        serializedPath: string,
    }
}
```

Result with bundle of addresses

```javascript
{
    success: true,
    payload: [
        { address: string, path: Array<number>, serializedPath: string }, // account 1
        { address: string, path: Array<number>, serializedPath: string }, // account 2
        { address: string, path: Array<number>, serializedPath: string }, // account 3
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
