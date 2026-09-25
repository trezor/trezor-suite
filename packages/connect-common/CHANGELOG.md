# 10.0.1

- refactor(connect): flattened `getFirmwareReleaseConfigInfo` (182c3f81b9)
- chore(connect): remove unused `UI_EVENTS.FIRMWARE_DISCONNECT` (984f76b29e)
- npm-release: @trezor/connect 10.0.0 (149a963a5c)

# 10.0.0

- feat(connect): support Tron delegate/undelegate resource contracts (93cbc731e7)
- npm-prerelease(connect): bump remaining 10.0.0-beta.3 references (81f7711a24)
- npm-release: @trezor/connect 10.0.0-beta.3 (aea4ceb6f7)
- npm-prerelease: @trezor/connect-common 10.0.0-beta.3 (d032ae9910)
- feat(connect): restrict Evolu methods to the privileged API tier (0c89bf60ae)
- npm-prerelease(connect): bump remaining 10.0.0-beta.2 references (f19f708c59)
- npm-release: @trezor/connect 10.0.0-beta.2 (16436a2400)
- npm-prerelease: @trezor/connect-common 10.0.0-beta.2 (bab0f2089f)
- refactor(connect): strict createTransportMessage and createBlockchainMessage creators (c803a17957)
- refactor(connect): remove createPopupMessage creator (a313fdecdd)
- refactor(connect): strict createDeviceMessage creator (33640435ff)
- refactor(connect): strict createUiEventMessage creator (ddc7b0da81)
- fix(connect): send `requestId` in standalone ui-request events (f26a6147e0)
- refactor(connect): make `requestId` required in `createUiRequestMessage` and `UiRequestMessage` (b17b3ebf5a)
- chore(connect): remove `requestId` from `UiEventMessage` (b372b09036)
- test(connect-common): document widened event factory returns (6982cbae99)
- refactor(suite): inject Connect through getTrezorConnect (b56c625852)
- test(connect): add `composePsbt` cases (09ad2bf282)
- feat(connect): add `composePsbt` method (019eada605)
- fix(connect): getPublicKey v9 compatibility flag (3befc63607)
- fix(connect): trim whitespaces in settings `appName` and `hostName` (c6a11d3a93)
- fix(connect): manifest `appName` is required (fe8e15c7fe)
- feat(connect): nightly fw release channel (fe1eb6ac0e)
- feat(connect): sign EIP-7702 transactions via ethereumSignTransaction (6aeeda9b66)
- Revert feat(connect): add ethereumSignAuth7702 method (cdccbe8879)
- feat(suite): Add optional script type param to Sign Message (390fdd4c81)
- fix(suite): change Eth displayablePublicKey to hex instead of xpub (a508e4ab6e)
- chore(deps): bump @types/chrome to 0.2.2 (870393edda)
- refactor(connect): simplify event callback type (a3ed06c767)
- feat(connect): support Soroban InvokeHostFunction Stellar operation (ea9b52e440)
- refactor(connect): move chainId validation from blockchainEvmRpcGetChainId to useBackendsForm (39fa982888)
- refactor(connect): rename blockchainValidateEvmRpcUrl to blockchainEvmRpcGetChainId (5398ea17fc)
- refactor(connect): split UI_EVENT into events and requests (8d5768be29)
- chore(eslint): adopt remaining v10 recommended rules (e5916c5f13)
- feat(suite): support root solana derivation path (31fe1d9f72)
- feat(connect): store FW translation metadata in KnownDevice.availableTranslations (26f0cd334c)
- refactor(redux): remove AnyAction (3241a4e196)
- chore: use typescript 7.0.2 for static type-check (85ebb10780)
- chore: apply prettier changes (7de6f3e919)
- fix(connect-popup): reject selectAccount for coins Suite cannot render a picker for (2877a16d71)
- feat(connect): split `composeTransaction` and `sendTransaction` (919967d6a4)
- feat(connect): emit FIRMWARE_TYPE_CHANGED event (c2e11a9572)
- feat(connect): add ethereumSignAuth7702 method (06146f9f1d)
- refactor(connect-common): guard and clean up onConnect listener in ServiceWorkerWindowChannel (f35ab7c565)
- feat(connect): implement solanaSignMessage (OCMS v1) (1611924b04)
- refactor(connect): send only valid fees in SELECT_FEE event (a300e1be08)
- refactor(connect): remove custom fee loop (eedb2fdde5)
- refactor(connect): remove unused UPDATE_CUSTOM_FEE event (4f5b240fcb)
- refactor(connect): remove unused callable schema (3da0211500)
- docs(connect): explain callable type declaration (d48095e292)
- refactor(connect): shrink callable declaration (d4598cb5f0)
- refactor(connect): add coin symbol cast helper (3314e83766)
- feat(connect-common): export GRANTABLE_PERMISSIONS as single source (5a8804c06f)
- test(connect-common): co-locate API type tests (9ec5727a22)
- chore(connect): bump version to 10.0.0-beta.1 (aaac2abdea)
- test(connect-common): co-locate tests (7710204c38)
- chore(connect): remove remaining deprecated coins from connect-data (0265eb774b)
- chore(connect): remove deprecated misc coins from connect-data (f6791fd466)
- test(connect): co-locate utility tests (efc8e35c45)
- test(connect): co-locate data tests (078328060d)
- fix(connect): forward requestedPermissions through TrezorConnectDynamic.init (9f0980be51)
- refactor(connect): canonicalize permission coin to lowercase CoinSymbol (29acf70bbe)
- refactor(connect): remove dead read_settings permission (a56e5c83f6)
- feat(connect): declare permissions upfront for single-consent approval (92bd5d744f)
- feat(connect): add HyperEVM support (4c3b6e8ea9)
- refactor(connect): shrink Stellar type declarations (afdedb3739)
- refactor(connect): remove obsolete normalized path type (d89e3580f2)
- fix(connect): declare normalized bitcoin paths (0018d5a5e1)
- fix(connect): validate selectAccount selectionType bounds (07064baba8)
- refactor(connect-common): move pathUtils out of @trezor/connect (ee153df233)
- feat(connect): add Robinhood Chain support (bdd4da2778)
- test: reduce type-test declaration sizes (6bf13a1b3e)
- feat(connect): pure-DI transports (instance-only) (042a149f1c)
- chore(networks): rename sdk packages (18fa2fa279)
- chore(networks): adjust relative paths (b0af094307)
- test(connect-common): type-guard tier membership of callable methods (54f0d91ee2)
- feat(connect-common): enforce public tier at runtime in factoryPublic (9c685427fd)
- refactor(connect): narrow coin resolver params to CoinSymbol | number[] (1510a7c656)
- chore(connect): publish files as js and ts, not mjs and mts (25f0ed758f)
- feat(connect): drop multi-form coin input, accept the shortcut only (f2fa7c2772)
- refactor(connect): fix type test imports (5c3c7adf02)
- refactor(connect): improved connect factory mechanism (422c5207b6)
- refactor(connect): remove non-required connect methods (5519a0799b)
- refactor(connect): unify connect factory dependencies with connect core (e9b3d69f38)
- refactor(connect): extract cancel/dispose methods from internal group (9156abfb51)
- refactor(connect-common): rename `core` group to `internal` (66feb4fcb3)
- chore(connect): remove handshake event from webextension proxy (d1b00369e6)
- refactor(connect): separate callable methods (ea90e0a344)
- refactor(connect): polished callableMethods (efc17e42fd)
- feat(suite): report tron staking tx ids before broadcast (74aeaaa24b)
- refactor(connect): share selectAccount addressSelection union type (308d8c9919)
- feat(connect-common): add selectAccount method types (89880c07f9)
- chore(blockchain-link): add descriptor to getTransaction (6edebff196)
- feat(connect): make ethereum definitions source channel configurable (4a719332d3)
- chore(protobuf): remove required rule patch for `Features` (cfcda0d896)
- refactor(connect): extract createUUIDDeferredManager helper (f611a0bf86)
- refactor(connect): extract createCoreCallCancelMessage helper (66b62f993a)
- refactor(connect): reuse @trezor/utils helpers for capitalize and delayed resolve (f24809f4cf)
- feat(connect): encode Tron WithdrawBalanceContract (43cf428dca)
- chore(connect): remove useless connect settings (a617e39bce)
- chore(connect): remove coreMode from connect core (a2c321d528)
- refactor(connect): stop using ConnectSettings everywhere (d47c4d1f51)
- refactor(connect): move dynamic settings to connect settings (9c0707186d)
- refactor(connect): move firmware related connect params to public settings (e0d573b56e)
- fix: bump @types/jest to 30 for TS7 compatibility (d782d3d606)
- feat(connect): application-level enabledNetworks driving Cardano derivation (f4acafa8bf)
- chore(connect): remove ADDRESS_VALIDATION event (203a02d2bb)
- chore(connect): remove useEventListener (475d9692b5)
- chore: bump typescript to 6.0.3 (5d20986f2a)
- feat(connect): expand FW revision check with bootloader-hash-mismatch (85584e963a)
- refactor(connect): extract TrezorConnect interface from schema (8f805573d3)
- refactor(connect): move nostr method definitions to corresponding folder (d35c9edf0d)
- refactor(connect): move tron method definitions to corresponding folder (df45b0b1e3)
- refactor(connect): move tezos method definitions to corresponding folder (498b9452a4)
- refactor(connect): move stellar method definitions to corresponding folder (9862e2b97f)
- refactor(connect): move evolu method definitions to corresponding folder (f88e6c0787)
- refactor(connect): move solana method definitions to corresponding folder (241160af9d)
- refactor(connect): move ripple method definitions to corresponding folder (d4a0eabeab)
- refactor(connect): move monero method definitions to corresponding folder (a364e102cc)
- refactor(connect): move cardano method definitions to corresponding folder (ee78dd86c0)
- refactor(connect): move ethereum method definitions to corresponding folder (0bb98a45af)
- refactor(connect): move account method definitions to corresponding folder (64ab2b0656)
- refactor(connect): move blockchain method definitions to corresponding folder (a875fedfa0)
- refactor(connect): move device method definitions to corresponding folder (f915a874c8)
- refactor(connect): move management method definitions to corresponding folder (822863fe2c)
- refactor(connect): move core method definitions to corresponding folder (c3362be4df)
- refactor(connect): move bitcoin method definitions to corresponding folder (c56659d867)
- refactor(connect): reorganize connect api methods (533fb9f514)
- refactor(connect): move createLogger to host composition roots (3306b2027d)
- fix(connect): nostr new permission system (0e9baa5012)
- feat(connect-common): extend MethodPermission (4e6c327de8)
- feat(connect-common): extend MethodPermission (d52cffc3e9)
- feat(connect-common): add nostr methods types (b483286db9)
- feat(connect): inject logger factory into core, remove internal initLog (75ab51e129)
- refactor(connect): remove sharedLogger from connect settings (40544f7835)
- chore(cardano): remove unused deps (d87f05b5c4)
- chore(cardano): use code from @trezor/coins-cardano (2f86ef9188)
- chore(cardano): add @trezor/coins-cardano deps (2a92cc600b)
- feat(stellar): support xdr in stellarSignTransaction (b1b6997955)
- feat(connect-common): add canonical CoinSymbol type, list and guard (e3b6f431a6)
- chore(utxo-lib): `composeTx` - remove unused floorBaseFee param (46e22f873d)
- fix(connect-common): drop ttrx ledger account type (3225149b06)
- feat(suite): update testnet sepolia and hoodi derivation paths (0143c47c58)
- chore(scripts): rename libESM to lib (f046a3fd2b)
- chore(scripts): remove cjs support in replace-imports.sh (a1059cd8a3)
- feat(connect): add authenticityProof streaming (444e95050c)
- feat(connect): add ethereumClearSigning capability and utilities (919f291873)
- fix: resolve noUncheckedIndexedAccess errors across the codebase (e0d8a3bd20)
- feat(connect): remove disableWebUSB; live transport reconfig via updateConnectSettings (4572ca8162)
- feat(transport): drop legacy bridge port 21325 support (1774c788cb)
- feat(connect-common): callId to cancel method (39a889ff14)
- chore(connect-common): drop unused POPUP.CLOSE_WINDOW event (e600116ed3)
- feat(connect): add `internal` method permission (75e09c1326)
- chore(eslint): forbid `typeof undefined` in type positions (74d75e3cca)
- refactor(connect): unify *GetPublicKey response shape (f1ec159182)
- refactor(types): replace typeof undefined with never in discriminated unions (5e3202a974)
- fix(connect-common): narrow protocol pkg runtime import (848017c602)
- refactor(transport): split into transport-common / transport / transport-web (f498dcebb7)
- feat(connect): remove getAccountDescriptor public API (a6051ce427)
- feat(connect-common): add callId to uiMessage (e7b7f875a9)
- feat(connect-common): new event CORE_CALL_CANCEL (6a26b5f09f)
- refactor(connect): keep authenticateDevice runtime schema out of connect-common (ff44ad5784)
- chore(connect): drop redundant publishConfig.type in ESM packages (af2b73c765)
- chore: tsconfig formatting (8c60ca008d)
- chore(connect): support top-level module type in ESM packages (9aebe9cfb0)
- feat(connect-explorer): add TrezorConnect.pingDevice (a0e4703b0b)
- feat(connect): add `pingDevice` method (72bf54d1f9)
- feat(connect): drop CommonJS output across connect ecosystem (b99609bfb8)
- refactor(device-utils): introduce canonical StaticSessionId parser/validator/formatter (25d0e0e38b)
- fix(connect-common): publish device authenticity dependency (63f9eb899d)
- chore(connect-common): remove unused CONTENT_SCRIPT_LOADED event (8a9842b2df)
- refactor(connect-common): promote MethodPermission and MethodInfo to public API (ce21e263b5)
- feat(connect-common): use UUID as id in call/response msg (b7c6650a57)
- feat(connect): accept decimal amount in PaymentRequest, encode internally (738675ac1b)
- docs(connect): document outputDescriptorBip380 on getAccountDescriptor (1a4ec9b910)
- feat(suite): introduce tron note (393d3344d1)
- feat(solana): add memo support (ff1a4d8fcb)
- chore(eslint): enable @typescript-eslint/no-empty-object-type globally (5a17fa3333)
- feat(suite): improve typing for erc4626 (291e00fca1)
- refactor(suite): change includeErc4626 to erc4626 field in protocols array (d23e0befa7)
- feat(suite): resolve fiat rates for ERC4626 tokens (d59fbc3290)
- chore: rename MLDSA check to MCU check (f6823d9841)
- feat(connect): read MCU DAC response and verify it (a06627868f)
- feat(suite): process Tropic ML-DSA-44 DAC result (197bbc5e02)
- feat(connect): inline devDep types via per-package vendor files (d6fad4c219)
- feat(connect): gap limit to discoverAccounts (aa42c3029b)
- chore(deps): bump @types/chrome, @types/sharedworker, @types/web (3e952cd6fd)
- fix(connect): enforce PAYTOADDRESS for external outputs in signTransaction (344051e7ef)
- fix(connect-common): harden message channel origin validation (766ebe4654)
- chore(connect-common): tighten FirmwareRule and UnavailableCapabilities types (38e17917ae)
- chore(tests): migrate web packages to @swc/jest (15192f30ee)
- feat(connect-web): implement bootstrap in web popup (1e09280ce9)
- refactor(type-utils): add RequireAtLeastOne, dedupe Keys/KeysOfUnion (a5f1a21975)
- feat(suite): add DeFi section to tokens (be2838370e)
- feat(connect-common): outputDescriptorBip380 (45f7075ab1)
- chore(connect-common): move @trezor/transport to devDependencies (f94a3577c9)
- chore(connect-common): remove unused export (7a1d3ebfbd)
- chore(connect-common): direct imports (9b60698bcd)
- refactor(suite): add requestId to UI_RESPONSE.RECEIVE_PIN (70d736cb7e)
- refactor(suite): add requestId to UI_RESPONSE.RECEIVE_CONFIRMATION (d6554b9424)
- refactor(suite): add requestId to UI_RESPONSE.RECEIVE_WORD, (2932649958)
- refactor(suite): add requestId to ui-receive_thp_pairing_tag (967b4171b7)
- refactor(suite): requestId to request passphrase (7c8e59c457)
- refactor(connect): add requestId to ui_request (8152e03733)
- chore(connect-common): move utxo-lib to devDependencies (97fe1dc98f)
- chore: make all blockchain-link-types import direct, no imports (d073ff12e6)
- feat(connect): skip discovery by requesting existing accounts from Suite (6959f4b956)
- chore: switch public client-side packages to MIT license (7b03152f66)
- refactor(connect): adjust methods to new `getFirmwareRange` (d462228f68)
- refactor(connect): improved firmware rule types (14b2940113)
- chore(connect): remove unused `connect` field from coin support (a074a5368a)
- chore: remove npmPublishAccess fields from package.json (743d2836de)
- chore: unify package.json publishConfig (216e6de7cc)
- chore(connect): update proxy settings (586052870a)
- fix(connect): align Tron contract inputs with official field names (044a5599bd)
- feat(connect): return transaction bytes from tronComposeTransaction (2f482d8af8)
- refactor(protobuf): use message schema from definitions index (9209601549)
- chore(connect): move types to connect-common (3c51cc3ee1)
- refactor(connect-common): use deferred manager in messageChannel (46e014abf5)
- refactor: replace custom eslint script with nx one (ad87eac457)
- chore: add type keyword to all types in imports and exports (47c184a859)
- feat(connect): add .mjs to ESM build (d1bd996295)
- feat(connect-webextension): now uses externally_connectable api (c84e94b607)
- chore: remove unused `prepublishOnly` script (0056cb62fa)
- feat(connect): unify result type (8238895b88)
- chore: remove non-npm badges from package READMEs (4aacb27e0e)
- chore(connect-web): remove webextension specific webusb code (b2aa45e5d6)
- chore(connect-data): move firmware public key from env-utils (e2404a99b6)
- chore(connect): remove systemInfo (c4ffa1bfa6)
- fix(connect-common): update exports for new directories (46ec0f46f0)
- chore(connect-common): move VERSIONs constants (8f1213acce)
- chore: bump tsx version (98321960e2)
- chore(connect-common): move WEBEXTENSION constant to connect-common (c0197ea072)
- chore(connect-core): connect errors to connect-common (111b95a97a)
- npm-prerelease: set all @trezor/connect dependencies to 10.0.0-alpha.1 (ab01b2d889)
- feat(connect-data): separate new package from connect-common (b25906f1f4)
- feat(connect): add support for discovery of Tron in Suite (94d04ac540)
- fix: remove test command that won't run any tests (a55e5e506c)
- chore(npm): remove prepublish.js (7559f035c3)
- fix(connect-common): update project references (efbbad10ad)
- feat(scripts): handle libESM in updateProjectReferences (3d71f2c20a)
- chore(connect): fix dependencies (2e1ae32dbf)
- chore(connect): remove connect storage (703716ef50)
- build(repository): Connect publishing ESM (a9e189b9a3)
- chore(connect): remove legacyMode from communication channels (1ce4434f44)
- feat(connect): remove NEM support (b9e7b55832)
- chore(npm): start publishing source maps (36f6e9692d)
- chore: remove @trezor/connact-analytics package (8911d677e2)
- chore: remove udev rules indirection (30547f3dca)

