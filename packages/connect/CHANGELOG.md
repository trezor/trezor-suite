# 9.0.3 (not released)

-   added `unlockPath` method
-   added `SLIP 25` support
-   fixed bitcoin extended descriptor (xpubSegwit) for taproot accounts

# 9.0.2

-   improved passphrase dialog in popup window
-   if popup window does not load in a predefined period of time, error screen with troubleshooting tips is shown

# 9.0.1

-   @trezor/blockchain-link 2.1.4

# 9.0.0

## Breaking changes:

-   Changed codebase to typescript.
-   Removed `Lisk` methods from api.
-   Removed `customMethod` api method.
-   Exported constants:
    -   `CARDANO.ADDRESS_TYPE` => `PROTO.CardanoAddressType`
    -   `CARDANO.CERTIFICATE_TYPE` => `PROTO.CardanoCertificateType`
    -   `CARDANO.POOL_RELAY_TYPE` => `PROTO.CardanoPoolRelayType`
    -   `CardanoCertificateType`
    -   `CardanoNativeScriptType` => `PROTO.CardanoNativeScriptType`
    -   `CardanoNativeScriptHashDisplayFormat` => `PROTO.CardanoNativeScriptHashDisplayFormat`
    -   `CardanoPoolRelayType` => `PROTO.CardanoPoolRelayType`
    -   `CardanoTxSigningMode` => `PROTO.CardanoTxSigningMode`
    -   `CardanoTxWitnessType` => `PROTO.CardanoTxWitnessType`
    -   removed unused `DEVICE.WAIT_FOR_SELECTION`
    -   removed unused `UI.CHANGE_ACCOUNT`
-   Minimum firmware requirements bumped:
    -   2.4.2 CardanoSignTransaction

## Added:

-   `getOwnershipId` method
-   `getOwnershipProof` method
-   `authorizeCoinJoin` method
-   `getFirmwareHash` method
-   [support for babbage features in cardano](https://github.com/trezor/trezor-suite/commit/efe9c78a2f74a1b7653b3fddf6cca35ba38d3ae9)
