# 1.0.16

-   chore: TS project references for build:libs + buildless utxo-lib (#11526) (4d857722fe)
-   chore(repo): mostly buildless monorepo (#11464) (637ad88dcf)

# 1.0.15

-   chore(repo): remove build:lib for some simple packages (#11276) (7febd10cf)
-   chore(suite): autofix newlines (c82455e74)
-   chore: update typescript and use global tsc (84bc9b8bd)
-   chore: use global rimraf (5a6759eff)
-   chore: use global jest (a7e68797d)
-   chore: upgrade jest to 29.7.0 (3c656dc0b)
-   chore: upgrade jest (004938e24)

# 1.0.13

-   fix(connect): point analytics to lib (e5ae31f62b)

# 1.0.11

-   chore(connect): use `tslib` as dependency in all public libs (606ecc63b)

# 1.0.10

-   chore(repo): Upgrade TS 5.3 (#10017) (7277f9d0f)
-   fix(analytics): timestamp from queued events were overriden (96ccc83d6)
-   chore(jest): update jest in packages without issues (7458ab20f)
-   chore(repo): upgrade to TS 5.2 (#9989) (bf8d0fe80)
-   feat(analytics): flush queue based on analytics status (b8b4b413c)
-   feat(analytics): queue can be enabled when analytics object created (c0e3855a8)

# 1.0.7

-   fix(analytics): adding missing fields package.json (8f1626c49)
-   fix(analytics): re-adding missing tsconfig.lib (d3bc367b2)

# 1.0.6

-   chore(analytics): report also analytics event type to sentry to see what we miss (27563c630)
-   chore(analytics): report to sentry also what is missing for analytics to be ready (90484114b)
-   chore: remove some unecessary build:lib (0a5d8267c)

# 1.0.4

-   chore(suite): move env util from suite to trezor package to make it reusable for native (c22aa6c31)
-   feat(analytics): requests outlive the app session (80223eeab)

# 1.0.1

-   fix(suite-native): analytics init (#8225)

# 1.0.0

-   package created