# 10.0.0-beta.3

Breaking changes:

- `ConnectSettingsTransport` redefined as `Transport` (pure dependency injection). Callers must pass a fully constructed `Transport` instance; transport classes and string identifiers (`'BridgeTransport'`, `'WebUsbTransport'`, `'NodeUsbTransport'`, `'UdpTransport'`) are no longer accepted. The legacy `KnownTransport` string-literal type has been removed. See `@trezor/connect` CHANGELOG for caller-side migration.

# 0.5.0

- chore: remove tada from suite (2e60907d0c)
- npm-prerelease: @trezor/connect-common 0.5.0-beta.2 (47cbe9d59f)
- refactor(connect): new replace-imports.sh script using babel (2128d273f3)
- npm-prerelease: @trezor/connect-common 0.5.0-beta.1 (57e7c36773)
- docs(releases): bundling new firmwares (82ddc09e9f)
- npm-prerelease: @trezor/connect-common 0.4.5-beta.1 (0780b8e249)
- chore(connect-common): bundle latest releases fw (19be9a7521)
- feat(connect-webextension): suite web popup implementation for webextension (175e40c82d)
- chore(connect): move message channel impl to common (eeed9f440a)
- chore(suite): update network backends (74e276011e)
- chore(suite): update AVAX backend server (6d7c023598)
- docs(packages): remove link to non-existing document (9291fe7872)
- chore(connect): add Avax (21c129caf1)

