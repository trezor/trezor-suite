# Methods

API call return a [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise). Resolve is guaranteed to get called
with a `result` object, even if user closes the window, network connection times
out, etc. In case of failure `result.success` is set to false and `result.payload.error` is
the error message. It is recommended to log the error message and let user
restart the action.

Every method require an [`Object`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object) with combination of [`common`](methods/commonParams.md) fields and method specific fields.

-   [TrezorConnect.getPublicKey](methods/getPublicKey.md)
-   [TrezorConnect.requestLogin](methods/requestLogin.md)
-   [TrezorConnect.cipherKeyValue](methods/cipherKeyValue.md)
-   [TrezorConnect.wipeDevice](methods/wipeDevice.md)
-   [TrezorConnect.resetDevice](methods/resetDevice.md)
-   [TrezorConnect.getCoinInfo](methods/getCoinInfo.md)
-   [TrezorConnect.getDeviceState](methods/getDeviceState.md)

## Bitcoin, Bitcoin Cash, Bitcoin Gold, Litecoin, Dash, ZCash, Testnet

-   [TrezorConnect.getAddress](methods/getAddress.md)
-   [TrezorConnect.getAccountInfo](methods/getAccountInfo.md)
-   [TrezorConnect.getOwnershipId](methods/getOwnershipId.md)
-   [TrezorConnect.getOwnershipProof](methods/getOwnershipProof.md)
-   [TrezorConnect.composeTransaction](methods/composeTransaction.md)
-   [TrezorConnect.signTransaction](methods/signTransaction.md)
-   [TrezorConnect.pushTransaction](methods/pushTransaction.md)
-   [TrezorConnect.signMessage](methods/signMessage.md)
-   [TrezorConnect.verifyMessage](methods/verifyMessage.md)
-   [TrezorConnect.authorizeCoinjoin](methods/authorizeCoinjoin.md)

## Ethereum

-   [TrezorConnect.ethereumGetAddress](methods/ethereumGetAddress.md)
-   [TrezorConnect.ethereumSignTransaction](methods/ethereumSignTransaction.md)
-   [TrezorConnect.ethereumSignMessage](methods/ethereumSignMessage.md)
-   [TrezorConnect.ethereumSignTypedData](methods/ethereumSignTypedData.md)
-   [TrezorConnect.ethereumVerifyMessage](methods/ethereumVerifyMessage.md)

## Eos

-   [TrezorConnect.eosGetPublicKey](methods/eosGetPublicKey.md)
-   [TrezorConnect.eosSignTransaction](methods/eosSignTransaction.md)

## NEM

-   [TrezorConnect.nemGetAddress](methods/nemGetAddress.md)
-   [TrezorConnect.nemSignTransaction](methods/nemSignTransaction.md)

## Stellar

-   [TrezorConnect.stellarGetAddress](methods/stellarGetAddress.md)
-   [TrezorConnect.stellarSignTransaction](methods/stellarSignTransaction.md)

## Cardano

-   [TrezorConnect.cardanoGetPublicKey](methods/cardanoGetPublicKey.md)
-   [TrezorConnect.cardanoGetAddress](methods/cardanoGetAddress.md)
-   [TrezorConnect.cardanoSignTransaction](methods/cardanoSignTransaction.md)

## Ripple

-   [TrezorConnect.rippleGetAddress](methods/rippleGetAddress.md)
-   [TrezorConnect.rippleSignTransaction](methods/rippleSignTransaction.md)

## Solana

-   [TrezorConnect.solanaGetPublicKey](methods/solanaGetPublicKey.md)
-   [TrezorConnect.solanaGetAddress](methods/solanaGetAddress.md)
-   [TrezorConnect.solanaSignTransaction](methods/solanaSignTransaction.md)

## Tezos

-   [TrezorConnect.tezosGetAddress](methods/tezosGetAddress.md)
-   [TrezorConnect.tezosGetPublicKey](methods/tezosGetPublicKey.md)
-   [TrezorConnect.tezosSignTransaction](methods/tezosSignTransaction.md)

## Binance

-   [TrezorConnect.binanceGetAddress](methods/binanceGetAddress.md)
-   [TrezorConnect.binanceGetPublicKey](methods/binanceGetPublicKey.md)
-   [TrezorConnect.binanceSignTransaction](methods/binanceSignTransaction.md)

## Management

> please note that these method are not available from popup mode

-   [TrezorConnect.firmwareUpdate](methods/firmwareUpdate.md)
-   [TrezorConnect.getFirmwareHash](methods/getFirmwareHash.md)
-   [TrezorConnect.changePin](methods/changePin.md)
-   [TrezorConnect.changeWipeCode](methods/changeWipeCode.md)
