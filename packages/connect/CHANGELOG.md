|             Package              | Stable | Canary |
| :------------------------------: | :----: | :----: |
|       npm @trezor/connect        | 9.6.2  |   -    |
|     npm @trezor/connect-web      | 9.6.2  |   -    |
| npm @trezor/connect-webextension | 9.6.2  |   -    |
|    npm @trezor/connect-mobile    | 9.6.2  |   -    |

|     Deployment     | Stable | Canary |
| :----------------: | :----: | :----: |
| connect.trezor.io/ | 9.6.2  |   -    |

Use the persistent link [connect.trezor.io/9](https://connect.trezor.io/9/) to access the latest stable version of Connect Explorer.

# 9.6.2

This release is important for smooth support of 2.9.0 trezor firmware, namely commits:

- feat(connect): change default for skipFinalReload (86d982e)
- feat(connect): reorganize order of getHDNode and SingTx calls; remove decred verification (906d835)

Improvement of ethereumSignTypedData

- fix(connect): button request data in ethereumSignTypedData (a0a2f1c)

Other than that only refactorings and chores are present:

- refactor(connect): improved pendingTransportEvent (f965980)
- refactor(connect): add devices after handshake (da4893b)
- refactor(connect): lifecycle changed to emitter (742d1c1)
- feat(connect): included bundled releases (8230255)
- fix(connect-common): reduce bsc block time (90e2b55)
- feat(connect): create THP devices in handshake process (5f07f57)

# 9.6.1

Minor improvements and fixes regarding the [New Connect flow in Trezor Suite](https://connect.trezor.io/9/guides/new-connect-flow-in-trezor-suite/).

## Fixes

- Webusb sync between tabs in browser fixed in connect-popup (dd50a1a, f558513, cdd73c5)
- fix(connect-web): empty settings in init in suite-desktop mode (3f61be1)

## Features

- Works on the new communication protocol continue:
    - feat(connect): add ThpState and ThpMessageResponse to DeviceCurrentSession (5919fe9)
    - feat(connect): add UI response for THP pairing tag (6084994)
- feat(connect): add getNonce (72a1417)
- feat(connect): decode hex in message signing (2f41cc6)
- feat(connect-mobile): add appName and appIcon to deeplink (7f96299)
- feat(connect-explorer): add appIcon (04dd6d6)
- feat(connect): add backendType to discovery progress events (a3b804e)
- feat(connect): track npmVersion in analytics (6cc1058)

## Chores

- chore: update jest to v30 (6d27a2c)
- chore: update trends deps (a9f0997)
- chore: add/remove used/unused packages (60fb96b)
- chore: add missing workspace libs (bc6a681)
- refactor(connect): split Device related code to workflow modules (dd9ffde)

# 9.6.0

Starting with Connect version 9.6.0, we are introducing a new integration with Trezor Suite. The new flow is designed to provide a more seamless and user-friendly experience for users interacting with Trezor devices.
To learn more, please take a look at the full [New Connect flow in Trezor Suite](https://connect.trezor.io/9/guides/new-connect-flow-in-trezor-suite/) article.
We encourage you to try out the new flow to make sure everything works as expected. If you encounter any issues, please let us know.

This requires one change in the manifest - there is an additional required field `appName` that is used in the permission prompt. Optionally, you can also provide an `appIcon` which will be shown in the future.

```javascript
TrezorConnect.init({
    manifest: {
        email: 'developer@xyz.com',
        appName: 'Your Application',
        appUrl: 'http://your.application.com',
        appIcon: 'http://your.application.com/icon-64.png',
    },
});
```

## Features

- Use suite-desktop by default (73d8a0a)
- `appName` in manifest now required (6103a68)
- New `discoverAccount` method (0b584aa, 3a07e81, 8389827, e2f66ef, f0f9197, 084089d, 978c2f5, dc1a77d)

## Chain Support

- Improved support for Stellar (180265b, 48b5ca0), including testnet (4231425)
- Removed support for old Binance beacon chain (97a2dfd)
- Use Solana token definitions (4be5bea)

## Fixes

- Do not throw entropy check failure during backup (81d582e)
- Keep session dispose error (f2dcd3a)
- `getAccountDescriptor` polished (e5b2cff)

## Chores

- Update Ethereum libs (ab5ad7b)
- Update Solana libs (f58d9b6)
- Update dependencies (47b7a34, 7bf17ef, 680cc6b, 2c97fed, 3c05b26)

# 9.5.5

This release is mostly about refactoring and preparatory work for the new way of using TrezorConnect together with Trezor Suite as its UI.

## Features

- Improvements in fees estimation (feebc12, 0eebb7f, df8656b)
- 'Seedless' devices now do not prompt for firmware update. (cac7eb4)

## Fixes

- Add `@trezor/type-utils` to dependency to connect.
- catch requestDevice error (df1134c)
- Failure typing fixed (54da299)

## Chores

- update device authenticity config (7bc4717)
- tighten validation of manifest.appIcon and manifest.appName (23d9c55)

# 9.5.4

If you are using @trezor/connect-web you must be using at least 9.1.5 starting from this release.

## Features

- add descriptor to getPublicKey response (cbfec9b)
- implement EVM EIP-1559 fees for ethereum in blockchainEstimateFee method (0475047)
- improvements in @trezor/connect-web package regarding support of calling @trezor/connect inside suite-desktop application. always attempt reconnection for core in desktop (21da232); implement @trezor/websocket client in core-in-suite-desktop (9744c5b); error fallback for core in desktop (64cbd47)

## Fixes

- fixing session releasing on page unload (6d01d78)
- fixing missing session owner in device object (e2116c1)
- turn off language update during fw update for T3T1 since it does not fit device memory (283d829)

## Chores

- migrate ripple-lib to xrpl.js (422c175)
- reuse PublicKey type in HDNodeResponse type definition (6c841d9)
- update device authenticity config (bf82b92)
- connect core refactoring (1d62c9b 19b6e5e 0dd2933 f9998f3 7dc1290 b685518 fb14734)
- pass full request object parameter in blockchainEstimateFee method down to @trezor/blockchain-link to allow more fine-grained backend calls (19c5952)
- refactoring in visual components (00e7df5, b3a4791)

## Deps

- update next-seo from 6.0.0 to 6.6.0 (b5a818e)
- update swr from 2.2.5 to 2.3.3 (6d98da6)
- update remark-gfm from 4.0.0 to 4.0.1 (21a8f89)
- update zod from 3.23.8 to 3.24.2 (afc3d9b)
- update ua-parser-js@2.0.3 (840d5c6)
- upgrade next js for connect explorer theme (951e047)

# 9.5.3

## Fixes

- fix(connect-popup): clear timeout on failure to prevent changing of error screen after 90 seconds (08fe031)
- fix(connect-popup): add missing margin after components update (0e5ea26)

## Chores

- chore(connect): in decode eth definitions move common proto messages related logic outside of foreach (5da7ec8)
- fix(connect-popup): use local path to core (1f9e248, 241115c)
- chore(connect-popup): refactor old templates (dfef1db)

# 9.5.2

## Feature

- feat(connect-web): forward device events in popup mode (8589d27). From now on you may listen for device events even if you are using core logic loaded into connect.trezor.io/9/popup.html. This feature was previously available only in @trezor/connect or in @trezor/connect-web using iframe.
- feat(connect-web): enable coreMode auto by default (061b28a). From now on (applies for @trezor/connect-web) if you don't pass `coreMode` in TrezorConnect.init, TrezorConnect would automatically fallback to loading connect-core into popup.html instead loading it into the injected iframe. This fallback happens in cases when iframe can't be injected or trezor-bridge is not running.

## Chores

- chore(connect): Replace @solana/web3.js with @solana/kit
- chore(connect): update device authenticity config (ecc04a4)
- chore(connect-common): add fw binaries for 2.8.9 (63a69af)
- stop exporting DeviceModelInternal enum (0ad5a37, 0bcf666, 465f40a). We believe that this was only used internally.
- chore(connect-popup): bump deprecation warning to 9.4.0 (2d8d78d)

## Fixes

- feat(connect): add errorPayload to FW revision check other-error (afe36df)
- fix(connect): assign object instead of mutating (a09a669)

# 9.5.1

## Feature

- added backends so that each EVM has 4 endpoints (f5c057c)
- logic for rent fee calculation (2650f6b)

## Fixes

- solana creating account parameter in e2e (356edd4)
- reacquire when cancel timeouts (141a29c)
- don't cancel preventively on T1 in certain cases (bf6d9ff)
- FW revision check for unknown models (522880d)

# 9.5.0

Starting with this release we changed de target in all `@trezor` packages to ES2022. It might be problematic in some very old environment or if you use Typescript with lower than ES2022 you might have to add ES2022 lib to your tsconfig. We are also include esm builds in our npm packages. For now only in `@trezor/connect-plugin-stellar` and `@trezor/connect-plugin-ethereum`.

Another important change comes from 013f14a where we ping trezor-bridge and if it comes online connect would ditch webusb transport and start using bridge instead.
This should help potential inconsistent states of device communication.

## Feature

- trust \*.localhost subdomains (c148eeb)
- solanaComposeTransaction method (e653ae9)
- increase popup interaction timeout from 10 to 20 minutes (f800602)
- blockchain methods now have support for various L2 ETH networks (26ff8ea, 38614db)
- solana and Token-2022 tokens (9abc7d9)
- show h instead of apostrophe in taproot xpub to be consistent with firmware (82e7d84)
- remove Hash-Check from FW upgrade (it is performed on-device-connect anyway) (7413e2c)
- enable taproot in connect discovery in popup (b1ea07e)
- add fw binaries for 2.8.8 and 1.13.0 (6ef1768), firmware update will be offered
- feat(connect): upgrade to bridge when it starts (013f14a)

## Fixes

- edgecase where device is not detected during fw update using the old bridge (5fa3d45)
- use serializeError on FW hash check errors (0aadfb0)
- handle rejection in acquire/release (e47bf08)
- allow firmwareUpdate from binary without known device.firmwareRelease (7517a71)
- filterSafeListByBootloader: current bootloader version > recent release version (53d6e22)
- fix potential device hang after received message assertion error (59d6e69)
- fix device hanged after initial getFeatures timeout (bc385c2)
- solana transaction decode (5cb1895)
- resetDevice typed error (8795800)
- clear initial GetFeatures timeout (c0a9ecc)
- ethereum decimal places (c40929b)
- fix(connect): gracefully handle offline FW revision check in react native (a969076)
- fix(connect-explorer): pass description for nested parameters (fc44b51)
- fix(connect): allow to: null in ethereumSignTransaction for contract deployment (1aa34bf)

## Chores

- use target ES2022 from root tsconfig.lib (2b75843, 83b4e69, a0395a2, d52b30b)
- docs(connect-mobile): improve description of deeplinking protocol (aa1436e)
- chore(connect-common): update authenticity config (6ba9ead)
- unify timeout utils (fd9f509, dedff02, 4b57c17)
- chore: update solana and everstake deps (cf806ff)
- chore(connect-plugin-ethereum): update dep (91da7e7)
- chore(connect-plugin-stellar): update dep (daffb20)
- chore(suite): bump webpack (eab0cc7)
- chore(suite-desktop): bump electron-builder (306a3cf)
- chore(suite-desktop): bump electron (4641b02)
- define TrezorError.toString with pertinent info (ad09f50)
- emit FIRMWARE_VERSION_CHANGED event (d6de99a)
- return firmwareUpdate installed version details (4b6efed)
- add validation schema to cardanoComposeTransaction (05e52d8)
- solanaSignTransaction serialize (bb73ba6)
- multitransport (ff74c08, 1c89c28, 4424d07)
- add setTransports method (4880cd3)
- resetDevice with entropy check (c750a73)
- introduce internal_model UNKNOWN for non-standard models (289ebe9, e6c74f1)
- rename bnb to bsc (cc18737)
- make types strict to prevent accidental deletion via unused types, the optionality is a trap, they are required (184ebbb)
- remove account.addresses from cardanoComposeTransaction (1946d9f)
- clone udev/bridge info (a6d61a2)

# 9.4.7

This release mainly fixes a serialization bug in Ethereum EIP-1559 transactions that was causing signing issues in some cases, presumably since v9.4.3.

The serialization handling has been refactored with improved type checking to ensure the correct output.

## Fixes

- test(connect): improve serializeEthereumTx unit test (386dc36)
- feat(connect): improve serializeEthereumTx (12fad78)
- feat(connect): typed deepHexPrefix transform (1edbbc0)
- fix(connect): eip1559 correct maxFeePerGas (4f5d6f3)
- fix(connect): better mobile fetch errors (ad061ad)
- feat(tests): allow for running e2e tests with emulator from URL or from specific firmware branch (6d157a0)
- fix(connect-explorer): bundle adding problem (58e00b4)

# 9.4.6

This release brings improvements and optimizations in Solana `getAccountInfo`. It moves security checks outside `getFeatures` that fixes some of the issues with device loading and communication in general.

## Feature

- add apiType to transports (f057f33)
- add blocks to blockchainUnsubscribe (de01c1f)

## Fixes

- move security checks outside getFeatures (e67810d)
- use new improved cloneObject function (ee85d6d)
- update device authenticity config (3689022)
- add missing transport names (ef9f731)
- solana optimized getAccountInfo (88b9c6d)

# 9.4.5

We’ve reverted the default setting for nVersion in Connect back to nVersion=1. Since this might be a breaking change we are going to implement it in Connect 10. (05af037)

## Feature

- add blockchainGetInfo method (0bd3068)
- types - export DisplayRotation type (6744666)
- new way of using connect as a module in web (without iframe). This is meant for internal use for suite.trezor.io application.

## Fixes

- add typesafe map types to models config for device names and variants (4d24e2b)
  chore(connect): default to nversion=1 again

## Dependencies updated

- npm-release: @trezor/blockchain-link 2.3.4
- npm-release: @trezor/blockchain-link-utils 1.2.4
- npm-release: @trezor/analytics 1.2.4
- npm-release: @trezor/connect-common 0.2.5
- npm-release: @trezor/transport 1.3.5
- npm-release: @trezor/protobuf 1.2.5
- npm-release: @trezor/utxo-lib 2.2.4
- npm-release: @trezor/utils 9.2.4

# 9.4.4

This release among other improvements fixes a bug in ethereum serialization of empty strings as hex that was causing issues when signing that was caused by @ethereumjs libs update (2d6465f, d6bc8c5020) in 9.4.3.

## Feature

- Show bundleprogress in popup. This is helpful when a 3rd party requests a big bundle of addresses which might take long to process (5cf9963)

## Fixes

- preferred device handling based on (passphrase) state instead of path (58b854c)
- fix "BetaOnly" component that is supposed to hide selected parts of content in beta environments (fdb433a)
- blockchainEvmRpcCall postMessage instance not propagated correctly (c98a08e)

## Dependencies update

- npm-release: @trezor/blockchain-link 2.3.3
- npm-release: @trezor/blockchain-link-utils 1.2.3
- npm-release: @trezor/blockchain-link-types 1.2.3
- npm-release: @trezor/type-utils 1.1.2
- npm-release: @trezor/connect-analytics 1.2.3
- npm-release: @trezor/analytics 1.2.3
- npm-release: @trezor/connect-common 0.2.4
- npm-release: @trezor/env-utils 1.2.1
- npm-release: @trezor/transport 1.3.4
- npm-release: @trezor/protobuf 1.2.4
- npm-release: @trezor/schema-utils 1.2.3
- npm-release: @trezor/protocol 1.2.2
- npm-release: @trezor/utxo-lib 2.2.3
- npm-release: @trezor/utils 9.2.3

# 9.4.3

This release introduces `@trezor/connect-mobile`, which allows mobile apps to integrate with Trezor Suite mobile using deeplinks. This package is still beta and work in progress.

## Feature

- new (non public) method TrezorConnect.loadDevice (14aec5d5b6, f8a47401ec, 0d5b592ae7, e46c95ef9d, 18b5cbc9d3, 580f3a9325)
- make TrezorConnect.init transportReconnect implicitly true (19aeb1a0f7)
- in connect popup improve error handling screen for missing capabilities in FW (d2c8870944)
- Support for t3w1 support in types (f98990dfa0, 01cdee48f1, e9827eeaa8)
- remove auto-acquire after device was released elsewhere (dfa070fa2d, cdd2ac1ec7)
- implement random strategy for utxo sorting (6c3137fdf8)
- new public method TrezorConnect.blockchainEvmRpcCall (a507d1322a)
- make `manifest.appUrl` available as part of `Device.transportSessionOwner` (c98f7f8bf4)
- connect-mobile and deeplink (9f8f1c1bd2, d1c2bd7464, 40f3b53a34, fe8499ec1c, 1ff479c545, 1b88b3b72b)

## Fixes

- local url in mobile example (e4365278aa)
- emit changed event with state change in keepSession (f8bcaf7203)
- don't trump Cancel with DeviceCommand disposed (d2f876e47c)
- WebUSB sessions sync in all deployments (13ec59a53d)
- skip fw hash check when binary too tiny (DX) (584d742ccc)
- usedElsewhere only for localSession (8fc98762ec)
- device.unreadableError is always string (aeab689d34)
- api.dispose on transport.stop (e79130e88e)
- analytics for core in popup (f08deff345)
- deeplink core mode from options (3eb7512b89)

## Chores and improvements

- add dynamic connect that allows us to use different connect implementation (96e81fe5bf, 887889288f)
- try to reuse initialized (passphrase) session (422476c9c0)
- uncouple enableFirmwareHashCheck setting from binFilesBaseUrl (768596bbe5)
- add sortingStrategy param to connect, deprecate skipPermutation param in composeTransaction (283d3f1eae)
- Eslint improvements (1ad7b6f9b1, 12b6fb18b9, f1bdc399e5, e22b683733, 5d1104bfeb, 4a3cdc7893, 5e33e3abb5)
- add recommended checks from eslint-plugin-jest
- make getBinaryOptional async (e583e84c32)
- fw hash check automatically for T1B1 (0fd023dbe8)
- cleanup some duplicities in fw download util (53456df94d)
- a cosmetic change in Device types (b718af4a2b)
- use import from @trezor/connect-analytics (1ee270b1cd)
- fix log going to (9dee606f43)
- Support matrix (44ed16a45d)
- update backends for bsc and op (458f0fe3d9)
- mention address can be used in getAccountInfo (722a2b2b7f)
- update messages.json (71bbde850b)
- add Optimism (c2fb244649)
- rename 'getAssetByUrl' to a more apt fn name 'tryLocalAssetRequire' (f5e8f256ae)
- background sessions improved (7644107353)
- connect error codes typing (57815188d1)
- update device authenticity config (063d68379f)
- fix header level in connect changelog (ac53d354cc)
- add other-error to FirmwareRevisionCheckResult errors (4361aba5b7)

### Dependencies update

- @ethereumjs libs (2d6465f, d6bc8c5020)
- electron, electron-builder and webpack (2b80c45c5f, e7a980bcf3, fc04fea1de)

- npm-release: @trezor/blockchain-link 2.3.2
- npm-release: @trezor/blockchain-link-utils 1.2.2
- npm-release: @trezor/blockchain-link-types 1.2.2
- npm-release: @trezor/type-utils 1.1.1
- npm-release: @trezor/connect-analytics 1.2.2
- npm-release: @trezor/analytics 1.2.2
- npm-release: @trezor/connect-common 0.2.3
- npm-release: @trezor/transport 1.3.3
- npm-release: @trezor/protobuf 1.2.3
- npm-release: @trezor/schema-utils 1.2.2
- npm-release: @trezor/utxo-lib 2.2.2
- npm-release: @trezor/utils 9.2.2

# 9.4.2

This release fixes an issue with TypeScript and certain libraries not being resolved correctly in the previous version.
If you are still seeing issues with USB types, please add `w3c-web-usb` to your `tsconfig.json` file under `types`.

### Features

- feat(connect): return device info with method response (a378def)
- docs(connect-explorer): flowchart for auto core mode (9501d3d)
- docs(connect-explorer): diagram and explanation for core in popup (3bbb032)

### Fixes

- Fixing an issue with typescript not being able to resolve @sinclair/typebox and USB types correctly (98d6437)
- Fixing regression that made it impossible to acquire (steal) device session over webusb (5cf83b4)
- Couple of other fixes and improvements of device handling:
    - fix(connect): pending transport event fix (231899f)
    - fix(connect): DeviceList create devices sequentially (b4a915b)
    - chore(connect): use cancelableAction instead of \_cancelableRequestBySend (66c9beb)
    - fix(connect): Device prompts cancel action (pin, word, passphrase) (e8257f4)

- Connect Explorer fixes:
    - fix(connect-explorer): icons on index page (fef3791)
    - fix(connect-explorer): Button as Link not working (d788a06)
    - chore(connect-explorer): improve fallback schema illustration (d0619b7)
    - chore(connect-explorer): improve typography (f730904)

### Dependencies update

- npm-release: @trezor/connect-common 0.2.2
- npm-release: @trezor/transport 1.3.2
- npm-release: @trezor/protobuf 1.2.2

# 9.4.1

Automatic retry for no transport issue: If the transport (bridge) is initially not available, the automatic retry feature allows the user to continue after starting the transport, without having to restart the entire flow.

Additional confirmation for pushing transactions: A new permission prompts users for extra confirmation when methods push transactions to the network, ensuring a more secure experience.

NodeBridge new version compatibility fix: Resolved an issue where NodeBridge version parsing failed to work with the latest Suite version. While the fix is on the Connect side, updating is recommended for improved compatibility.

### Features

- When method param has a side-effect (push transaction) user is prompted for permission in connect-popup (d05fb24)
- User is now able to finish flow in popup even if transport (bridge) is not available when it started. (8874eb6)
- Connect-popup now remembers device for either 15 minutes or value of device auto_lock depending on which is higher (e6a68e0)
- connect-common: add FW 2.8.3 binaries for T3B1 (c32984c)
- connect-common: add FW 2.8.3 binaries for T3T1 (b57198a)
- docs(connect-explorer): step by step tutorial to build connect webextension (9d5ba70)
- docs(connect-explorer): add more ways to test getAccountInfo (62101d6)

### Fixes

- New NodeBridge version not parsed correctly - ignore semver labels in version utils (6501704)
- fw releases value for custom device model (265028d)
- keepSession with changing useCardanoDerivation (8c654a1)
- fw update: when device is disconnected during fw update as a result of RebootToBootloader call do not release it on transport layer (93da8b5)
- fw update: temporarily disable automatic language update for TT due to memory constraints (5d7f578)
- connect-explorer: doc repository base so edit page works (203a83d)
- connect-examples: add asterisk to match popup urls for content script (9da8b0b)
- connect-explorer: diagrams dark mode regression (09a5f9f)

### Chores

- update device authenticity config (31ec9a2, 68254a3)
- remove useless setTransports (a8bd51d)
- gen-reftx add decred fields (f57ef60)
- rework gen-reftx util to ts (15e64e8)
- device state saving refactor (e6a68e0)
- remove useless null fallback (7cc0b00)
- StaticSessionId template literal type (a97dfae)
- allow preminor releases in connect (38ba9e1)
- unify names of Device fields (483d370)
- grooming in Device.state (0bfbe1c)
- remove TypedPayload import (DeviceCommands) from eosSignTx.ts (609f6a6)
- rename types in deviceCommands (a17c695)
- add T3B1 and T3T1 to methods config (744ede5)
- auto retry cycle instead of recursion (7f73cae)
- descriptor diff improvement (afa479e)
- device descriptor update (7db4bb5)
- test: adjust decred to 2.8.2 (f4798ef)
- test: e2e semver filtering fix (16cc575)
- test: rewrite common.setup.js to ts (62a3962)
- test: Extend checkFirmwareRevision test to all devices (e706d74)
- test: remove ADDRESS_N utility from tests (40cd370)
- connect-common: update coins.json via yarn update-coins (f7c16e1)
- connect-common: add t3b1 to coins.json (6a8b460)
- connect-common: change lng blob in release.json (c8a0c46)
- connect-explorer: make device support documentation more future-proof (ea03610)
- connect-explorer: remove old conversion script (11c534e)
- transport: don't pass signal to transports (0cb09ab)
- transport: sessions background without abort signal (4f6e8cf)
- transport: better abortable methods (583f4aa)

### Dependencies update

- @sinclair/typebox 0.31.28=>0.33.7 (43ae297)
- webpack from 5.93.0 to 5.94.0 (358b96d)
- crypto libs (a304dd5)
- next-theme 0.2.1=>0.3.0 (f8f5351)
- next 14.1.3=>14.2.6 (b364e97)
- @uiw/react-codemirror 4.21.25=>4.23.0 (8bcc314)
- codemiror-json-schema 0.7.0=>0.7.8 (d38b9a0)
- @playwright\* 1.45.3=>1.46.1 (492ff5f)
- @types/chrome; @types/web; @types/sharedworker (8e73aeb)
- various patch versions deps (ed3e9bf)
- TS 5.5 (198c91f)

- npm-release: @trezor/blockchain-link 2.3.1
- npm-release: @trezor/blockchain-link-utils 1.2.1
- npm-release: @trezor/blockchain-link-types 1.2.1
- npm-release: @trezor/connect-analytics 1.2.1
- npm-release: @trezor/analytics 1.2.1
- npm-release: @trezor/connect-common 0.2.1
- npm-release: @trezor/transport 1.3.1
- npm-release: @trezor/protobuf 1.2.1
- npm-release: @trezor/schema-utils 1.2.1
- npm-release: @trezor/protocol 1.2.1
- npm-release: @trezor/utxo-lib 2.2.1
- npm-release: @trezor/utils 9.2.1

# 9.4.0

## connect

### New Feature: coreMode Initialization Option

We have introduced a new initialization option, coreMode, which allows websites to choose between the existing iframe mode and the new popup mode. The popup mode enables the use of WebUSB on third-party websites, a feature not available in iframe mode. By default, coreMode is set to auto, allowing the library to automatically select the optimal mode based on the environment. For more details, please refer to the [init method documentation](https://connect.trezor.io/9.3.1-beta.1/methods/other/init/).

### Legacy Passphrase Support Removed

Support for legacy passphrases has been discontinued. Users with firmware versions earlier than 1.0.9 and 2.3.0 will need to update their devices to continue using @trezor/connect.

### Enhanced Popup Handshake Reliability

### Cardano Support Update

Added support for Conway certificates and increased the minimum supported firmware version to 2.6.0 to streamline legacy code.

### Minor Fixes

Various minor fixes have been implemented in Connect Explorer and the documentation.

### Device Authentication Enhancement

The AuthenticateDevice method now verifies CA certificate extensions.

### New Support for T3B1

Added support for T3B1.

- chore(connect): Add Ambire Browser Extension to knownHosts (cbe81ab)
- chore(connect): remove ethereum-cryptography npm package (18851d1)
- chore(connect): split public and internal settings type (3aab4ea)
- chore(connect): add new CA pubkeys and update timestamp (48ec951)
- chore(connect): refactoring of the CheckFirmwareAuthenticity to support local binary (and wont download it from web, when its available in the suite) (82ab513)
- fix(connect): disallow interaction-less fw update when switching fw type (4936939)
- fix(connect): validate x509 asn1 component (bc13fe2)
- fix(connect): handle missing language binary (954dbb9)
- fix(connect): proceed with fw install even when language data fails to download (b40d1b7)
- test(connect): x509 extensions parser (163c82c)
- test(connect): update to min version fw 1.0.9 and 2.3.0 (544c311)
- add fw 2.8.1 (847cfd6)
- feat: Implement firmware hash check into device (905e656, 10a1c86, 95d3d90, 655b9d3)
- chore: rename bsc to bnb as it is declared in fw repo (0174dc2)
- fix: report devices without GetFeatures support as fw required (f6b7826)
- refactor: core and deviceList global state (6149ef1, d1e92f9, cbb4c5c, 167cacf, 0057aeb, 76ab7a0, 8e65374, 418b7cc)
- refactor(connect): removed initDeviceList, move transportReconnect inside DeviceList, make DeviceList reusable, device list constructor not throwing, singleton-like DeviceList, separate onTransportUpdate, pendingTransportEvent improved, improve DeviceList init flow (f4b3694, 02215de, b53259b, e8c6c25, e395dc8, 6509e5c, 3e30d64, d173966, 50cbbea, 1a81d89, 4780c51, 75bfe75, 83c0cb3, 73261c8, f2167bf, bb7dfee)
- fix(connect): correctly wait for device selection in case of overriding (0c7a3bd)
- fix(connect): Fork old PassphraseTypeCard to connect (155afda)
- fix(connect): longer timeout for getFeatures due to suite-native performance issue (0910ab7)
- fix(connect): handle malformed EIP-712 data (d111006)
- fix(connect): remove superfluous space from error message (81be584)
- fix(connect): correctly await transport.receive (31c8519)
- fix(connect): proper pendingTransportEvent waiting (baa4144)
- chore(connect): add a comment to legacy code (a23a365)

## connect-web

- clean up in popupmanager when useUi=false (9bc2ea9)
- default coreMode to auto (e45d47e)
- automatic fallback to core in popup (e4e1fcc, 7120e83)

## connect-popup

- add missing device icons (9fdd1d7)
- Opera is now not marked as unsupported browser (8e34af7)
- fix typo in loader message (9adeb0b)
- allow on mobile (9a6ba2e, 462e45e)
- update no transport description message (10a79da)
- remove bridge references, deeplink to suite desktop (98e98a4)

## connect-explorer

- don't validate connectSrc in webextension (8737d47)
- add link to new webextension example (86a13b1)
- add extra meta tags & preview image (c4e1c2d)
- add loading indicator to method submit button (14e1248)
- clean up coins select - remove namecoin, vertcoin, capricoin and komodo (9cef961)
- applySettings optional values (0bcd83a)
- hide extra headings from toc in homepage (14f89c4)
- show success message in settings (0ca7c0c)
- remove MTT for firmwareUpdate (ebbe96c)
- bad styled-components prop (e2b7fc7)

## connect-webextension

- Prevent multiple content script extension conflicts (348b32a)
- link changelog to the one in connect (a02ec72)

## connect-common

- add new fw 2.8.0 (314052b)
- fw version 1.9.0 and 2.3.0 required (ee623e4)

## connect-plugin-stellar

- update stellar sdk (89cf20e)
- update trends libs (70b9c11)

## Dependencies update

- bump react-intl from 6.6.2 to 6.6.8
- bump @types/chrome from 0.0.260 to 0.0.269
- bump playwright from 1.41.2 to 1.45.3
- bump webpack-merge from 5.10.0 to 6.0.1
- bump webpack-dev-server from 4.15.1 to 5.0.4
- bump @babel/preset-typescript from 7.23.3 to 7.24.7
- bump @babel/preset-react from 7.23.3 to 7.24.7
- bump webpack from 5.90.1 to 5.93.0
- bump rimraf from 5.0.5 to 6.0.1
- bump txs from 4.7.0 to 4.16.2

- npm-release: @trezor/blockchain-link 2.3.0
- npm-release: @trezor/blockchain-link-utils 1.2.0
- npm-release: @trezor/blockchain-link-types 1.2.0
- npm-release: @trezor/connect-analytics 1.2.0
- npm-release: @trezor/analytics 1.2.0
- npm-release: @trezor/connect-common 0.2.0
- npm-release: @trezor/env-utils 1.2.0
- npm-release: @trezor/transport 1.3.0
- npm-release: @trezor/protobuf 1.2.0
- npm-release: @trezor/schema-utils 1.2.0
- npm-release: @trezor/protocol 1.2.0
- npm-release: @trezor/utxo-lib 2.2.0
- npm-release: @trezor/utils 9.2.0
- npm-release: @trezor/connect 9.4.0

# 9.3.0

Improved reliability of popup handshake mechanism.
Improved compatibility with webextensions using TrezorConnect inside offscreen (eg. Metamask).
Cardano: support Conway certificates, increase minimum supported FW to 2.6.0 to clean up legacy code.
Minor fixes in Connect Explorer and documentation.

- feat(connect): Add tag 258 support (90bf3a7)
- feat(connect): Conway certificates (ab003ce)
- feat(connect): applySettings - accept all validated params (65809d8)
- fix(connect): immediate switch from custom to default backend (b8348ca)
- fix(connect): remove getPublicKey coinInfo fallback (fb446f2)
- chore(connect): add new TS3 CA pubkeys and update timestamp (35486ba)
- chore(connect): update fw version number for cardano (d737d3c)
- chore(connect): center changelog version table (93fab15)
- chore(connect): change name in changelog table (bbc5499)
- chore(connect): remove canary from changelog
- fix(connect): race condition when closing and opening popup subsequently (e0e51c7)
- chore(connect): implement required descriptor.type (9ef657f)
- docs(connect): Explorer landing page update (7db29e9)
- fix(connect): deviceList may become undefined after init transport (firefox) (322651b)
- fix(connect): Core with pending initialization (3f8e405)
- fix(connect): preserve DEVICE.ACQUIRED listeners after unsuccessful workflow (4cede4e)
- fix(connect): don't save state with legacy passphrase (af90317)
- feat(connect): new T3T1 colors (0797090)
- chores: 583fbd0, a27a385, 6c789d2

## connect-explorer

- readme pages (be0f933)
- getFeatures (0f9d057)
- don't change affected fields in manual mode (2c7143e)
- canary release explanation in changelog (6cf1eae)
- theme: steps colors (1f7a9e4)
- delete deprecated webusb parameter from init docs (a92429e)
- zoomable and dark mode illustrations (8d55ed1)
- some attributes were not passed trough the proxy (5cb6a26)
- MTT content max height (c8796b4)
- add links in changelog page (8dabb30)
- remove nextra reference from webextension, show amountUnit in signTransaction and fix favicon path

## connect-web

- publish trezor-usb-permissions.html in NPM (c8628ea)
- refactor into classes (fc7a45b)
- core-in-popup mode (52891f3)
- passphrase missmatch resets the flow now (d55ff1c)
- close on popup cancellation, legacy mode for handshake
- check if chrome.tabs really available in webextension env

## connect-iframe

- handshake handling issues

## connect-webextension

- stop publishing Trezor connect webextension proxy (5df3ae0)
- bundle content script to work properly with ES6 modules (fff7eaf)

## connect-examples

- Improve the mv3 sw example to be make it easier for 3rd parties to understand how to integrate connect-webextension (884ec96, a0c0706)

## connect-common

- edit firmware changelogs (3637a56)
- firmware release url (0166df5)
- update firmware binaries to 2.7.2 (6392328)
- T3T1 support (9d0adae)

## connect-popup

- temporary workaround for CONTENT_SCRIPT_LOADED and handling of CONTENT_SCRIPT_LOADED

## connect-ui

- install bridge title align (19c5781)

## Dependencies update

- bump ws from 8.16.0 to 8.17.1 (bc5b787)

- npm-release: @trezor/blockchain-link 2.2.0
- npm-release: @trezor/blockchain-link-utils 1.1.0
- npm-release: @trezor/blockchain-link-types 1.1.0
- npm-release: @trezor/type-utils 1.1.0
- npm-release: @trezor/connect-analytics 1.1.0
- npm-release: @trezor/analytics 1.1.0
- npm-release: @trezor/connect-common 0.1.0
- npm-release: @trezor/env-utils 1.1.0
- npm-release: @trezor/transport 1.2.0
- npm-release: @trezor/protobuf 1.1.0
- npm-release: @trezor/schema-utils 1.1.0
- npm-release: @trezor/protocol 1.1.0
- npm-release: @trezor/utxo-lib 2.1.0
- npm-release: @trezor/utils 9.1.0

# 9.2.4

- chore: BigNumber wrapper (d18ba9a879)
- chore(connect): add Rabby to knownHosts (1ec4c5bfc5)
- chore(transport): make Session type literal (72570f2219)
- chore(connect): re-add feature support checking in cardanoSignTransaction (acf9ffc2cb)
- chore(connect): fw-update: add error message when binary is too small (b0c1173f8d)
- chore(connect): remove legacyresults from cardano fixtures (acd9e1e510)
- chore(connect): bump fw versions required for cardano (c3d96b3ca7)
- chore(connect): remove validation in cardanoSignTransaction, cardanoAddressParameters, cardanoGetAddress, device.validateState (33efb4b8bd,013047bdb1, 21fadd17a6, 29311b5d61)
- feat(connect): use full version in URL when beta (26c70f48f7)
- fix(connect): simultaneous read of connected devices (f181c988a4)
- chore(connect): DeviceList now has two params - full settings object and messages (b6167266c9)
- chore(connect): remove DataManager from DeviceList (afc8760213)
- chore(connect): remove DataManager dependency from DeviceList constructor (7971515d71)
- chore(connect): simplify reduce code duplication in DeviceList (0cf8a04ed0)
- feat(connect): BackupDevice now has params (4120912)
- chore(connect): update protobuf messages (41bff13)
- chore(connect): add new TS3 CA pubkeys and update timestamp (3ae06ac)
- chore(connect): remove deprecated code, bump required fw to 1.8.1/2.1.0, fix typo in log, rename firmwareUpdate_v2 to firmwareUpdate (8af325a, 2f14ff6 649a197, b39030c, b67170c)
- chore(connect): popupPromise improvement, pin retries, invalidDeviceState, flattened onCall/inner (320c5a9,6515f13, 7666994, 99ac0e5, 4aa2b46, fa0974d, 9188727, 08a093b, dd6437e, 27d5a44)
- fix(connect): intermediary reconnect improved, device authenticity, multi-apps synchronization, reading translations, bin_outputs in txcache (115c718, de1b969, 140ec9a a881142, 88d7608, 0bb13d3)
- fix(connect): bin_outputs in txcache (0bb13d3)

## connect-examples

- Update building process to allow multiple lines replacing of url mv2 and mv3 (e88b6f6f47)

## connect-explorer

Connect-explorer has been completely revamped into a new design :tada:

- feat(connect-explorer): use relative paths for assets and connect (f6f7cdf32c)
- fix(connect-explorer): method testing tool scrollbars (f15f6487d8)
- fix(connect-explorer): support GitHub emoji (fda80e5aa3)

## connect-popup

In general measures to address popup closing unexpectedly were taken. Update of content-script.js will be needed to make these changes effective.

- fix(connect-popup): use PassphraseTypeCardLegacy (629d6f8671)
- fix(connect-popup): update text in selectAccount (21f4382)
- fix(connect-popup): add delay before popup bootstrap to allow contentscript load (00b2056)
- fix(connect-popup): webextension example e2e (b9cce02)
- fix(connect-popup): typo in a comment (8e21eeb)
- fix(connect-popup): queue messages sent before init (8850665)
- fix(connect-popup): delay popup.js loading to allow content script to init (92d15bc)
- fix(connect-popup): wait for POPUP.LOADED in webextension (cb18673)

## transport

- feat(transport): make signal required param in constructor (4b82f8d505)

## Dependencies update

- npm-release: @trezor/blockchain-link 2.1.30
- npm-release: @trezor/blockchain-link-utils 1.0.18
- npm-release: @trezor/blockchain-link-types 1.0.17
- npm-release: @trezor/connect-analytics 1.0.15
- npm-release: @trezor/analytics 1.0.17
- npm-release: @trezor/connect-common 0.0.33
- npm-release: @trezor/env-utils 1.0.17
- npm-release: @trezor/transport 1.1.29
- npm-release: @trezor/protobuf 1.0.13
- npm-release: @trezor/schema-utils 1.0.4
- npm-release: @trezor/protocol 1.0.9
- npm-release: @trezor/utxo-lib 2.0.10
- npm-release: @trezor/utils 9.0.24

# 9.2.3

- fix(connect): worker-loader for solana and hanged calls over webusb (46c0e96, 172fa22)
- chore(connect): improve type for releases and pick model and coin support type (996e96d, 273591e)
- feat(connect): add T3T1 pubkeys and T3T1 releases.json (edca868, a984008, 1bc4569)
- feat(connect): add `_extendWebextensionLifetime` option (720b61b)
- feat(connect): allow separate accounts/blocks subscription (98e3b28)
- feat(connect): support identity in blockchain methods (2fbb57f)
- test(connect): fix BackendManager tests (0318aea)
- feat(connect): support identities in BackendManager (76767be)
- feat(connect): automatically update language blob when outdated and move changeLanguage logic to Device (425b52b, 04d4fb8)
- fix(connect): always show device selection when bridge and using core in popup (5f1191e)

## connect-example

- Use `_extendWebextensionLifetime` for extending life time of service worker in example mv3-sw (fe537c0)

## connect-webextension

- Reconnection when service worker goes inactive and option to extend life of service worker (39dcde0, 0377b28)

## connect-explorer-nextra and connect-explorer-theme

- Improve schemas documentation and styling (367f458, a23fa02, ee7c4f6, 667c802, 05b68fa, 6c2e298, 9150147, 81591dc, bb84950, 8ca02e6, c8f144a, 003854c, 8951663, b284b25, d14c026, d69dee1, 1c82b8f)

## mobile

- fix Connect firmware assets import #12090) (4abe34e)

## trezor-user-env-link

- Type updates (68be4d2)

## connect-popup

- test new webextension select device behavior and check remember device by default for mv3 webextension (1aab629, eb6cf5d)

## protobuf

- clean up type of backup_type in schema (19b7bb2)

## connect-common

- Add Czech to available FW translations (4a1aa82)

## Dependencies update

- npm-release: @trezor/blockchain-link 2.1.29
- npm-release: @trezor/blockchain-link-utils 1.0.17
- npm-release: @trezor/blockchain-link-types 1.0.16
- npm-release: @trezor/connect-common 0.0.32
- npm-release: @trezor/env-utils 1.0.16
- npm-release: @trezor/transport 1.1.28
- npm-release: @trezor/protobuf 1.0.12
- npm-release: @trezor/protocol 1.0.8
- npm-release: @trezor/utxo-lib 2.0.9
- npm-release: @trezor/connect 9.2.3

# 9.2.2

Main focus of this release is to allow saving device sessions in webextension, so user's don't have to enter the passphrase repeatedly.

- fix(connect): webextension save sessions (efed18e4ea)
- feat(connect): set default Solana fees (d8cfa5123d)
- fix(connect): add missing isCreatingAccount param validation in blockchainEstimateFee (698ebf625d)
- chore(components): replace Tippy for FloatingUI (a6e3c86759)
- fix(connect): enable changeLanguage in initialize mode (0af5c35f3f)
- chore(suite): remove goerli (8eb6b271a5)
- chore(connect): Add Rainbow Browser Extension to knownHosts (6213f06a58, e648074ec8)
- chore: crowdin translation update (aa9a0d5bfe)
- chore(connect): move logs to @trezor/utils (28c2b9fe57)
- chore(connect): add new CA pubkeys and update timestamp (9b8f4eeb81)
- fix(connect): be more defensive in descriptor parsing (7cf1f02dc4)
- fix(connect): More robust conversion of e.g. 44h to 44' (1ea29b5d6c)
- docs(connect-examples): udpate README with webextensions (8ed2db3ecc)
- chore: upgrade styled-components to v6 (c4bd333501)
- chore(connect-web): add dev URL used for tests (487742a930)
- chore: TS project references for build:libs + buildless utxo-lib (#11526) (4d857722fe)
- fix(connect): no request device in suite (ad6d28e315)
- feat(connect): add translations for Trezor Firmware (a3ebb33571)
- chore(connect-common): add firmware binaries 2.7.0 (4c14b45bd6)
- fix(connect): fix connect for RN (#11489) (14814fd54b)
- chore(repo): mostly buildless monorepo (#11464) (637ad88dcf)

# 9.2.1

Main motivation for this release was [issue](https://github.com/trezor/trezor-suite/issues/11442) introduced in 9.2.0 release in @trezor/connect-web npm package.

- fix(connect): fix build of connect-web (50f35cb) [related issue](https://github.com/trezor/trezor-suite/issues/11442)
- feat(connect): return checksum in the xpub for taproot (458ddf9)
- fix(connect-ui): analytics button to reflect state (cc59ef9)
- chore(connect): unify failed connection and disconnection (c863646)
- feat(connect): leave sticky backend after some time (021ec5c)
- chore(connect-iframe): fix conflicting variable webpack warning on build:lib (cdbdfb2)

## Dependencies update

- npm-release: @trezor/blockchain-link 2.1.27
- npm-release: @trezor/connect-common 0.0.30
- npm-release: @trezor/transport 1.1.26
- npm-release: @trezor/protobuf 1.0.10

# 9.2.0

## @trezor/connect-web npm package

Single unified popup manager that for both connect-web and connect-webextension package.

- chore(connect-web): add channel descriptors to poup, iframe (d6a054e)
- chore(connect-web): refactor popupmanager (af1723e)
- other: 0059145, 5da505b, ee98bb5
- fix(connect-web): race condition POPUP.HANDSHAKE before IFRAME.CALL (a433f85)

## @trezor/connect-webextension npm package

This package is now out of beta.

- fix(connect-webextension): equalSettings in init, don't focus extension on error (64eb6ec)
- feat(connect): add CHANNEL_HANDSHAKE_CONFIRM to webextension events (1527034)
- feat(connect-webextension): emit events for WEBEXTENSION.CHANNEL_HANDSHAKE_CONFIRM (4ab8a8c)
- test(connect-popup): integrate testing for connect-webextension (06b91ec)

## @trezor/connect

- feat(connect): device.availableTranslations field (5ac97e7)
- feat(connect): rebootToBootloader, add params (boot_command, firmware_header, language_data_length) (b0f7487)
- fix(connect): set min version for rebootToBootloader to correct value (74ad010)
- chore(connect): improve types of fetch assets util (9d60004)
- fix(connect): toMessageObject undefined (df55715)
- feat(connect): add reconnect functionality to BackendManager (9783a9e, 3390bfb, af0599f)

## @trezor/connect-explorer and @trezor/connect-popup

- feat(connect-explorer): add changeLanguage method (7339a2d)
- chore(connect-explorer): upgrade markdown-it (087ca01)
- chore(connect-explorer): update markdown-it-replace-link (0a83011)
- chore(connect-explorer): remove unused AsyncSelect (94eb3f7)
- fix(connect): display loading before device acquired (815c69d)
- fix(connect): display device selection if device unacquired (231410e)

## Stellar

- feat(connect): add support for StellarClaimClaimableBalanceOp. (51a3e29)
- chore(connect-plugin-stellar): update stellar libraries (2130437, 714bbbd)

## General refactoring

- chore: dependencies and monorepo changes (fecd89f, c21d81f, 84bc9b8, 5a6759e, 01e33b7, 00fe229, a7e6879, 004938e, fac6d99, d3f8043, ed1fd3e, 3861846, 9fdccc9, 44fa12a)
- chore(repo): remove build from protobuf (chore(repo): remove build from protobuf #11288) (11ffd94)
- chore(repo): remove build:lib for some simple packages (chore(repo): remove build:lib for some simple packages #11276) (7febd10)
- chore(utils): remove build step requirement from @trezor/utils (chore(utils): remove build step requirement from @trezor/utils #11176) (6cd3d3c)
- chore(connect-explorer-webextension): delete package - now in connect-explorer/src-webextension (494afc7)

## Dependencies update

- npm-release: @trezor/blockchain-link 2.1.26
- npm-release: @trezor/blockchain-link-utils 1.0.15
- npm-release: @trezor/blockchain-link-types 1.0.14
- npm-release: @trezor/type-utils 1.0.5
- npm-release: @trezor/connect-analytics 1.0.13
- npm-release: @trezor/analytics 1.0.15
- npm-release: @trezor/connect-common 0.0.29
- npm-release: @trezor/env-utils 1.0.14
- npm-release: @trezor/transport 1.1.25
- npm-release: @trezor/protobuf 1.0.9
- npm-release: @trezor/schema-utils 1.0.2
- npm-release: @trezor/protocol 1.0.6
- npm-release: @trezor/utxo-lib 2.0.7
- npm-release: @trezor/utils 9.0.22
- npm-release: @trezor/connect 9.2.0

# 9.1.12

- chore(connect): add new CA pubkeys and update timestamp (a4ca9b1)
- chore(connect): improve types, replace any with PassphrasePromptResponse (9a95962)
- feat: add Polygon (8c569ca)
- fix(connect-popup): display errors with no code (8b7cbfa)
- fix(connect-popup): don't show error when no device selected (f246369)
- fix(connect-ui): tipcontainer bottom margin (bb0379d)
- refactor(connect): unify message promises (b0d4b11)
- refactor(connect): remove initAsyncPromise (da48a71)
- refactor(connect): unify initCore and initTransport (00deffa, 027be4f)
- refactor(connect): CoreRequestMessage/CoreEventMessage separation (ea3afa2)
- chore(connect-ui): mirror store to local react state (b587a65)
- feat(connect): deal with disconnected && preferredDevice (40e9db8, 6e4ddb4)
- chore(connect): use preferred device from store (d1899e8)
- chore(connect-common): remove es5 target (fails with TypedEmitter) (0a19580)
- feat(connect-common): store is event emitter, saves permissions and preferred device (db0e963)
- feat(connect-common): message channel to allow lazy handshake (79be923)
- chore(connect-ui): ui changes (dcb8e02, 03c6cc6, 936f6b5, 6b7ed69, 8f9f3e2, 4cc0cd6)
- fix(libs): changes in libs that should allow compiling connect with typescript option skipLibCheck: false
- chore(connect): split dev and prod builds. (535dd48)
- dependencies update: @trezor/blockchain-link, @trezor/blockchain-link-types, @trezor/type-utils, @trezor/analytics, @trezor/connect-common, @trezor/env-utils, @trezor/transport, @trezor/protobuf, @trezor/utxo-lib, @trezor/utils

# 9.1.11

- fix(connect): use weak assert in altcoin signTransaction (86b3703279)
- fix(connect): rebootToBootloader misbehaviour (662543c429)
- feat(connect-explorer): add connectSrc to settings (053e9f0908)
- fix(connect): nem and eth signTx validation issues (a53937c2ea)
- fix(connect): allow empty signature in multisig in getAddress (3b356b5952)
- fix(connect-examples): webextensions example update usb permissions url (cfbdfc2469)

# 9.1.10

- chore(connect): bump ADA support version, min required version is now 2.4.3 (7937fea3ec)
- fix(connect): always check ADA passphrase (42c28cc95d)
- chore(connect): decrease build size by using lib of utils which is not treeshaken (b4ab48b25f)
- refactor(connect): rework validation of input params (0c035c26a6, 44430e47ff, c78cd9ad28, c5e9d50bf4)

# 9.1.9

- fix(connect-popup): webusb pairing in webextensions using manifest version 2 [#10709](https://github.com/trezor/trezor-suite/pull/10709).

# 9.1.8

- fix(connect-explorer): eth getAccountInfo coin fix (0108b96)
- fix(connect): do not check firmware range for devices in bootloader (ed53f9f)
- feat(connect): add changeWipeCode method (b85d957)
- deps(connect-plugin-ethereum): @metamask/eth-sig-util@^7.0.0->^7.0.1 (e24c80a)
- chore(connect): improve origTxs and refTxs (ffcb3ee)
- feat(connect): blockchain-link API adjusted (2df1416)
- chore(connect-explorer): add ADA params (9969d65)

# 9.1.7

- fix(connect): correct UiRequestConfirmation type in solanaGetPublicKey (a93ea1890)
- chore(connect): stricter UiRequestConfirmation types (f35bd28bf)
- feat(connect-common): add more backend urls for solana (29f042470)
- chore: Throttler throttling instead of debouncing in `@trezor/blockchain-link` (#10288) (f7ff0cf9f)
- feat(transport): accept encoding protocols as parameter of send, receive and call methods (b64af958e)
- fix(connect-explorer): fs, path, fallbacks in webpack (4f5a15e32)
- chore(connect-common): update fw binaries to 2.6.4 (398509788)
- docs(connect): update index page (8cb5262f6)
- feat(connect-explorer): update SVG in Header component (e8d9beace)
- feat(connect-explorer): update favicon image (a8d660dd2)
- feat(connect-explorer): add Solana (799bf63f5)
- chore(connect): update downgraded @ethereumjs libs (9ac430c42)
- chore(connect): add option for chunkify solana `getAddress` method (98d234f31)
- fix(connect-explorer-webextension): add commitHash to webpack (6b6b77d9d)
- feat(suite): add Solana support (f2a89b34f)
- chore: add Holesky (175707861,8776bb79c)
- feat(connect-explorer): version docs (6ea9ef1f2)
- fix(connect-popup): when connect-src not same as host popup display unknown origin (1bc6f2da1)
- feat(connect-explorer, connect): add `chunkify` paramater to getAddress and signTx methods (7e01923f0,2926b2bdb)
- fix(connect-popup): handle METHOD_INFO (e6d11072b)
- fix(connect): support unknown (custom) internal_models (0915d8893)
- fix(cardano): fee estimate for set-max output (c50a8f2c7)
- chore(connect): use `tslib` as dependency in all public libs (606ecc63b)
- chore: update `jest` and related dependency (b8a321c83)
- chore(connect-examples): cleanup unused lines in script (b509d24d5)
- chore(connect-webextension): postMessage useQueue param (4e626e758)
- chore(repo): update tsx (53de3e3a8)
- chore(connect): remove Solana beta console logs (3ea8343ee)
- chore(docs): add link to internal description of device authenticity config update (ee9ad470a)
- chore(connect): add new CA pubkeys and update timestamp (b64c3f411)

# 9.1.6

- chore(connect): remove web3-utils (2f683f6)
- feat(connect): serialize in ethereumSignTransaction (8f62896)
- feat(connect): add serializeEthereumTx util (a9b21a3)
- refactor(connect): improve ethereumSignTransaction (788910b)
- feat(connect-popup): shared worker logger load dynamically only when required (424383e, f5400f8)
- feat(connect): update solana backend urls, fee info, workers, account descriptor and fw integration (876f609, a3ae0ae, e1058ea, cadffc6, 3d9c703)
- feat(connect-popup): add new method that allow set to use core (d944e50)
- feat(core): new events for core in popup (242a169)
- chore(connect-iframe): suppress subtle crypto warning (1f0e722)
- feat(connect-iframe): standalone core build (c344c3d)
- feat(deps): update deps without breaking changes (7e0584c)
- fix(connect-web, connect-popup): remove trust-issues handle from query param (79036e8, b8640d8, 87b4b84)
- feat(connect-explorer): settings page to restart connect (33e41f6)
- feat(connect): update protobuf messages in custom Transports (if not set) (1eb5156)
- fix(connect): device.run race condition (7d0545c, 7978eab)
- feat(connect-common): add T2T1 & T2B1 firmware binaries 2.6.3 bootloader 2.1.4 (9cca8b1)
- fix(mobile): Fix modularized connect in React Native (57fcb9d, ba42388, 1ef62e7)
- chore(deps): bump @fivebinaries/coin-selection (5e16f60)
- chore(connect): ethereum api dynamic load (b22d228)
- chore(connect): cardano api dynamic load (3ef0e77)
- chore(connect): stellar api dynamic import (473ea94)
- chore(connect): nem api dynamic import (52e2f99)
- chore(connect): eos api dynamic import (cf5b3ad)
- chore(connect): binance api dynamic import (3ccf149)
- chore(connect): tezos api dynamic import (273a9fe)
- chore(connect): ripple api dynamic import (9b17e38)
- chore(connect): prepare for dynamic method import (d4868eb)
- chore(connect): blockchain link workers dynamic import (74fd083)
- chore(connect): implement @trezor/utxo-lib 2.0.0 (06a9f7a)
- feat(connect): add getAccountDescriptor method (0b005ec)

# 9.1.5

- feat(suite): T2B1 replace Model R name by official Trezor Safe 3 name (7460372ed1)
- feat(connect): add authenticateDevice method (45b99c0813, af907a296d, 249ddc358a)
- feat(connect): btg, dash, dgb, nmc, vrc no support for T2B1 (0819ff6fc1)
- feat(suite): support t2b1 firmware installation (9ef2bf627a)
- fix(connect): get firmware status and release after ensuring internal model (dca3333c2d)
- fix(connect-popup): webusb in popup if iframe is on same origin as host (e571971586)
- feat(connect-web): trust-issues query string param (b1b6e3f287)
- feat(connect-plugin-stellar): Update stellar-sdk and stellar-base (ee7e67db04)
- chore(connect): t1 emulator with pin (33c6ca58bf)
- fix(connect-popup): allow decimal custom fee entry (bf20f23f05, 8a8d93b5e8)
- feat(connect-explorer): add rebootToBootloader method (9996676358)
- fix(connect): wrong version format in discovery (19b13d1d4c)
- feat(connect-popup): logger in sharedworker collecting from all environments (732bc7d, 2521c7c, 6501dfa4fd)
- chore(connect): do not lowercase device color (7229b88c20)

# 9.1.4

- feat(connect-popup): add metamask extension id to known third party (f137b3e4d6)
- test(connect): composeTransaction fix doge fee (69a92483c6)
- refactor(connect): remove doge fee branch (c79f3f25d8)
- feat(transport): udp support for transport methods (65e617195c)
- fix(connect): accept signTransaction inputs/outputs with `address_n: string` (82910e0766)
- fix(connect-explorer, connect-popup): add favicon (cafb574ada, c6071123f3)
- feat(connect-popup): use trezor icons with display off from suite-data (1c806519a7)
- feat(connect): trezor color in device object (31535e2b0f)
- feat(connect): trezor name in device object (a0ecb66390)
- feat(connect-common): copy models.json from submodules (6d80197523)
- fix(connect-iframe): device event not propagating to host (d35e37863a)
- feat(connect, suite): unify no backup warning button text (375f3fa1a1)
- feat(connect): add suppressBackupWarning param to getPublicKey and getAccountInfo (2c2698d8af)
- fix(type-check): connect-web includes connect-iframe package.json (f9f576ab66)
- fix(connect-iframe): method.initAsync method superfluous call (37ace99a5d)
- fix(connect-iframe): define plugin in build to support analytics (c793ce358c)

# 9.1.3

- fix(connect): correct import of internal connect dependency (https://github.com/trezor/trezor-suite/issues/9389)

# 9.1.2

- feat(connect): analytics method name and method param names (23df6d8)
- feat(connect): improve calculation of fees and dust limit. (d726aab, 9d1ef05, 60f1e26, 2187c34, d84e3ca)
- fix(connect): device.firmwareType can't be safely determined in bootloader mode so we set it to undefined (c3d33a0)
- feat(connect): signTransaction with refTxs passed as AccountTransaction interface (d7ec435)
- feat(connect): decoding ethereum definitions which allows richer UI in connect-popup (0e9356f)
- feat(connect-explorer): updated examples ethereum (b025834, e58c416), applySettings (1a28816)
- feat(connect-explorer): render docs from docs folder on index page (93fddc4)

# 9.1.1

- feat(connect-popup): added device internal_model in features
- feat(connect): add cancelCoinjoinAuthorization method
- feat(connect): added nodeusb transport. TrezorConnect is now capable of communicating with Trezor devices without using TrezorBridge (in node.js environment).
- feat(connect-popup): when a call to TrezorConnect returns `success: false` popup remains opened and displays error page instead.
- feat(connect-popup): add no-backup warning to getPublicKey method
- fix(connect): respect useEmptyPassphrase param in cipherKeyValue method

# 9.0.11

- fix(connect-web): fix imports from connect

# 9.0.10

- fix(connect-popup): fix connect-popup in firefox
- feat(connect-popup): tiny visual updates, added loading messages based on communication with iframe
- fix(connect-web): prevent unexpected import of transport runtime code in connect/web

# 9.0.9

- fix(connect): prevent .asArray of undefined runtime error
- fix(connect): add missing currencies param for getFiatRatesForTimestamps

# 9.0.8

- feat: support multiple intermediary FWs for T1B1 and devkit binaries
    - `FirmwareUpdate` now accepts `intermediaryVersion` param instead of `intermediary`
    - `getInfo` returns `intermediaryVersion` needed for T1B1 and removed `latest` param. 'release' always return latest version for T1B1 so it means abandoning the concept of incremental updates for T1B1.
- feat: signTransaction now returns `signedTransaction` which can be used for visualization purposes before notification about pending transaction from blockchain is received.
- feat(blockchain): `blockchainGetCurrentFiatRates` and `blockchainGetFiatRatesForTimestamps` now accept additional `token` parameter
- feat: support coinjoin for T1B1
- feat(transport): eth definitions
- feat(webextension): Ignore port events if it is not port created by current popup
- feat(cardano): allow external reward addresses in governance registrations
- refactor(connect): removing browser related code from @trezor/connect

# 9.0.7

- feat(connect-ui): connect UI will now display a warning in case it was opened by an application listed in https://github.com/MetaMask/eth-phishing-detect (#7488)
- fix(connect-ui): set max pin input length to 50 instead of 9 (#7668)
- fix(connect): ltc spending problem (#7666)
- change(connect): TrezorConnect.init `webusb` option is now deprecated. It was replaced with `transports` param `('BridgeTransport' | 'WebUsbTransport')[]`. (#7411)

# 9.0.6

- fix: list tslib as direct dependency
- fix: various improvement and fixes regarding RBF (https://github.com/trezor/trezor-suite/pull/7378)
- change: increase handshake timeout in popup to 90 seconds
- change: TrezorConnect.dispose is now async and resolves only after connected device is released

# 9.0.5

- added: analytics in popup
- fixed: `signTransaction` with litecoin mimble wimble pegout inputs
- fixed: `composeTransaction` cases when composing tx with multiple outputs where at least one is above MAX_SAFE_INTEGER
- updated: @trezor/blockchain-link 2.6.1
- updated: @trezor/connect-common 0.0.11
- updated: @trezor/transport 1.1.6
- updated: @trezor/utils 9.0.4
- updated: @trezor/utxo-lib 1.0.2

# 9.0.4

- @trezor/blockchain-link 2.1.5
- added `setBusy` method
- added `goerli` (TGOR) coin support
- added `serialize` and `coinjoinRequest` option to `signTransaction` method
- added `preauthorized` option to `authorizeCoinjoin` method
- Cardano: added support for [CIP36 Catalyst registration format](https://cips.cardano.org/cips/cip36/) in `cardanoSignTransaction` method
    - `auxiliaryData.catalystRegistrationParameters` is deprecated, use `auxiliaryData.governanceRegistrationParameters` instead

# 9.0.3

- typescript: removed `EosGetPublicKey` type, use `GetPublicKey` type instead
- fix default bip48 script types. [#6393](https://github.com/trezor/trezor-suite/pull/6393) and [#6407](https://github.com/trezor/trezor-suite/pull/6407)
- added `unlockPath` method
- added `SLIP 25` support
- fixed bitcoin extended descriptor (xpubSegwit) for taproot accounts

# 9.0.2

- improved passphrase dialog in popup window
- if popup window does not load in a predefined period of time, error screen with troubleshooting tips is shown

# 9.0.1

- @trezor/blockchain-link 2.1.4

# 9.0.0

## Breaking changes:

- Changed codebase to typescript.
- Removed `Lisk` methods from api.
- Removed `customMethod` api method.
- Exported constants:
    - `CARDANO.ADDRESS_TYPE` => `PROTO.CardanoAddressType`
    - `CARDANO.CERTIFICATE_TYPE` => `PROTO.CardanoCertificateType`
    - `CARDANO.POOL_RELAY_TYPE` => `PROTO.CardanoPoolRelayType`
    - `CardanoCertificateType`
    - `CardanoNativeScriptType` => `PROTO.CardanoNativeScriptType`
    - `CardanoNativeScriptHashDisplayFormat` => `PROTO.CardanoNativeScriptHashDisplayFormat`
    - `CardanoPoolRelayType` => `PROTO.CardanoPoolRelayType`
    - `CardanoTxSigningMode` => `PROTO.CardanoTxSigningMode`
    - `CardanoTxWitnessType` => `PROTO.CardanoTxWitnessType`
    - removed unused `DEVICE.WAIT_FOR_SELECTION`
    - removed unused `UI.CHANGE_ACCOUNT`
- Minimum firmware requirements bumped:
    - 2.4.2 CardanoSignTransaction

## Added:

- `getOwnershipId` method
- `getOwnershipProof` method
- `authorizeCoinjoin` method
- `getFirmwareHash` method
- [support for babbage features in cardano](https://github.com/trezor/trezor-suite/commit/efe9c78a2f74a1b7653b3fddf6cca35ba38d3ae9)
