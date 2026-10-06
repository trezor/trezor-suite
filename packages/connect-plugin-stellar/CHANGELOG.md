# 10.0.0

- npm-prerelease(connect): bump remaining 10.0.0-beta.3 references (81f7711a24)
- npm-prerelease: @trezor/connect-plugin-stellar 10.0.0-beta.3 (0f83bf0b9a)
- npm-prerelease: @trezor/connect-plugin-stellar 10.0.0-beta.2 (f4422a15a6)
- chore(connect): restrict dependency consumers (75150e7345)
- chore(network-stellar): upgrade @stellar/stellar-sdk to v17 (6d84d43bf6)
- chore(connect): bump version to 10.0.0-beta.1 (aaac2abdea)
- chore(connect): publish files as js and ts, not mjs and mts (25f0ed758f)
- chore: bump typescript to 6.0.3 (5d20986f2a)
- chore(stellar): deprecate @trezor/connect-plugin-stellar (a50f862425)
- chore(stellar): remove unused deps (8cf3fe95f6)
- chore(stellar): remove old utils (71c48f05a4)
- chore(scripts): rename libESM to lib (f046a3fd2b)
- chore(scripts): remove cjs support in replace-imports.sh (a1059cd8a3)
- fix: widen prettier tsconfig override to match all tsconfig variants (e3eb2cff8c)
- chore(jest): wire JestCustomEnv into all node-env packages (775a942d1f)
- chore(connect): drop redundant publishConfig.type in ESM packages (af2b73c765)
- chore: tsconfig formatting (8c60ca008d)
- chore(connect): support top-level module type in ESM packages (9aebe9cfb0)
- feat(connect): drop CommonJS output across connect ecosystem (b99609bfb8)
- chore(tests): migrate web packages to @swc/jest (15192f30ee)
- chore: unify package.json publishConfig (216e6de7cc)
- refactor: replace custom eslint script with nx one (ad87eac457)
- chore: add type keyword to all types in imports and exports (47c184a859)
- feat(connect): add .mjs to ESM build (d1bd996295)
- fix: Updated unit tests jest configs (6138839e45)
- chore: remove non-npm badges from package READMEs (4aacb27e0e)
- fix(suite): revert publishable npm packages paths (d71e46eb17)
- chore(suite): bignumber imports, trezor/utils (c40f6ded6b)
- chore: bump @stellar/stellar-sdk (7c50951a5f)
- npm-prerelease: set all @trezor/connect dependencies to 10.0.0-alpha.1 (ab01b2d889)
- feat(scripts): handle libESM in updateProjectReferences (3d71f2c20a)
- build(repository): Connect publishing ESM (a9e189b9a3)
- chore(npm): start publishing source maps (36f6e9692d)

# 10.0.0-beta.1 — DEPRECATED

- This package is deprecated. The 10.x release is a stub.

# 9.2.3

- fix: add depcheck scripts for all the package.json-s (a4f8b09e38)
- npm-prerelease: @trezor/connect-plugin-stellar 9.2.3-beta.1 (dde77a277f)
- fix(connect-plugin-ethereum): put export under publishConfig in package.json (16f0b4f3fa)
- npm-prerelease: @trezor/connect-plugin-stellar 9.2.2-beta.1 (b590564772)

# 9.2.1

