# 9.1.12

-   chore(connect): add new CA pubkeys and update timestamp (a4ca9b1)
-   chore(connect): improve types, replace any with PassphrasePromptResponse (9a95962)
-   feat: add Polygon (8c569ca)
-   fix(connect-popup): display errors with no code (8b7cbfa)
-   fix(connect-popup): don't show error when no device selected (f246369)
-   fix(connect-ui): tipcontainer bottom margin (bb0379d)
-   refactor(connect): unify message promises (b0d4b11)
-   refactor(connect): remove initAsyncPromise (da48a71)
-   refactor(connect): unify initCore and initTransport (00deffa, 027be4f)
-   refactor(connect): CoreRequestMessage/CoreEventMessage separation (ea3afa2)
-   chore(connect-ui): mirror store to local react state (b587a65)
-   feat(connect): deal with disconnected && preferredDevice (40e9db8, 6e4ddb4)
-   chore(connect): use preferred device from store (d1899e8)
-   chore(connect-common): remove es5 target (fails with TypedEmitter) (0a19580)
-   feat(connect-common): store is event emitter, saves permissions and preferred device (db0e963)
-   feat(connect-common): message channel to allow lazy handshake (79be923)
-   chore(connect-ui): ui changes (dcb8e02, 03c6cc6, 936f6b5, 6b7ed69, 8f9f3e2, 4cc0cd6)
-   fix(libs): changes in libs that should allow compiling connect with typescript option skipLibCheck: false
-   chore(connect): split dev and prod builds. (535dd48)
-   dependencies update: @trezor/blockchain-link, @trezor/blockchain-link-types, @trezor/type-utils, @trezor/analytics, @trezor/connect-common, @trezor/env-utils, @trezor/transport, @trezor/protobuf, @trezor/utxo-lib, @trezor/utils

# 9.1.11

-   fix(connect): use weak assert in altcoin signTransaction (86b3703279)
-   fix(connect): rebootToBootloader misbehaviour (662543c429)
-   feat(connect-explorer): add connectSrc to settings (053e9f0908)
-   fix(connect): nem and eth signTx validation issues (a53937c2ea)
-   fix(connect): allow empty signature in multisig in getAddress (3b356b5952)
-   fix(connect-examples): webextensions example update usb permissions url (cfbdfc2469)

# 9.1.10

-   chore(connect): bump ADA support version, min required version is now 2.4.3 (7937fea3ec)
-   fix(connect): always check ADA passphrase (42c28cc95d)
-   chore(connect): decrease build size by using lib of utils which is not treeshaken (b4ab48b25f)
-   refactor(connect): rework validation of input params (0c035c26a6, 44430e47ff, c78cd9ad28, c5e9d50bf4)

# 9.1.9

