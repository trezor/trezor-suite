# 10.0.0

- npm-prerelease: @trezor/websocket-client 10.0.0-beta.3 (18941d1654)
- npm-prerelease: @trezor/websocket-client 10.0.0-beta.2 (38e1657c8b)
- chore(build): centralize library test exclusions (51989aff9c)
- chore(connect): bump version to 10.0.0-beta.1 (aaac2abdea)
- test(websocket-client): co-locate client test (13a618030e)
- chore(connect): publish files as js and ts, not mjs and mts (25f0ed758f)
- fix: bump @types/jest to 30 for TS7 compatibility (d782d3d606)
- chore: bump typescript to 6.0.3 (5d20986f2a)
- fix(e2e): Fixed Jest not exiting properly (0813dc1cb2)
- chore(scripts): rename libESM to lib (f046a3fd2b)
- chore(scripts): remove cjs support in replace-imports.sh (a1059cd8a3)
- chore(jest): wire JestCustomEnv into all node-env packages (775a942d1f)
- chore(connect): drop redundant publishConfig.type in ESM packages (af2b73c765)
- chore: tsconfig formatting (8c60ca008d)
- chore(connect): support top-level module type in ESM packages (9aebe9cfb0)
- feat(connect): drop CommonJS output across connect ecosystem (b99609bfb8)
- chore: use type imports (b4caf7f0ac)
- build: ignore `.browser.` files for commonjs (550d6d4976)
- refactor: rename `*-browser.*` files to `.browser.` (dc37779925)
- fix(blockchain-link): use subscription id safely (57b864a5be)
- feat(blockchain-link): add concurrency to blockbook websocket (b431601511)
- chore(deps): bump @types/chrome, @types/sharedworker, @types/web (3e952cd6fd)
- chore(tests): migrate web packages to @swc/jest (15192f30ee)
- chore(deps): update ws, cbor, long, ts-mixer, @types/w3c-web-usb, postcss-lightningcss (ffae1b63fa)
- chore: switch public client-side packages to MIT license (7b03152f66)
- chore: remove npmPublishAccess fields from package.json (743d2836de)
- chore: unify package.json publishConfig (216e6de7cc)
- chore: fix publishConfig in transport and websocket-client (4e56abc4a6)
- refactor: replace custom eslint script with nx one (ad87eac457)
- feat(connect): add .mjs to ESM build (d1bd996295)
- chore(websocket-client): lib ESM build (e8bb028beb)
- chore: remove unused `prepublishOnly` script (0056cb62fa)
- fix: Updated unit tests jest configs (6138839e45)
- chore: remove non-npm badges from package READMEs (4aacb27e0e)
- chore: bump tsx version (98321960e2)
- npm-prerelease: set all @trezor/connect dependencies to 10.0.0-alpha.1 (ab01b2d889)
- chore(npm): remove prepublish.js (7559f035c3)
- chore(npm): start publishing source maps (36f6e9692d)

# 1.3.0

- npm-prerelease: @trezor/websocket-client 1.2.5-beta.2 (5ec3213e06)
- refactor(connect): new replace-imports.sh script using babel (2128d273f3)
- npm-prerelease: @trezor/websocket-client 1.2.5-beta.1 (4943bc22e6)

# 1.2.4

- npm-prerelease: @trezor/websocket-client 1.2.4-beta.1 (bdf6f0860f)

# 1.2.3

- fix: add missin @types/ws (7b89dc607b)
- fix: add TON of missing dependecies in package.json (7027213e3f)
- npm-prerelease: @trezor/websocket-client 1.2.3-beta.1 (a96fea80e1)
- feat(websocket-client): configurable sendMessage timeout handler (c23ff42f9c)

# 1.2.2

- npm-prerelease: @trezor/websocket-client 1.2.2-beta.2 (86961cbbff)
- npm-prerelease: @trezor/websocket-client 1.2.2-beta.1 (15471d1c68)

# 1.2.1

- npm-prerelease: @trezor/websocket-client 1.2.1-beta.1 (3939fd1ac7)

# 1.1.5

- npm-prerelease: @trezor/websocket-client 1.1.5-beta.1 (dd1d949795)
- chore: apply latest prettier (eb758acea9)
- feat(websocket-client): autospoof Origin header in node.js (b8c2f2ffcc)

# 1.1.4

- npm-prerelease: @trezor/websocket-client 1.1.4-beta.1 (9679ef8a27)
- fix(websocket-client): get rid of problematic timeout error emit (b8016dfb2e)
- feat(websocket-client): differentiable error type (4f1b2b73eb)
- test(websocket-client): use WebsocketClient class directly (9731de127c)
- fix(websocket-client): test:unit command using yarn g:jest (fb0052142d)
- chore(websocket-client): change messages field from public to protected (ec3c215b4a)
- feat(websocket-client): sendMessage is now public; support timeout param (b0740c419e)
- chore(websocket-client): class is no longer abstract (931c8d2985)
- chore(websocket-client): createWebsocket class member is not abstract anymore (fd93bf9f20)

# 1.1.3

- npm-prerelease: @trezor/websocket-client 1.1.3-beta.1 (d00ffd0eb1)

# 1.1.2

- npm-prerelease: @trezor/websocket-client 1.1.2-beta.1 (12e0970720)

# 1.1.1

- npm-prerelease: @trezor/websocket-client 1.1.1-beta.1 (de857de4c4)
- fix(repo): fix generate package script (#17300) (a13f269b99)

# 1.1.0

- npm-prerelease: @trezor/websocket-client 1.1.0-beta.1 (5e06767bf0)
- npm-prerelease: @trezor/websocket-client 1.0.1-beta.1 (3a23e6a239)
- chore(websocket-client): add missing tsx devDependency (25451313e1)
- feat: create `@trezor/websocket-client` package (1fa2305fde)