- npm-prerelease: @trezor/connect-plugin-stellar 9.2.1-beta.1 (84f5e592e5)
- npm-prerelease: @trezor/connect-plugin-stellar 9.2.0-beta.1 (453ab3b56f)
- feat(blockchain-link): Add basic support for Stellar. (48b5ca0b38)
- npm-prerelease: @trezor/connect-plugin-stellar 9.1.5-beta.1 (313f177fae)
- chore: apply latest prettier (eb758acea9)
- chore(connect-plugin-stellar): update stellar lib (6f901a92bb)
- npm-prerelease: @trezor/connect-plugin-stellar 9.1.4-beta.1 (cf01d74333)
- npm-prerelease: @trezor/connect-plugin-stellar 9.1.3-beta.1 (e32ceb12f7)
- chore: upgrade to TS 5.8 (#17537) (e346ba7f61)
- npm-prerelease: @trezor/connect-plugin-stellar 9.1.2-beta.2 (32759068c1)
- npm-release: @trezor/connect 9.5.2-beta.1 (#17529) (3d7542843b)
- npm-prerelease: @trezor/connect-plugin-stellar 9.1.1-beta.1 (a6aeefd069)
- npm-prerelease: @trezor/connect-plugin-stellar 9.1.0-beta.1 (bf60b4d37a)
- chore(connect-plugin-stellar): update dep (daffb20409)
- npm-prerelease: @trezor/connect-plugin-stellar 9.0.7-beta.2 (49dd380754)
- npm-prerelease: @trezor/connect-plugin-stellar 9.0.7-beta.1 (f80c0281ad)
- fix(connect-plugin-stellar): use exports with require and import (418bd0faa8)
- build(connect-plugin-stellar): build for esm (bd273e8b46)
- chore(packages): autofix for sort-imports eslint rule (b96c899ebb)
- npm-release: connect-plugins (364737a9bb)
- chore: remove glboal nx/workspace link scripts (it shall be run only globally) + resolve ugly igonores for devDependencies in import/no-extraneous-dependencies (abb41f8033)
- chore: fix 'yarn update-project-references' & other fixies (7e4a87de16)
- chore: Upgrade ESLint and all plugis & revalidate the config and ALL of the rules (6b8e9ab6d2)
- chore: enable import/order rule for whole codebase (e22b683733)
- chore(connect-plugin-stellar): update @stellar/stellar-sdk (811b149ee3)
- feat(repo): TS 5.5 (198c91f3c4)
- chore: update stellar sdk (89cf20ef5a)
- fix(connect): fix renamed workflow links (583fbd0fde)
- chore: BigNumber wrapper (d18ba9a879)
- chore: TS project references for build:libs + buildless utxo-lib (#11526) (4d857722fe)
- npm-release: connect-plugin-stellar 9.0.3 (681c1fbfc7)
- chore(repo): mostly buildless monorepo (#11464) (637ad88dcf)
- chore(repo): remove build:lib for some simple packages (#11276) (7febd10cf0)
- chore(suite): autofix newlines (c82455e746)
- feat(connect): add support for StellarClaimClaimableBalanceOp. (51a3e294d3)
- chore: update @stellar/stellar-sdk to v11.2.2 (213043748a)
- chore(repo): ESLint refactor + speed up 70% (#11143) (44fa12a79d)
- chore(connect-plugin-stellar): update stellar libraries (714bbbd40a)
- chore: update various dependencies (no major update) (fecd89f6e8)
- chore: update typescript and use global tsc (84bc9b8bd3)
- chore: use global rimraf (5a6759eff0)
- chore: remove test scripts for packages without tests (01e33b7145)
- chore: use global jest (a7e68797da)
- chore: upgrade jest to 29.7.0 (3c656dc0b2)
- chore: upgrade jest (004938e24b)
- chore(repo): config cleanups and improvements (TS, Nx...) (#11096) (acf9a7f19c)
- chore(connect): use `tslib` as dependency in all public libs (606ecc63b1)
- chore(repo): Upgrade TS 5.3 (#10017) (7277f9d0f8)
- chore(jest): update in connect-plugin-stellar package (3a97cc1c13)
- chore(repo): upgrade to TS 5.2 (#9989) (bf8d0fe80f)
- chore(tests): cleanup jets configs (#9869) (7b68bab051)
- chore(desktop): update deps related to desktop packages (af412cfb5c)

# UNRELEASED

- chore: update @stellar/stellar-sdk to ^13.2.0

# 9.0.3

- chore: update @stellar/stellar-sdk to ^11.2.2

# 9.0.2

- chore: update stellar-base to v10.0.0-beta.3
- chore: update stellar-sdk to v11.0.0-beta.3

# 9.0.1

- updated `stellar-sdk` from `^10.1.0` to `^10.4.0`
- memoId return type https://github.com/trezor/trezor-suite/pull/7395

# 9.0.0

- initial release
- migrated from https://github.com/trezor/connect
