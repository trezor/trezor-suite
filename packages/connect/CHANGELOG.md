# 9.1.1

-   feat(connect-popup): added device model_internal in features
-   feat(connect): add cancelCoinjoinAuthorization method
-   feat(connect): added nodeusb transport. TrezorConnect is now capable of communicating with Trezor devices without using TrezorBridge (in node.js environment).
-   feat(connect-popup): when a call to TrezorConnect returns `success: false` popup remains opened and displays error page instead.
-   feat(connect-popup): add no-backup warning to getPublicKey method
-   fix(connect): respect useEmptyPassphrase param in cipherKeyValue method

# 9.0.11

-   fix(connect-web): fix imports from connect

# 9.0.10

-   fix(connect-popup): fix connect-popup in firefox
-   feat(connect-popup): tiny visual updates, added loading messages based on communication with iframe
-   fix(connect-web): prevent unexpected import of transport runtime code in connect/web

# 9.0.9

-   fix(connect): prevent .asArray of undefined runtime error
-   fix(connect): add missing currencies param for getFiatRatesForTimestamps

# 9.0.8

-   feat: support multiple intermediary FWs for T1 and devkit binaries
    -   `FirmwareUpdate` now accepts `intermediaryVersion` param instead of `intermediary`
    -   `getInfo` returns `intermediaryVersion` needed for T1 and removed `latest` param. 'release' always return latest version for T1 so it means abandoning the concept of incremental updates for T1.
-   feat: signTransaction now returns `signedTransaction` which can be used for visualization purposes before notification about pending transaction from blockchain is received.
-   feat(blockchain): `blockchainGetCurrentFiatRates` and `blockchainGetFiatRatesForTimestamps` now accept additional `token` parameter
-   feat: support coinjoin for T1
-   feat(transport): eth definitions
-   feat(webextension): Ignore port events if it is not port created by current popup
-   feat(cardano): allow external reward addresses in governance registrations
-   refactor(connect): removing browser related code from @trezor/connect

# 9.0.7

-   feat(connect-ui): connect UI will now display a warning in case it was opened by an application listed in https://github.com/MetaMask/eth-phishing-detect (#7488)
-   fix(connect-ui): set max pin input length to 50 instead of 9 (#7668)
-   fix(connect): ltc spending problem (#7666)
-   change(connect): TrezorConnect.init `webusb` option is now deprecated. It was replaced with `transports` param `('BridgeTransport' | 'WebUsbTransport')[]`. (#7411)

# 9.0.6

-   fix: list tslib as direct dependency
-   fix: various improvement and fixes regarding RBF (https://github.com/trezor/trezor-suite/pull/7378)
-   change: increase handshake timeout in popup to 90 seconds
-   change: TrezorConnect.dispose is now async and resolves only after connected device is released

# 9.0.5

-   added: analytics in popup
-   fixed: `signTransaction` with litecoin mimble wimble pegout inputs
-   fixed: `composeTransaction` cases when composing tx with multiple outputs where at least one is above MAX_SAFE_INTEGER
-   updated: @trezor/blockchain-link 2.6.1
-   updated: @trezor/connect-common 0.0.11
-   updated: @trezor/transport 1.1.6
-   updated: @trezor/utils 9.0.4
-   updated: @trezor/utxo-lib 1.0.2

# 9.0.4

-   @trezor/blockchain-link 2.1.5
-   added `setBusy` method
-   added `goerli` (TGOR) coin support
-   added `serialize` and `coinjoinRequest` option to `signTransaction` method
-   added `preauthorized` option to `authorizeCoinjoin` method
-   Cardano: added support for [CIP36 Catalyst registration format](https://cips.cardano.org/cips/cip36/) in `cardanoSignTransaction` method
    -   `auxiliaryData.catalystRegistrationParameters` is deprecated, use `auxiliaryData.governanceRegistrationParameters` instead

# 9.0.3

-   typescript: removed `EosGetPublicKey` type, use `GetPublicKey` type instead
-   fix default bip48 script types. [#6393](https://github.com/trezor/trezor-suite/pull/6393) and [#6407](https://github.com/trezor/trezor-suite/pull/6407)
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
-   `authorizeCoinjoin` method
-   `getFirmwareHash` method
-   [support for babbage features in cardano](https://github.com/trezor/trezor-suite/commit/efe9c78a2f74a1b7653b3fddf6cca35ba38d3ae9)