# 0.4.4

- npm-prerelease: @trezor/connect-common 0.4.4-beta.1 (21b32236d3)
- fix(connect-common): check FW revision only new format (acafacea41)
- refactor: rename holesky to hoodi (0053b5b021)
- Revert feat(connect-common): temporarily add 1.13.0 FW (1740165c53)
- fix(connect-common): add missing requireds (a753e6d5df)

# 0.4.3

- fix: add depcheck scripts for all the package.json-s (a4f8b09e38)
- feat(connect-common): move releases JSON map to src/ (b9da62ac19)
- npm-prerelease: @trezor/connect-common 0.4.3-beta.2 (c88d7c157c)
- chore(connect-common): remove unused releases 2.9.0 (4c2d615abb)
- feat(connect-common): fw release config bundled in json (a73cdd76c5)
- npm-prerelease: @trezor/connect-common 0.4.3-beta.1 (058b4efd4b)
- chore(connect): cleanup leftovers releases.json (2c1dda8762)
- chore(connect-common): releases JSON to new format (cabe59dd62)
- chore(connect-common): update firmware-release-config (6cf5e66336)
- fix(connect-common): remove deprecated turkish translation on t3t1 (6fe5310f5c)
- feat(suite): lower BTC min fee per unit from 1 sat/vb to 0.1 sat/vb (1f8703eba7)
- chore(connect-common): firmware index for releases JSONs (7b14e451d9)
- feat(connect-common): update revision scripts to new format (1da49c38a2)
- feat(connect-common): add new releases JSON format (b6596968ba)
- Revert feat(suite-common): add 2.9.0 fw binaries (8196cdb60f)

