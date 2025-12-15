# 1.3.0

- chore(protocol): use v2 messageType in `protocol-thp` decode (fae6a1a62f)
- chore(protocol): return `protocol-v2` messageType as number (4c3f7116d0)
- refactor(protocol): use `protocol-v2` constants in `protocol-thp` (27668ed095)
- chore(protocol): validate control byte (magic) in protocol v2 decode (c149719480)
- npm-prerelease: @trezor/protocol 1.3.0-beta.2 (ece7e089e4)
- refactor(protocol): return unmasked magic from readThpHeader (8246ad65a6)
- refactor(connect): new replace-imports.sh script using babel (2128d273f3)
- test(protocol): adjust unit tests (424182b171)
- fix(protocol): don't throw on malformed push notification (d382cbfbe0)
- chore(protocol): export ThpPairingMethod as enum (e61610e32b)
- chore(protocol): distinguish DeviceThpState and ThpChannelState (780e5327f4)
- npm-prerelease: @trezor/protocol 1.3.0-beta.1 (13e1275ffb)
- refactor(protocol): encode ThpAck **only** from ThpState (a43bdb2945)
- refactor(protocol): THP getControlBit returns both ack and sequence bits (10c54bd35d)
- feat(protocol): add ThpState sendAckBit and receiveAckBit (3d948f28ff)
- fix(protobuf): add patch for ThpDeviceProperties.pairing_methods (161406226b)
- feat(protocol): power status change notification (6855b5e74f)
- Revert fix(transport): allow skipping ThpAck from device (37cd1c6ba1)
- npm-prerelease: @trezor/protocol 1.2.11-beta.1 (fd0b9af6a7)
- fix(transport): allow skipping ThpAck from device (118327a6ba)

# 1.2.10

- npm-prerelease: @trezor/protocol 1.2.10-beta.1 (f4d27203cc)
- feat(connect): handle channel replacement in THP pairing (612f40e74d)
- fix(connect): use randomly generated staticKey in first pairing (ca048710ce)
- fix(connect): throw away credentials unaccepted by device (26ebf67f63)
- chore: add `try_to_unlock` to handshake hash (64eeb31575)
- feat(connect): add `tryToUnlock` to `ThpHandshakeInitRequest` (a8aff3e3f8)
- refactor(connect): random thp code polish (bdd7b7bb61)
- chore(protocol): remove unused `ThpInvalidData` error type (b3233240b4)
- chore(protobuf): update protobuf (295afab848)
- feat(protocol): exports for trezor push notification (c2dca4f0bd)
- feat(protocol): trezor-push-notification decode (70f0b76f2e)
- fix(protocol-thp): add error to getExpectedHeaders (37a4375b33)

# 1.2.9

- npm-prerelease: @trezor/protocol 1.2.9-beta.1 (0c08a0b9de)
- fix(protocol): do not reset ThpState.properties (d84fe7ae25)
- fix(protocol): ignore unexpected chunks in ThpAck after send (30e20f7096)
- feat(connect): implement THP passphrase flow (dd0312cf0b)
- feat(connect): cancel `THP` workflow (de01a0302e)
- feat(connect): implement `THP` pairing (1a7e054e21)
- feat(protocol): add `THP` pairing messages and state (2d26b5c928)
- feat(protocol): add `THP` pairing cryptography (f16730bebb)
- chore(protobuf): update ThpPairingRequest message (0c16c5f1fc)
- chore(protobuf): update THP protobuf messages (94267f36aa)
- chore(protobuf): update `THP` MessageType enum (3270d50505)

# 1.2.8

- npm-prerelease: @trezor/protocol 1.2.8-beta.1 (45c2211e42)

# 1.2.7

- npm-prerelease: @trezor/protocol 1.2.7-beta.1 (381415fe44)
- feat(protocol): add `THP` protobuf definitions and types (b5cb747767)
- chore(protocol): rename getChunkHeader to getHeaders and return [header, chunkHeader] (b893516894)
- feat(protocol): add `THP` cryptography (b3056f54d2)
- feat(protocol): add THP encoding/decoding logic (b33b491b40)
- feat(protocol): add credentials to ThpState (c883e604c1)

