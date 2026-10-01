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
returns its supported network symbols, account-detail banners, optional send-form component, and
optional keyed prepared reducer through `SuiteNativeNetworkModule`. The common package builds a
symbol-based module repository and combines the provided reducers dynamically. Modules without state
do not need a reducer. Duplicate network symbols or reducer keys fail during composition; the common
package does not inspect network-specific state or persistence configuration.

```
suite-native/networks/
├── native-common-networks/  → @suite-native/networks
├── network-module-types/    → @suite-native/network-module-suite-native-types
├── network-module-suite-native-sendform-lego-bricks/
│                           → @suite-native/network-module-suite-native-sendform-lego-bricks
├── bitcoin/                 → @suite-native/network-bitcoin
└── solana/                  → @suite-native/network-solana
```

The Bitcoin and Solana modules provide synthetic `getSendForm` capabilities that return their components.
Consumers can retrieve it through `nativeNetworks.getSendForm(networkSymbol)`; networks without
this capability return `undefined`. The forms reuse a layout HOC and a controlled address input from
`@suite-native/network-module-suite-native-sendform-lego-bricks`. Bitcoin owns its sat/vB fee-rate
selector, while Solana owns its priority-fee selector. Fees are fixed examples. Each module owns a
separate Redux slice with its own send-form address,
fee selection, actions, and selectors: `nativeNetworks.bitcoin.sendForm` and
`nativeNetworks.solana.sendForm`. The duplicated state intentionally demonstrates module ownership;
the shared UI package stays stateless. Draft values survive component remounts within the same store
but are not persisted to disk. Solana persists only its existing banner flag. The existing send flow
does not use these synthetic forms yet.