# 0.4.2

- npm-prerelease: @trezor/connect-common 0.4.2-beta.3 (8f288023b1)
- chore(connect): use Branded type util (ac3c50875f)
- npm-prerelease: @trezor/connect-common 0.4.2-beta.2 (b69fa60e62)
- fix(connect-common): add releses.v1 to bundle files (d460a1d511)
- npm-prerelease: @trezor/connect-common 0.4.2-beta.1 (61fffc00c0)
- feat(suite-common): add 2.9.0 fw binaries (f8cc440df2)
- feat(connect-common): add static relese files (282393137c)
- fix(connect-common): reduce bsc block time (90e2b55b46)
- feat(connect-common): temporarily add 1.13.0 FW (8d1425ab8c)

# 0.4.1

- npm-prerelease: @trezor/connect-common 0.4.1-beta.1 (b39ee7ea52)
- fix(connect-common): bump bl version to 2.1.10 on t3b1 (35082e5d86)

# 0.4.0

- npm-prerelease: @trezor/connect-common 0.4.0-beta.1 (cde234d2e1)
- feat(connect): Add support for Stellar testnet. (4231425ad7)
- feat(connect): Add basic support for Stellar. (180265b522)

# 0.3.5

- npm-prerelease: @trezor/connect-common 0.3.5-beta.1 (518cb2a22d)
- chore: apply latest prettier (eb758acea9)