# 1.2.6

- npm-prerelease: @trezor/protocol 1.2.6-beta.1 (14db93b8d9)
- chore: apply latest prettier (eb758acea9)
- feat(protocol): add `THP` protobuf types and state (5838888e83)

# 1.2.5

- npm-prerelease: @trezor/protocol 1.2.5-beta.1 (fe8f4dc278)

# 1.2.4

- npm-prerelease: @trezor/protocol 1.2.4-beta.2 (5ea9011fdb)
- npm-release: @trezor/connect 9.5.2-beta.1 (#17529) (3d7542843b)
- feat(protocol): add `protocol-v2` (7ff4f19571)

# 1.2.3

- npm-prerelease: @trezor/protocol 1.2.3-beta.1 (71c1cd7ee3)
- fix(repo): fix generate package script (#17300) (a13f269b99)

# 1.2.2

- npm-prerelease: @trezor/protocol 1.2.2-beta.1 (7bfeed7f69)
- chore: remove glboal nx/workspace link scripts (it shall be run only globally) + resolve ugly igonores for devDependencies in import/no-extraneous-dependencies (abb41f8033)

# 1.2.1

- npm-prerelease: @trezor/protocol 1.2.1-beta.1 (52acb3950c)
- feat(protocol): add `name` to TransportProtocol (5bf4c0138e)

# 1.2.0

- npm-prerelease: @trezor/protocol 1.1.1-beta.1 (cdd837ba2b)
- chore: update txs from 4.7.0 to 4.16.2 (59c856fd0f)
- chore(protocol): accept Buffer in decode function (858837bb2a)

# 1.0.10-beta.2

- chore(suite): depcheck enabled (2206f19f2e)

# 1.0.10-beta.1

- chore(protocol): add a logging message in case of empty buffer (c5dd5749a7)

# 1.0.8

- feat(protocol): separate chunking from encoding (2f445ba734)
- feat(protocol): encode/decode messageType as string (ae3211ab6a)
- chore(protocol): rename decode response fields (1db2916fed)

# 1.0.7

- chore: TS project references for build:libs + buildless utxo-lib (#11526) (4d857722fe)
- chore(repo): mostly buildless monorepo (#11464) (637ad88dcf)

# 1.0.6

- fix: from g:tsx to local tsx in prepublish script (d21d698b2)
- chore(repo): remove build:lib for some simple packages (#11276) (7febd10cf)
- chore: use global tsx (c21d81f66)
- chore: update typescript and use global tsc (84bc9b8bd)
- chore: use global rimraf (5a6759eff)
- chore: use global jest (a7e68797d)
- chore: upgrade jest to 29.7.0 (3c656dc0b)
- chore: upgrade jest (004938e24)
- chore: update root dependencies (fac6d99ec)
- chore(repo): config cleanups and improvements (TS, Nx...) (#11096) (acf9a7f19)

# 1.0.4

- chore: remove `bytebuffer` dependency (9b2f9def0)
- chore(connect): use `tslib` as dependency in all public libs (606ecc63b)
- feat(transport): allow custom chunkSize in protocol-v1.encode (ba855c980)
- feat(transport): unify protocol encode/decode functions (b4f08409c)
- tests(protocols): add unit tests for @trezor/protocols package (5073f4921)
- chore(repo): update tsx (53de3e3a8)

# 1.0.3

- chore(repo): Upgrade TS 5.3 (#10017) (7277f9d0f)
- chore(repo): upgrade to TS 5.2 (#9989) (bf8d0fe80)
- feat(deps): update deps without breaking changes (7e0584c51)
- chore(desktop): update deps related to desktop packages (af412cfb5)

# 1.0.1

- chore(protobuf,protocol): missing fields in package.json (27a5e8ab4)

# 1.0.0

- chore(transport): reorganize protocol related logic (cbabe2e2c5)
- chore: introduce protobuf and protocol packages (072042e772)
