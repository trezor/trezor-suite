# 9.1.5

-   fix(connect-iframe): not create new timestamp for proxy logs (4919dbcec3)
-   feat(connect-common): added T2B1 frimware binaries 2.6.2 (423699284f)
-   fix(connect-iframe): user original timestamp for proxy logs (4919dbcec3)
-   feat(connect-common): added T2B1 frimware binaries 2.6.2 (423699284f)
-   feat(connect-common): added T2B1 frimware binaries 2.6.2 (423699284f)
-   feat(suite): T2B1 replace Model R name by official Trezor Safe 3 name (7460372ed1)
-   feat(connect): check that CA certificate validity from is not in the future (249ddc358a)
-   fix(connect-common): fix bootloader version in T2B1 release config (4e698091b2)
-   feat(connect): add production root and CA pubkeys (af907a296d)
-   feat(connect): add authenticateDevice method (45b99c0813)
-   feat(connect): btg, dash, dgb, nmc, vrc no support for T2B1 (0819ff6fc1)
-   feat(suite): support t2b1 firmware installation (9ef2bf627a)
-   fix(connect): get firmware status and release after ensuring internal model (dca3333c2d)
-   fix(connect-popup): webusb in popup if iframe is on same origin as host (e571971586)
-   feat(connect-web): trust-issues query string param (b1b6e3f287)
-   feat(connect-plugin-stellar): Update stellar-sdk and stellar-base (ee7e67db04)
-   Chore(connect): t1 with pin (#9576) (33c6ca58bf)
-   fix(connect): reboot to bootloader (1e29218437)
-   fix(connect-popup): allow decimal custom fee entry (bf20f23f05, 8a8d93b5e8)
-   feat(connect-explorer): add rebootToBootloader method (9996676358)
-   fix(connect): wrong version format in discovery (19b13d1d4c)
-   feat(connect-popup): logger in sharedworker collecting from all environments (732bc7d, 2521c7c, 6501dfa4fd)
-   chore(connect): do not lowercase device color (7229b88c20)

# 9.1.4

-   feat(connect-popup): add metamask extension id to known third party (f137b3e4d6)
-   test(connect): composeTransaction fix doge fee (69a92483c6)
-   refactor(connect): remove doge fee branch (c79f3f25d8)
-   feat(transport): udp support for transport methods (65e617195c)
-   fix(connect): accept signTransaction inputs/outputs with `address_n: string` (82910e0766)
-   fix(connect-explorer, connect-popup): add favicon (cafb574ada, c6071123f3)
-   feat(connect-popup): use trezor icons with display off from suite-data (1c806519a7)
-   feat(connect): trezor color in device object (31535e2b0f)
-   feat(connect): trezor name in device object (a0ecb66390)
-   feat(connect-common): copy models.json from submodules (6d80197523)
-   fix(connect-iframe): device event not propagating to host (d35e37863a)
-   feat(connect, suite): unify no backup warning button text (375f3fa1a1)
-   feat(connect): add suppressBackupWarning param to getPublicKey and getAccountInfo (2c2698d8af)
-   fix(type-check): connect-web includes connect-iframe package.json (f9f576ab66)
-   fix(connect-iframe): method.initAsync method superfluous call (37ace99a5d)
-   fix(connect-iframe): define plugin in build to support analytics (c793ce358c)

# 9.1.3

-   fix(connect): correct import of internal connect dependency (https://github.com/trezor/trezor-suite/issues/9389)

# 9.1.2

-   feat(connect): analytics method name and method param names (23df6d8)
-   feat(connect): improve calculation of fees and dust limit. (d726aab, 9d1ef05, 60f1e26, 2187c34, d84e3ca)
-   fix(connect): device.firmwareType can't be safely determined in bootloader mode so we set it to undefined (c3d33a0)
-   feat(connect): signTransaction with refTxs passed as AccountTransaction interface (d7ec435)
-   feat(connect): decoding ethereum definitions which allows richer UI in connect-popup (0e9356f)
-   feat(connect-explorer): updated examples ethereum (b025834, e58c416), applySettings (1a28816)
-   feat(connect-explorer): render docs from docs folder on index page (93fddc4)

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

-   feat: support multiple intermediary FWs for T1B1 and devkit binaries
    -   `FirmwareUpdate` now accepts `intermediaryVersion` param instead of `intermediary`
    -   `getInfo` returns `intermediaryVersion` needed for T1B1 and removed `latest` param. 'release' always return latest version for T1B1 so it means abandoning the concept of incremental updates for T1B1.
-   feat: signTransaction now returns `signedTransaction` which can be used for visualization purposes before notification about pending transaction from blockchain is received.
-   feat(blockchain): `blockchainGetCurrentFiatRates` and `blockchainGetFiatRatesForTimestamps` now accept additional `token` parameter
-   feat: support coinjoin for T1B1
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