# 0.3.3

- npm-prerelease: @trezor/connect-common 0.3.3-beta.1 (3fe6d1fdb7)

# 0.3.2

- npm-prerelease: @trezor/connect-common 0.3.2-beta.2 (9c5bbd9601)
- npm-release: @trezor/connect 9.5.2-beta.1 (#17529) (3d7542843b)
- fix(connect-common): revert t3b1 min_bootloader_version bump (3f9e16c788)
- chore(connect-common): add fw binaries for 2.8.9 (63a69af876)

# 0.3.1

- npm-prerelease: @trezor/connect-common 0.3.1-beta.1 (f652f8a255)
- feat(backend): added backends so that each EVM has 4 endpoints (f5c057c2be)
- fix(repo): fix generate package script (#17300) (a13f269b99)

# 0.3.0

- npm-prerelease: @trezor/connect-common 0.3.0-beta.1 (bc89ee33de)
- chore(connect-common): add fw binaries for 2.8.8 and 1.13.0 (6ef17681ba)
- npm-prerelease: @trezor/connect-common 0.2.8-beta.1 (e596b27a42)
- chore(trezor-common): uptate coins.json and coins-eth.json Replacing testnet 3 with testnet 4 as default Bitcoin Testnet. (0c1db741b4)
- chore(packages): autofix for sort-imports eslint rule (b96c899ebb)
- chore(connect-common): update coins and coins-eth for T3W1 support (5ba81f81ed)
- chore(connect-common): sort coins-eth.json by chain_id (2b32394dfe)
- chore(connect): simplify transportInfo (bc7bf5d7a8)
- chore(connect-common): add fw binaries for 2.8.7 (4f2733bcbe)
- chore(blockchain-link): update networks to use trezor.io proxy servers (c6d420cde0)
- feat(suite-native): bnb to bsc migration (b2e666250c)
- feat(connect): add support of L2 ETH networks (26ff8eada4)
- feat(connect): add Arbitrum one (0865836724)
- chore(connect-commmon): decrease min bootloader version for 2.8.3 (ea4a3d8061)

# 0.2.7

- npm-prerelease: @trezor/connect-common 0.2.7-beta.1 (d876bc6071)
- Revert chore(connect-common): add fw 2.8.6. for t3t1 (064c56a642)
- chore(connect-common): add fw 2.8.6. for t3t1 (21b4b9b0a3)

# 0.2.6

- fix(connect-common): update ripple default backends (6a3dbf2b77)

# 0.2.5

- npm-prerelease: @trezor/connect-common 0.2.5-beta.1 (6314de0dad)

# 0.2.4

- npm-prerelease: @trezor/connect-common 0.2.4-beta.1 (55487acb49)
- fix(connect): preferred device handling based on state (58b854cbed)

# 0.2.3

- npm-prerelease: @trezor/connect-common 0.2.3-beta.2 (5038b5bbd4)
- chore: get rid of '@typescript-eslint/no-unused-vars': 'off', and enforce it everywhere (1ad7b6f9b1)
- chore: enforce @typescript-eslint/no-restricted-imports everywhere (5d1104bfeb)
- chore: add 'import/no-duplicates' ESLint rule (8d8beba862)
- feat(connect): add t3w1 releases.json (01cdee48f1)
- refactor(connect): separate unique and transport device path (0f8d233d56)
- npm-prerelease: @trezor/connect-common 0.2.3-beta.1 (412da596f1)
- chore: update backends for bsc and op (458f0fe3d9)
- feat(connect): add Optimism (c2fb244649)

# 0.2.1

- npm-prerelease: @trezor/connect-common 0.2.1-beta.1 (4dc0af2640)
- chore(connect-common): change lng blob in release.json (c8a0c46067)
- chore(connect-common): add FW 2.8.3 binaries for T3B1 (c32984c54e)
- chore(connect-common): add FW 2.8.3 binaries for T3T1 (b57198acf7)
- feat: add filterCoins script, update coins (74c53f68ee)
- chore(connect-common): update coins.json via yarn update-coins (f7c16e1e34)
- chore(connect-common): add t3b1 to coins.json (6a8b460250)

# 0.2.0

- npm-prerelease: @trezor/connect-common 0.1.1-beta.3 (2bf4c38c95)
- feat(connect-common): Generalize firmware-check script for all devices, backfill revisionIds into releases (655b9d3574)
- chore(connect-common): add fw 2.8.1 (847cfd6a1d)
- chore(connect): rename bsc to bnb as it is declared in fw repo (0174dc2f38)
- feat(connect-common): adding revisions into releases.json & adding a script to check their correctness (fcc68d281c)
- npm-prerelease: @trezor/connect-common 0.1.1-beta.2 (c9bf01cb8a)
- chore: update txs from 4.7.0 to 4.16.2 (59c856fd0f)
- npm-prerelease: @trezor/connect-common 0.1.1-beta.1 (fe9453ed05)
- chore(connect-common): fw version 1.9.0 and 2.3.0 required (ee623e4090)
- feat(suite): add support for Bitcoin Only changelog + add Markdown support for all changelogs (a707883081)
- chore(connect-common): added fw 2.8.0 changelog (8accbc4ab3)
- chore: add T3T1 fw binaries to lfs (abaff39c54)
- chore(connect-common): add new fw 2.8.0 (314052b56a)

# 0.0.34-beta.1

- chore(connect-common): edit firmware changelogs (3637a56cf7)
- fix(connect-common): firmware release url (0166df50e6)
- chore(connect-common): update firmware binaries to 2.7.2 (63923287e8)
- chore(connect-common): T3T1 support (9d0adae993)

# 0.0.33-beta.1

- chore(connect): bump required fw to 1.8.1/2.1.0 (2f14ff6703)
- chore(connect-common): fix bootloader_version in the first t3t1 record (6ebae70094)

# 0.0.32

- feat(connect): add T3T1 releases.json (a9840087c8)
- chore: remove min_bridge_version from releases.json (c384914903)
- chore(connect-common): add Czech to available FW translations (4a1aa824c6)

# 0.0.31

- fix(connect): webextension save sessions (efed18e4ea)
- chore(suite): remove goerli (8eb6b271a5)
- chore: TS project references for build:libs + buildless utxo-lib (#11526) (4d857722fe)
- chore(connect-common): add firmware binaries 2.7.0 (4c14b45bd6)
- chore(repo): mostly buildless monorepo (#11464) (637ad88dcf)

# 0.0.30

- fix(connect): fix build of connect-web (50f35cb2a)

# 0.0.29

- fix: from g:tsx to local tsx in prepublish script (d21d698b2)
- fix(connect-common): remove confusing log in AbstractMessageChannel (6d3b60c73)
- chore(repo): remove build:lib for some simple packages (#11276) (7febd10cf)
- chore(suite): autofix newlines (c82455e74)
- chore(utils): remove build step requirement from @trezor/utils (#11176) (6cd3d3c81)
- fix(connect-web): workaround to work with older content-script (5da505b02)
- fix(connect-web): reconnect message channel (ee98bb51c)
- chore(connect-web): refactor popupmanager (af1723e4f)
- chore: use global tsx (c21d81f66)
- chore: update typescript and use global tsc (84bc9b8bd)
- chore: use global rimraf (5a6759eff)
- chore: use global jest (a7e68797d)
- chore: upgrade jest to 29.7.0 (3c656dc0b)
- chore: upgrade jest (004938e24)
- chore: update root dependencies (fac6d99ec)

# 0.0.28

- feat(suite): Rename Polygon to Polygon PoS (15a7fd38dc)
- feat(suite): add Polygon (8c569ca580)
- chore(connect-common): remove es5 target (fails with TypedEmitter) (0a19580f63)
- feat(connect-common): store is event emitter, saves permissions and preferred device (db0e9631da)

# 0.0.27

- feat(connect-common): message channel to allow lazy handshake (79be923e67)

# 0.0.26

- feat(connect-common): add resolve messages promises to abstract (f9e6f304f)
- fix(connect-common): when init always create new deferred (70c6c0048)

# 0.0.24

- feat(connect-common): add more backend urls for solana (29f042470)
- chore(connect): use `tslib` as dependency in all public libs (606ecc63b)
- chore: update `jest` and related dependency (b8a321c83)
- chore(connect-common): update fw binaries to 2.6.4 (398509788)
- chore(repo): update tsx (53de3e3a8)
- feat(suite): add Solana support (f2a89b34f)
- chore(suite): unify support config for eth coins (8776bb79c)
- chore(suite): add Holesky (175707861)
- chore(connect-webextension): postMessage useQueue param (4e626e758)

# 0.0.23

- feat(connect): update solana backend urls (876f60939)
- chore(repo): Upgrade TS 5.3 (#10017) (7277f9d0f)
- chore(jest): update in connect-common package (5801d2595)
- chore(repo): upgrade to TS 5.2 (#9989) (bf8d0fe80)
- chore(tests): cleanup jets configs (#9869) (7b68bab05)
- feat(deps): update deps without breaking changes (7e0584c51)
- feat(connect-common): add T2T1 & T2B1 firmware binaries 2.6.3 bootloader 2.1.4 (9cca8b14f)
- chore(desktop): update deps related to desktop packages (af412cfb5)

# 0.0.22

- chore(connect): update coins.json support format (95f270fec)
- fix(connect-common): fix bootloader version in T2B1 release config (4e698091b)
- feat(suite): support t2b1 firmware installation (9ef2bf627)
- chore(connect): fix local storage check (#9547) (b9ac84446)

# 0.0.19

- chore(connect): update coins.json (trezor-common f2374ae) (3b21c4308)
- chore(connect-\*): change model to internal model (8edb0a59d)
- feat(suite): add Sepolia (bc2236c1c)
- fix(connect-common): put back goerli and etc records for suite/blockchain-link (23783a3ef)
- chore(connect): remove unused rskip60 field from coininfo (e686e143c)
- chore(connect): update coins.json (ebcb36d75)

# 0.0.17

- chore: forgotten renaming to T1/TT (5decd0839)
- chore: unify trezor names in docs/comments (74290aab3)

# 0.0.15

- a926901a6 chore: unify T1 and TT names
- 211ac5ef3 chore(coins.json): remove old eth testnets

# 0.0.14

- chore(connect): move systemInfo to connect-common

# 0.0.13

- 2.6.0 FW

# 0.0.12

- feat: cardano preview testnet

# 0.0.11

- refactor storage
    - `storage.load(key)` -> `storage.load().key`
    - `storage.save(key, value)` -> `storage.save(state => ({ ...state, key: value }))`
- versioning of storage

# 0.0.10

### Added

- 2.5.3 FW

### Removed

- 2.5.2 FW

# 0.0.9

### Added

- 1.11.2 & 2.5.2

# 0.0.6

### Added

- 1.11.1 & 2.5.1 FW, (1.11.0 BL)
- [storage utils](./src/storage) moved from standalone Connect repository
- [coins.json](./files/coins.json) moved from standalone Connect repository

### Removed

- 1.11.0 & 2.5.0 FW

# 0.0.5

### Added

- 1.11.0 & 2.5.0 FW

# 0.0.4

### Added

- 1.10.5 FW
