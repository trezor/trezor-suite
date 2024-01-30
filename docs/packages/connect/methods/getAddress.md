## Get address

Display requested address derived by given BIP32 path on device and returns it to caller. User is asked to confirm the export on Trezor.

```javascript
const result = await TrezorConnect.getAddress(params);
```

### Params

[Optional common params](commonParams.md)

#### Exporting single address

-   `path` — _required_ `string | Array<number>` minimum length is `5`. [read more](../path.md)
-   `address` — _optional_ `string` address for validation (read `Handle button request` section below)
-   `showOnTrezor` — _optional_ `boolean` determines if address will be displayed on device. Default is set to `true`
-   `coin` - _optional_ `string` determines network definition specified in [coins.json](https://github.com/trezor/trezor-suite/blob/develop/packages/connect-common/files/coins.json) file. Coin `shortcut`, `name` or `label` can be used. If `coin` is not set API will try to get network definition from `path`.
-   `crossChain` — _optional_ `boolean` Advanced feature. Use it only if you are know what you are doing. Allows to generate address between chains. For example Bitcoin path on Litecoin network will display cross chain address in Litecoin format.
-   `multisig` - _optional_ [MultisigRedeemScriptType](https://github.com/trezor/trezor-suite/blob/develop/packages/protobuf/src/messages.ts), redeem script information (multisig addresses only)
-   `scriptType` - _optional_ [InputScriptType](https://github.com/trezor/trezor-suite/blob/develop/packages/protobuf/src/messages.ts), address script type
-   `unlockPath` - _optional_ [PROTO.UnlockPath](https://github.com/trezor/trezor-suite/blob/develop/packages/protobuf/src/messages.ts), the result of [TrezorConnect.unlockPath](./unlockPath.md) method.
-   `chunkify` — _optional_ `boolean` determines if address will be displayed in chunks of 4 characters. Default is set to `false`

#### Exporting bundle of addresses

-   `bundle` - `Array` of Objects with `path`, `showOnTrezor`, `coin` and `crossChain` fields

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

Display third address of first bitcoin account:

```javascript
TrezorConnect.getAddress({
    path: "m/49'/0'/0'/0/2",
    coin: 'btc',
});
```

Return a bundle of addresses from first bitcoin account without displaying them on device:

```javascript
TrezorConnect.getAddress({
    bundle: [
        { path: "m/49'/0'/0'/0/0", showOnTrezor: false }, // address 1
        { path: "m/49'/0'/0'/0/1", showOnTrezor: false }, // address 2
        { path: "m/49'/0'/0'/0/2", showOnTrezor: false }, // address 3
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

const result = await TrezorConnect.getAddress({
    path: "m/49'/0'/0'/0/0",
    address: '3L6TyTisPBmrDAj6RoKmDzNnj4eQi54gD2',
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
        address: string,     // displayed address
        path: Array<number>, // hardended path
        serializedPath: string,
    }
}
```

Result with bundle of addresses

```javascript
{
    success: true,
    payload: [
        { address: string, path: Array<number>, serializedPath: string }, // address 1
        { address: string, path: Array<number>, serializedPath: string }, // address 2
        { address: string, path: Array<number>, serializedPath: string }, // address 3
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
