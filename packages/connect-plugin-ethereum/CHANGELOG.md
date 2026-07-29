# 10.0.0-beta.1 — DEPRECATED

This package is deprecated. EIP-712 hash construction has been inlined into `@trezor/connect@10`; callers should pass the `data` object directly to `TrezorConnect.ethereumSignTypedData` and the hashes are computed internally when the device requires them (T1B1 firmware).

The 10.x release is a stub: `transformTypedData` throws a deprecation error pointing at the migration in [PR #27091](https://github.com/trezor/trezor-suite/pull/27091). The implementation now lives in `packages/connect/src/api/ethereum/ethereumSignTypedData.ts`, where it is used internally by the lazy-loaded ethereum module, and is powered by `viem` instead of `@metamask/eth-sig-util` — byte-identical output, no Buffer polyfills, no React Native compatibility issues.

Migration:

- Upgrade `@trezor/connect` to 10.x.
- Stop calling `transformTypedData`. Remove `domain_separator_hash` and `message_hash` from your `ethereumSignTypedData` call.
- Remove `@trezor/connect-plugin-ethereum` from your `dependencies`.

If you stay on `@trezor/connect@9`, keep this package pinned to the 9.x line.

# 9.1.3

- fix: add depcheck scripts for all the package.json-s (a4f8b09e38)
- npm-prerelease: @trezor/connect-plugin-ethereum 9.1.3-beta.1 (4c6d0b9317)
- fix(connect-plugin-ethereum): put export under publishConfig in package.json (16f0b4f3fa)
- npm-prerelease: @trezor/connect-plugin-ethereum 9.1.2-beta.1 (a71f26bdda)
- chore: apply latest prettier (eb758acea9)
- npm-prerelease: @trezor/connect-plugin-ethereum 9.1.1-beta.1 (7184054403)
- chore: upgrade to TS 5.8 (#17537) (e346ba7f61)
- npm-prerelease: @trezor/connect-plugin-ethereum 9.1.0-beta.1 (479ec1e224)
- chore(connect-plugin-ethereum): use target from root tsconfig.lib (d52b30b6f8)
- chore(connect-plugin-ethereum): update dep (91da7e7e9f)
- npm-prerelease: @trezor/connect-plugin-ethereum 9.0.6-beta.2 (4b60cc57e9)
- npm-prerelease: @trezor/connect-plugin-ethereum 9.0.6-beta.1 (5f3a436afd)
- fix(connect-plugin-ethereum): use exports with require and import (a63170491f)
- build(connect-plugin-ethereum): build for esm (df71b6d99d)
- npm-release: connect-plugins (364737a9bb)
- chore: remove glboal nx/workspace link scripts (it shall be run only globally) + resolve ugly igonores for devDependencies in import/no-extraneous-dependencies (abb41f8033)
- chore: Upgrade ESLint and all plugis & revalidate the config and ALL of the rules (6b8e9ab6d2)
- chore(connect-plugin-ethereum): update @metamask/eth-sig-uti (8b922dabb5)
- chore: update trends libs (70b9c112bf)
- fix(connect): fix renamed workflow links (583fbd0fde)
- chore: TS project references for build:libs + buildless utxo-lib (#11526) (4d857722fe)
- chore(repo): mostly buildless monorepo (#11464) (637ad88dcf)
- chore(suite): autofix newlines (c82455e746)
- chore(repo): ESLint refactor + speed up 70% (#11143) (44fa12a79d)
- chore: update typescript and use global tsc (84bc9b8bd3)
- chore: use global rimraf (5a6759eff0)
- chore: remove test scripts for packages without tests (01e33b7145)
- chore: use global jest (a7e68797da)
- chore: upgrade jest to 29.7.0 (3c656dc0b2)
- chore: upgrade jest (004938e24b)
- chore(repo): config cleanups and improvements (TS, Nx...) (#11096) (acf9a7f19c)
- npm-release(connect-plugin-ethereum): 9.0.3 (64af57f10f)
- chore(connect-plugin-ethereum): update changelog (e3e4c163e7)
- chore(connect): publish config experiment (5608039465)
- deps(connect-plugin-ethereum): @metamask/eth-sig-util@^7.0.0->^7.0.1 (e24c80afa0)
- chore(connect): use `tslib` as dependency in all public libs (606ecc63b1)
- chore(repo): Upgrade TS 5.3 (#10017) (7277f9d0f8)
- chore(jest): update in connect-plugin-ethereum package (f74d78a634)
- chore(repo): upgrade to TS 5.2 (#9989) (bf8d0fe80f)
- chore(tests): cleanup jets configs (#9869) (7b68bab051)
- feat(deps): update deps without breaking changes (7e0584c511)
- chore(desktop): update deps related to desktop packages (af412cfb5c)
- npm-release: connect-plugin-ethereum 9.0.2 (367c02c308)
- chore(connect-plugin-ethereum): update @metamask/eth-sig-util to v6 (db702eaeb7)
- chore(connect-\*): change model to internal model (8edb0a59d5)
- chore: remove some unecessary build:lib (0a5d8267c4)
- chore: forgotten renaming to T1/TT (5decd0839b)
- chore: unify trezor names in docs/comments (74290aab3a)
- feat(connect-plugin-ethereum): update @metamask/eth-sig-util lib (0db8fadb57)
- feat: update deps in root package.json (5806d41bc5)
- chore: update deps (97fd16bb10)
- feat(desktop): update deps (79d702d59e)
- feat: update typescript (151f364d78)
- release: connect-plugin-ethereum 9.0.1 (5044a072d8)
- feat(connect-plugin-x): update stellar and metamask libs (753b778f74)
- chore: Upgrade to TS 4.9 (#6932) (b23f7b7bfa)
- npm-release: connect-plugins (308688e2a9)
- chore(ci): Nx for github validations (#6095) (a446583d58)
- chore: upgrade to yarn 3 (#6061) (39c0ed80ed)
- chore(lint): enforce usage of @ts-expect-error (50ce258b0f)
- chore: separate suite native to its own packges folder (#5685) (1cd4f5d7bf)
- feat: prepare connect-plugin-ethereum for release (c0eeb4afce)
- fix: update public packages homepage (deb62e4b03)
- chore(connect): update connect readmes (ff615db16d)
- fix(connect-web): remove comments from tsconfig (9780cb816c)
- feat(connect-plugin-ethereum): create package (8e86282487)

# UNRELEASED

- updated `@metamask/eth-sig-util` from `^7.0.1` to `^8.2.0`

# 9.0.3

- updated `@metamask/eth-sig-util` from `^6.0.0` to `^7.0.1`

# 9.0.2

- updated `@metamask/eth-sig-util` from `^5.0.2` to `^6.0.0`

# 9.0.1

- updated `@metamask/eth-sig-util` from `^4.0.1` to `^5.0.2`

# 9.0.0

- initial release
- migrated from https://github.com/trezor/connect