-   fix(connect-popup): webusb pairing in webextensions using manifest version 2 [#10709](https://github.com/trezor/trezor-suite/pull/10709).

# 9.1.8

-   fix(connect-explorer): eth getAccountInfo coin fix (0108b96)
-   fix(connect): do not check firmware range for devices in bootloader (ed53f9f)
-   feat(connect): add changeWipeCode method (b85d957)
-   deps(connect-plugin-ethereum): @metamask/eth-sig-util@^7.0.0->^7.0.1 (e24c80a)
-   chore(connect): improve origTxs and refTxs (ffcb3ee)
-   feat(connect): blockchain-link API adjusted (2df1416)
-   chore(connect-explorer): add ADA params (9969d65)

# 9.1.7

-   fix(connect): correct UiRequestConfirmation type in solanaGetPublicKey (a93ea1890)
-   chore(connect): stricter UiRequestConfirmation types (f35bd28bf)
-   feat(connect-common): add more backend urls for solana (29f042470)
-   chore: Throttler throttling instead of debouncing in `@trezor/blockchain-link` (#10288) (f7ff0cf9f)
-   feat(transport): accept encoding protocols as parameter of send, receive and call methods (b64af958e)
-   fix(connect-explorer): fs, path, fallbacks in webpack (4f5a15e32)
-   chore(connect-common): update fw binaries to 2.6.4 (398509788)
-   docs(connect): update index page (8cb5262f6)
-   feat(connect-explorer): update SVG in Header component (e8d9beace)
-   feat(connect-explorer): update favicon image (a8d660dd2)
-   feat(connect-explorer): add Solana (799bf63f5)
-   chore(connect): update downgraded @ethereumjs libs (9ac430c42)
-   chore(connect): add option for chunkify solana `getAddress` method (98d234f31)
-   fix(connect-explorer-webextension): add commitHash to webpack (6b6b77d9d)
-   feat(suite): add Solana support (f2a89b34f)
-   chore: add Holesky (175707861,8776bb79c)
-   feat(connect-explorer): version docs (6ea9ef1f2)
-   fix(connect-popup): when connect-src not same as host popup display unknown origin (1bc6f2da1)
-   feat(connect-explorer, connect): add `chunkify` paramater to getAddress and signTx methods (7e01923f0,2926b2bdb)
-   fix(connect-popup): handle METHOD_INFO (e6d11072b)
-   fix(connect): support unknown (custom) internal_models (0915d8893)
-   fix(cardano): fee estimate for set-max output (c50a8f2c7)
-   chore(connect): use `tslib` as dependency in all public libs (606ecc63b)
-   chore: update `jest` and related dependency (b8a321c83)
-   chore(connect-examples): cleanup unused lines in script (b509d24d5)
-   chore(connect-webextension): postMessage useQueue param (4e626e758)
-   chore(repo): update tsx (53de3e3a8)
-   chore(connect): remove Solana beta console logs (3ea8343ee)
-   chore(docs): add link to internal description of device authenticity config update (ee9ad470a)
-   chore(connect): add new CA pubkeys and update timestamp (b64c3f411)

# 9.1.6

-   chore(connect): remove web3-utils (2f683f6)
-   feat(connect): serialize in ethereumSignTransaction (8f62896)
-   feat(connect): add serializeEthereumTx util (a9b21a3)
-   refactor(connect): improve ethereumSignTransaction (788910b)
-   feat(connect-popup): shared worker logger load dynamically only when required (424383e, f5400f8)
-   feat(connect): update solana backend urls, fee info, workers, account descriptor and fw integration (876f609, a3ae0ae, e1058ea, cadffc6, 3d9c703)
-   feat(connect-popup): add new method that allow set to use core (d944e50)
-   feat(core): new events for core in popup (242a169)
-   chore(connect-iframe): suppress subtle crypto warning (1f0e722)
-   feat(connect-iframe): standalone core build (c344c3d)
-   feat(deps): update deps without breaking changes (7e0584c)
-   fix(connect-web, connect-popup): remove trust-issues handle from query param (79036e8, b8640d8, 87b4b84)
-   feat(connect-explorer): settings page to restart connect (33e41f6)
-   feat(connect): update protobuf messages in custom Transports (if not set) (1eb5156)
-   fix(connect): device.run race condition (7d0545c, 7978eab)
-   feat(connect-common): add T2T1 & T2B1 firmware binaries 2.6.3 bootloader 2.1.4 (9cca8b1)
-   fix(mobile): Fix modularized connect in React Native (57fcb9d, ba42388, 1ef62e7)
-   chore(deps): bump @fivebinaries/coin-selection (5e16f60)
-   chore(connect): ethereum api dynamic load (b22d228)
-   chore(connect): cardano api dynamic load (3ef0e77)
-   chore(connect): stellar api dynamic import (473ea94)
-   chore(connect): nem api dynamic import (52e2f99)
-   chore(connect): eos api dynamic import (cf5b3ad)
-   chore(connect): binance api dynamic import (3ccf149)
-   chore(connect): tezos api dynamic import (273a9fe)
-   chore(connect): ripple api dynamic import (9b17e38)
-   chore(connect): prepare for dynamic method import (d4868eb)
-   chore(connect): blockchain link workers dynamic import (74fd083)
-   chore(connect): implement @trezor/utxo-lib 2.0.0 (06a9f7a)
-   feat(connect): add getAccountDescriptor method (0b005ec)

# 9.1.5

-   feat(suite): T2B1 replace Model R name by official Trezor Safe 3 name (7460372ed1)
-   feat(connect): add authenticateDevice method (45b99c0813, af907a296d, 249ddc358a)
-   feat(connect): btg, dash, dgb, nmc, vrc no support for T2B1 (0819ff6fc1)
-   feat(suite): support t2b1 firmware installation (9ef2bf627a)
-   fix(connect): get firmware status and release after ensuring internal model (dca3333c2d)
-   fix(connect-popup): webusb in popup if iframe is on same origin as host (e571971586)
-   feat(connect-web): trust-issues query string param (b1b6e3f287)
-   feat(connect-plugin-stellar): Update stellar-sdk and stellar-base (ee7e67db04)
-   chore(connect): t1 emulator with pin (33c6ca58bf)
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
