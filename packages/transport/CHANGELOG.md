# 1.4.4

-   npm-prerelease: @trezor/transport 1.4.4-beta.1 (4088a73073)
-   chore(deps): update usb dependency from 2.14.0 to 2.15.0 (7f3f70a55b)
-   fix(transport): reinit sessions background when initing webusb transport (968234bee7)
-   chore(transport): remove unused onClose param from release (64300a51aa)
-   fix(transport): add synchronous release (f4d1eb6eb5)

# 1.4.3

-   npm-prerelease: @trezor/transport 1.4.3-beta.1 (78542f7870)
-   chore(transport): usb: rework implementation of device.reset (e75c5b00ea)
-   chore(transport): usb: move selectConfiguration outside of reset block (de8bbf162e)
-   chore(transport): usb rename 'first' param to 'reset' (afb24c461c)
-   fix(transport): usb: select configuration only if not already selected (8244a4ce91)
-   chore(transport): do not claim interface that is already claimed (d93655f57e)

# 1.4.2

-   npm-prerelease: @trezor/transport 1.4.2-beta.2 (8bac92fdc8)
-   fix(transport): `UDP` read from buffer or promise (444ace3bb9)
-   npm-release: @trezor/connect 9.5.2-beta.1 (#17529) (3d7542843b)
-   feat(transport): load protobuf definitions (04cc60bd84)
-   chore(connect): change `buildMessage` param. `encode` > `protocol` (cdd43fe629)

# 1.4.1

-   npm-prerelease: @trezor/transport 1.4.1-beta.1 (31d1473977)
-   fix(repo): fix generate package script (#17300) (a13f269b99)
-   feat(connect): add `bluetoothProps` to Device (db9e51ad2a)

# 1.4.0

-   chore(deps): unify ts-node version (3187da7bf4)
-   Revert chore(transport): move long dep to protobuf package and unify its version with protobufjs (4a6b98bcf3)
-   chore(transport): move long dep to protobuf package and unify its version with protobufjs (3ab195cf19)
-   chore(transport): update long from 4.0.0 to 5.2.0 (241eebcb72)
-   chore(utils): typedObjectKeys (30f8f4fc59)
-   fix(connect): releasing device on browser reload using sendBeacon api (f308e1a42f)
-   npm-prerelease: @trezor/transport 1.4.0-beta.1 (4182c7dcd6)
-   chore(transport): remove unused transport-interface-error (c486d86ef3)
-   fix(transport): enumerate when UsbDevice without serialNumber disconnects (3f0f817ffd)
-   fix(transport): close connected UsbDevice if opened (8a1bb83fc0)
-   fix(transport): transferOut timeout must be inside try block (723a253667)
-   chore: replace createTimeoutPromise with resolveAfter (fd9f5098ce)
-   feat(transport): add ping to transports (98af487887)
-   chore(transport): remove unused export (a12e98efd3)
-   chore(transport): add another log in usb read error case (9924cb1e40)
-   fix(transport): usb - write timeout (eb781d8c41)
-   npm-prerelease: @trezor/transport 1.3.8-beta.1 (38c249b40a)
-   chore(packages): autofix for sort-imports eslint rule (b96c899ebb)
-   chore(transport): make messages param required in abstract constructor (6c6244475e)
-   fix(transport): synchronize usb.getDevices since it returns wrong results when called simultaneously (571439e5dd)
-   chore(deps): update various @types packages (c6c6b36900)
-   feat(connect): add `setTransports` method (4880cd3d0c)
-   refactor(connect): DeviceList init rewritten into abortable tasks (d971ce8bcc)
-   chore: enable ESLint rule for as-needed | auto-fix (64fcbde4bd)

# 1.3.6

-   npm-prerelease: @trezor/transport 1.3.6-beta.1 (52aae6ddc6)
-   chore: unify types for setTimeout return type to address the NodeJS types leak issue (3f34981e5d)
-   chore(transport): reduce verbosity of usb logs by removing device (c4bef18118)
-   fix(transport): propagate libusb_access_error for correct udev rules component rendering (aced3af557)
-   chore(transport): get rid of timeout in sessions background (430e877f8d)
-   fix(transport): narrow error handling of disconnected device to be the same as with trezord-go (2dcaafd766)
-   fix(transport): match hid devices correctly on usb layer (cdd2a17c74)

# 1.3.5

-   npm-prerelease: @trezor/transport 1.3.5-beta.1 (c8c6a8b5c7)

# 1.3.4

-   npm-prerelease: @trezor/transport 1.3.4-beta.1 (29c4ff061f)

# 1.3.3

-   npm-prerelease: @trezor/transport 1.3.3-beta.2 (de2cfbf343)
-   chore: get rid of '@typescript-eslint/no-unused-vars': 'off', and enforce it everywhere (1ad7b6f9b1)
-   chore: enable import/order rule for whole codebase (e22b683733)
-   chore: add recommanded checks from eslint-plugin-jest (55d663ca2d)
-   fix(transport-bridge): synchronize was too strict, allow enumerate and call (b7afbd0515)
-   fix(connect): webusb sessions sync in all deployments (13ec59a53d)
-   chore: add no-unsafe-optional-chaining as it became part of recommanded settings (e4c191ee7b)
-   chore: add no-empty as it will became part of recommanded (ef2dd42a5e)
-   chore: enable 'prefet-const' ESLint rule (ff5fe34e9e)
-   chore: add 'import/no-duplicates' ESLint rule (8d8beba862)
-   feat(transport): implement transport.id and descriptor.sessionOwner (ab294cb3ef)
-   test(connect): adjust tests (934ae43a30)
-   refactor(connect): device handling improved (d5077c8e06)
-   refactor(transport): emit update with separate descriptors (8a98804706)
-   chore(protobuf): remove `MessageType_` prefix from `MessageType` enum (f620e40f2a)
-   chore(libs): update @types/sharedworker 0.0.124 to 0.0.130 (3ce0e31de7)
-   fix(transport): udp interface-change event (17bac171ec)
-   fix(transport): api.dispose on transport.stop (e79130e88e)
-   npm-prerelease: @trezor/transport 1.3.3-beta.1 (48637b2975)
-   chore(transport): passing rest params to parent transport class (f3eff3a302)
-   refactor(transport): background sessions improved (7644107353)

# 1.3.1

-   npm-prerelease: @trezor/transport 1.3.1-beta.1 (71a9c73da1)
-   feat(transport): unify path format for all transports (masked serialNumber) (edc6b6dec1)
-   refactor(transport): don't pass signal to transports (0cb09ab127)
-   refactor(transport): sessions background without abort signal (4f6e8cf370)
-   test(transport): better abortable methods (6dbeefde62)
-   refactor(transport): better abortable methods (583f4aacb8)
-   refactor(transport): unknownError optional (82dcd5000a)
-   refactor(transport): improved listen loops (8bda3abfe2)
-   fix(transport): improve types (47525ff18a)
-   revert(transport): remove explicit semver labels handling (8f33d930d3)
-   fix(transport): node bridge version parsing issue (7a6ff560bb)
-   chore(deps): update @types/bytebuffer @types/sharedworker @types/web (a9eaedc0a7)
-   fix(transport-bridge): lock per path (ea069c3988)
-   test(transport): unit test adjustment (e7305b93f2)
-   refactor(transport, connect): descriptor diff improvement (afa479e1ea)
-   feat(transport): `BridgeTransport` use `BridgeProtocolMessage` (43f321e5ff)
-   fix(transport): node-bridge udp reports same value in descriptor.vendor as the old bridge (a26ec84d20)
-   fix(transport): node-bridge udp reports same value in descriptor.product as the old bridge (2b7da5ef87)
-   fix(transport): UDP api: fix missing device disconnect or late device connect events (9d3c1390f5)
-   chore(transport): remove duplicated fn (29dab70e12)
-   chore(transport): move type definition to the only place where it is used (1a2fbf7f7d)
-   fix(transport): usb api in node and abort (5c2cb7d048)
-   fix(transport): do not load serialNumber if already loaded (53c722801d)
-   fix(transport-bridge): handle concurrent access cases (29d6e991ef)
-   fix(transport): remove BridgeTransport.receive timeout (415a8355f0)
-   fix(transport): transport resetting (b689e0206a)
-   fix(transport): UsbApi abort endless device.transferIn/transferOut using device.reset (eb5215c66f)
-   chore(transport): when read returns empty buffer, return ERRORS.INTERFACE_DATA_TRANSFER (1065225e4b)
-   chore(deps): update usb 2.11.0=>2.13.0 (a12e1353d5)
-   chore(deps): update protobuf-js 7.2.6=>7.4.0 (0b937d6fe7)
-   chore(deps): update @types/chrome; @types/web; @types/sharedworker (8e73aeb59b)
-   feat(transport): add DebugLink support to NodeUsbTransport and UdpTransport (6ba2bd1d27)

# 1.3.0

-   npm-prerelease: @trezor/transport 1.2.1-beta.3 (4cb7f32c21)
-   test(transport): add check for unregistered listeners also to udp api (539204f3ed)
-   fix(transport): clear abort listener in UsbApi abortableMethod (f5dfbad901)
-   test(transport): unit tests now fail when eventlisteners memory leak is detected (e602689079)
-   fix(transport-bridge): fix concurrent enumerate on node-bridge (94d1a263d6)
-   test(transport-test): introduce new dedicated testing package (f0a060127d)
-   fix(transport-bridge): cleanup also sessions background on dispose (a68bae8897)
-   chore(transport): descriptor legacy fields and updating local descriptors (460fb75a88)
-   chore(transport): remove unused json-stable-stringify dep (5d5722228b)
-   npm-prerelease: @trezor/transport 1.2.1-beta.2 (b5e8d4e769)
-   chore: update @babel/preset-typescript from 7.23.3 to 7.24.7 (22b452d19c)
-   chore: update txs from 4.7.0 to 4.16.2 (59c856fd0f)
-   fix(transport): pass all options to bridgeApiCall (signal, timeout) (96da7b911c)
-   chore(transport): reduce noise in logs by printing less device info (ba1e335339)
-   test(transport): stop testing legacy bridge versions (b374ebae50)
-   test(transport): remove misleading comments (be42c1338c)
-   chore(transport): return Buffer from transport api read (2d6744abab)
-   refactor(connect): separate onTransportUpdate (4780c51904)
-   npm-prerelease: @trezor/transport 1.2.1-beta.1 (65046451dd)
-   chore(transport): use shared method for sending chunks to api (f8e4ec4565)
-   chore(transport): remove duplicated code (91cf20d007)
-   fix(transport): bridge: handle listen loop correctly when Unable to open device error (eab01684cb)
-   feat(transport): propagate hid descriptors to higher layers (97d3d78e1d)
-   fix(transport): remove listeners of AbortSignal to prevent memory leaks (b7b51d8944)
-   feat(connect-web): automatic fallback to core in popup (e4e1fcc033)
-   chore(transport): optimize imports for tree shaking (60177c7d2e)
-   fix(transport): correctly reference class instance method (12fe5a0e74)
-   chore(transport): remove duplicated types declaration (6cb4e8691c)
-   chore(transport): remove unnecessary return type from Usb and Udp api (8a41a883f1)
-   feat(transport): `AbstractApiTransport` with abort signal (5090458cc4)
-   feat(transport): `UsbApi` with abort signal (756f953b5c)
-   feat(transport): `UdpApi` with abort signal (1c93308e6a)
-   fix(transport): do not timeout AbstractApiTransport `send` and `receive` methods (bae2e15933)

# 1.1.30-beta.2

-   chore(transport): remove enumeration intent signaling (ef5b83e6f1)
-   feat(transport): make descriptor.type required (6b8a46b3be)
-   fix(transport-bridge): pass type to listen,stable stringify comparison (667dc4a26b)

# 1.1.30-beta.1

-   chore(transport): add more logs (4eeed40ad6)
-   fix(transport): UdpTransport use `listen` and `stop` to control enumeration (4356826bc4)

# 1.1.29

-   chore(transport): make Session type literal (72570f2219)
-   chore(transport): specify apis fields more verbosely (public/protected) (786fa92fdc)

# 1.1.29-beta.1

-   feat(transport-bridge): introduce dispose method in transport-bridge (7fe9e7cd56)
-   fix(transport): usb device filtering (d5ba4383c0)
-   fix(connect): simultaneous read of connected devices (f181c988a4)
-   test(transport): enable skipped unit tests (6516c718b7)
-   fix(transport): AbstractApiTransport.acquire listenPromise condition (c37d12961a)
-   fix(transport): Transport.stopped initial value (e9638f48ed)
-   feat(transport): make signal required param in constructor (4b82f8d505)

# 1.1.28

-   chore(protobuf): ability to build protobuf messages from the specified branch (7a6babb818)
-   fix(transport): remove accidental descriptors object mutation (3cd6b820f9)
-   Revert feat(transport): add scheduleActionParams to call api (4de6cbed0c)
-   feat(transport): add scheduleActionParams to call api (40a053013a)
-   feat(protocol): separate chunking from encoding (2f445ba734)
-   chore(transport): drop dead code (faba718c9f)
-   chore(protocol): rename decode response fields (1db2916fed)
-   test(transport): fix e2e triggering unit tests (9c117de07e)
-   feat(transport): handle cases when bridge returns descriptor with same path but different product (e2abb91fc8)
-   chore(transport): improve tests setup (5aa27a0fba)
-   chore(transport): keep track of full descriptors in background (be400968bb)
-   feat(transport): add field type to descriptor (74a7214adb)
-   test(suite-native): detox e2e (#11821) (3e3f185ece)

# 1.1.27

-   chore(ci): faster transport E2E (5154075030)
-   fix(transport): accept logger also for usb transports (3a5dee1318)
-   chore: TS project references for build:libs + buildless utxo-lib (#11526) (4d857722fe)
-   fix(connect): fix connect for RN (#11489) (14814fd54b)
-   chore(repo): mostly buildless monorepo (#11464) (637ad88dcf)

# 1.1.26

-   chore(transport, trezor-user-env-link): remove cross-fetch (e489dce33)

# 1.1.25

-   fix: from g:tsx to local tsx in prepublish script (d21d698b2)
-   chore(suite): autofix newlines (c82455e74)
-   chore(utils): remove build step requirement from @trezor/utils (#11176) (6cd3d3c81)
-   feat(connect): add support for StellarClaimClaimableBalanceOp. (51a3e294d)
-   chore(repo): ESLint refactor + speed up 70% (#11143) (44fa12a79)
-   chore: update various dependencies (no major update) (fecd89f6e)
-   chore: use global tsx (c21d81f66)
-   chore: update typescript and use global tsc (84bc9b8bd)
-   chore: use global rimraf (5a6759eff)
-   chore: update prettier (00fe229e0)
-   chore: upgrade jest to 29.7.0 (3c656dc0b)
-   chore: upgrade jest (004938e24)
-   chore: update root dependencies (fac6d99ec)
-   chore: updated deprecated jest syntax (d3f8043f0)

# 1.1.21

-   chore(transport): remove unused files (b69076a80)
-   chore(transport): remove custom eslint no-underscore-dangle rule (049e42d18)
-   chore(transport): remove custom eslint no-await-in-loop rule (be90dcd2a)
-   chore(transport): remove custom eslint no-restricted-syntax rule (8b4910209)
-   chore(transport): remove custom eslint ban-types rule (44da16615)
-   fix(transport): add missing await (aaecf9440)
-   chore(transport): move node-bridge logic to transport-bridge package (0f2882af4)
-   fix(mobile): fix Cardano receive (#10580) (3c5e253e0)
-   feat(transport): add node-bridge module (acf5056f7)
-   chore(transport): separate receive util (d1d964c1d)
-   fix(connect): check custom Transport instance (018ef646d)

# 1.1.19

-   chore: remove `bytebuffer` dependency (9b2f9def0)
-   chore(connect): use `tslib` as dependency in all public libs (606ecc63b)
-   chore: update `jest` and related dependency (b8a321c83)
-   feat(transport): allow custom chunkSize in protocol-v1.encode (ba855c980)
-   feat(transport): accept encoding protocols as parameter of send, receive and call methods (b64af958e)
-   feat(transport): unify protocol encode/decode functions (b4f08409c)
-   chore(repo): update tsx (53de3e3a8)
-   tests: switch to fw main branch (91c450631)

# 1.1.18

-   chore(repo): Upgrade TS 5.3 (#10017) (7277f9d0f)
-   chore(repo): upgrade to TS 5.2 (#9989) (bf8d0fe80)
-   refactor(transport): rename files (f5286f613)
-   chore(tests): cleanup jets configs (#9869) (7b68bab05)
-   feat(deps): update deps without breaking changes (7e0584c51)
-   tests(transport): check presence of protobuf messages (60f1a8bf1)
-   feat(transport): do not require protobuf messages (221573be2)
-   tests(transport): fix type-check (ffcfde3bb)
-   tests(transport): fix imports in e2e (1ffb1c05b)
-   tests(transport): remove unused script/test (6feadb573)
-   chore(desktop): update deps related to desktop packages (af412cfb5)
-   feat(mobile): create react-native-usb library (#9689) (3be5f5015)

# 1.1.17

-   chore: edit links to trezor-firmware repo after renaming its main branch (2b0606371)
-   fix: content type header applied for native (#9594) (c84270e13)
-   fix: use type header with the bridge API (#9590) (b8bb2dfe6)

# 1.1.16

-   feat(transport): udp support (65e617195)
-   chore: adjust/unify createDeferred usage (4d724a451)

# 1.1.15

-   chore(transport): merge lowlevel folder with utils (1d8d76637)
-   chore(transport): reorganize protocol related logic (cbabe2e2c)
-   refactor(transport): small change in interface device type (fb73caa39)
-   chore: introduce protobuf and protocol packages (072042e77)

# 1.1.14

-   chore(deps): bump protobufjs from 6.11.3 to 7.2.4 (d0cb6caae)
-   fix(transport): fix occasional race condition (fb8062e18)
-   feat(transport): internal_model enum (26c17386a)

# 1.1.13

-   test(transport): extend unit tests (99e12c7be)
-   fix(transport): race condition in listen (6cd72cb60)
-   chore(transport): update messages (7bc259f8b)
-   feat(transport): add nodeusb transport (f0cee52f2)
-   chore(deps): update (a21a081ba)
-   chore(transport): reuse typed event emitter from utils (379c82dd3)
-   chore(request-manager,transport,connect-plugin-stelar): fix extraneous dependencies (68bf1d451)
-   chore(transport): refactor (f7b97fb68)

# 1.1.11

-   819c019d1 chore: use workspace:\* everywhere

# 1.1.10

-   fix(transport): update encoded_network to ArrayBuffer
-   chore(transport): protobuf patch for ethereum get address

# 1.1.9

chore(transport): update protobufs, update dependencies

# 1.1.8

-   chore(connect;transport): connect.init add transports param; rename transports

# 1.1.7

-   Code cleanup, sharing constants with @trezor/connect

# 1.1.6

-   Dependencies: typescript 4.9

# 1.1.5

-   Removed flowtype generation
-   Added CoinJoinRequest message
-   Cardano: Added support for [CIP36](https://cips.cardano.org/cips/cip36/) Catalyst registration format

# 1.1.4

-   Added cardano types related to [babbage feature](https://github.com/trezor/trezor-suite/commit/efe9c78a2f74a1b7653b3fddf6cca35ba38d3ae9#diff-c1b9d6a93a3b65c45c4dcf06aa86d6c7a84bcc2e14fefdc4a9bdc3d3298c9a5a)

# 1.1.2

-   Added CardanoTxRequiredSigner.key_path': 'optional in protobuf patches

# 1.1.1

-   Changed latest bridge url to https://connect.trezor.io/8/data/bridge/latest.txt'
-   Added trezor-common submodule. Protobuf definitions (messages.json) and protobuf related typescript definitions.

# 1.1.0

-   Added @trezor/utils dependency.

# 1.0.1

-   Fixed: encoding protobuf messages containing numbers over Number.MAX_SAFE_INTEGER in browser environment.

# 1.0.0

-   first release
