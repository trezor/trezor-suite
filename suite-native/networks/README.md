# Suite Native networks

Native network packages own platform-specific UI, Redux state, and other behavior for one network
family. Each network is a private workspace package under `suite-native/networks/<network>` and may
depend on shared `@suite-native/*` packages.

`@suite-native/network-module-suite-native-types` defines the contract implemented by native network
packages. `@suite-native/networks` is the only package that registers those concrete packages.
It creates them through `createNativeModulesCompositionRoot`, composes their Redux state into one
reducer, and exposes their capabilities as generic native network services. Consumers depend on this
common interface and never import or branch on a specific network package.

Each network package owns its complete reducer setup, including persistence and migrations, and
returns its supported network symbols, account-detail banners, and keyed prepared reducer through
`SuiteNativeNetworkModule`. The common package builds a symbol-based module repository and combines
the reducers dynamically. Duplicate network symbols or reducer keys fail during composition; the
common package does not inspect network-specific state or persistence configuration.

```
suite-native/networks/
├── native-common-networks/ → @suite-native/networks
├── network-module-types/   → @suite-native/network-module-suite-native-types
└── solana/                  → @suite-native/network-solana
```
