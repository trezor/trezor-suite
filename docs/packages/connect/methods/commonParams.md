# Common parameters

Every call requires an [`Object`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object) with a combination of common and method-specified fields.
All common parameters are optional.

-   `device` - _optional_ `Object`
    -   `path` - _required_ `string` call to a direct device. Useful when working with multiple connected devices. This value is emitted by [`TrezorConnectEvent`](../events.md)
    -   `state` - _optional_ `string` sets expected state. This value is emitted by [`TrezorConnectEvent`](../events.md)
    -   `instance` - _optional_ `number` sets an instance of device. Useful when working with one device and multiple passphrases. This value is emitted by [`TrezorConnectEvent`](../events.md)
-   `useEmptyPassphrase` — _optional_ `boolean` method will not ask for a passphrase. Default is set to `false`
-   `allowSeedlessDevice` — _optional_ `boolean` allows to use TrezorConnect methods with device with seedless setup. Default is set to `false`
-   `keepSession` — `optional boolean` Advanced feature. After method return a response device session will NOT! be released. Session should be released after all calls are performed by calling any method with `keepSession` set to false or `undefined`. Useful when you need to do multiple different calls to TrezorConnect API without releasing. Example sequence loop for 10 account should look like:
    -   TrezorConnect.getPublicKey({ device: { path: "web01"}, keepSession: true, ...otherParams }) for first account,
    -   Trezor.getAddress({ device: { path: "web01"}, ...otherParams }) for the same account,
    -   looking up for balance in external blockchain
    -   loop iteration
    -   after last iteration call TrezorConnect.getFeatures({ device: { path: "web01"}, keepSession: false, ...otherParams })
-   useCardanoDerivation - _optional_ `boolean`. default is set to `true` for all cardano related methods, otherwise it is set to `false`. This parameter determines whether device should derive cardano seed for current session. Derivation of cardano seed takes longer then it does for other coins. A wallet that works with both cardano and other coins might want to set this param to `true` for every call or it must be able to cope with the following scenario:
    -   Connected device is using passhprase
    -   Wallet calls `getPublicKey` with `useCardanoDerivation=false`, passhprase is entered, seed derived
    -   Wallet calls `cardanoGetPublicKey`.
    -   At this moment user will be prompted to enter passhprase again.
-   `override` - _optional_ `boolean` Interrupt previous call, if any.
-   `chunkify` — _optional_ `boolean` determines if address will be displayed in chunks of 4 characters. Default is set to `false`
