# Suite Native networks

Native network packages own platform-specific UI, Redux state, and other behavior for one network
family. Each network is a private workspace package under `suite-native/networks/<network>` and may
depend on shared `@suite-native/*` packages.

`@suite-native/network-module-suite-native-types` defines the contract implemented by native network
packages. `@suite-native/networks` is the only package that registers those concrete packages.
It creates them through `createNativeModulesCompositionRoot`, composes their Redux state into one
reducer, and exposes their capabilities as generic native network services. Consumers depend on this
common interface and never import or branch on a specific network package.

Each network package returns its supported network symbols, account-detail banners, optional send
module, and optional keyed prepared reducer through `SuiteNativeNetworkModule`. The common package
builds a symbol-based module repository and combines the provided reducers dynamically. Modules
without state do not need a reducer. Duplicate network symbols or reducer keys fail during
composition; the common package does not inspect network-specific state or persistence configuration.

```
suite-native/networks/
├── native-common-networks/  → @suite-native/networks
├── network-module-types/    → @suite-native/network-module-suite-native-types
├── network-module-suite-native-sendform-lego-bricks/
│                           → @suite-native/network-module-suite-native-sendform-lego-bricks
├── bitcoin/                 → @suite-native/network-bitcoin
├── ripple/                  → @suite-native/network-ripple
└── solana/                  → @suite-native/network-solana
```

## Send form

The send form is split into four roles so that a network is written once and each platform only
supplies what is platform-specific:

1. **Declaration** (`networks/<network>/network-<network>-suite-common`, `<network>NetworkConfiguration`):
   the network's send interface as data. Which extra fields exist (`memo`, `destinationTag`, ...)
   with their validation rule, and the fee model (unit, whether levels are selectable). It depends on
   `@trezor/*` only and is declared `as const satisfies NetworkConfiguration`, so the field ids stay
   literal types.
2. **Strategy** (`create<Network>SendStrategy` in the same package): the platform-independent
   behaviour, here the fee levels. It never imports React or Redux and gets Connect through
   dependency injection in a real implementation; the showcase returns fixed example levels.
3. **Implementation** (`suite-native/networks/<network>`): one component per declared field and a fee
   selector when the fee model is selectable, passed to `createNativeNetworkSendModule` together
   with the strategy. `NetworkConfigurationImplementation` derives the required shape from the
   declaration: a missing field component, an extra one, or a fee selector for a fixed fee is a
   compile error. Components receive values and callbacks as props and own no state; copy lives in
   them, since `networks/` cannot own translations.
4. **Composition** (`@suite-native/networks`): the generic `NetworkSendForm` renders the layout,
   the address input, the declared fields and the fee selector for any network, keeps the draft in
   the generic `sendForm` slice keyed by network symbol, validates fields with `validateSendField`
   from the declaration, and resolves the module through `nativeNetworks.getSend(networkSymbol)`.
   Networks without a send module render only the layout.

Adding a network therefore means: declare its fields and fee model next to its strategy, implement
the declared slots in its native package, and register the module in
`createNativeModulesCompositionRoot`. Ripple shows the minimal case: one declaration, one field
component, no fee selector, no reducer.

The forms stay synthetic: fee levels are fixed examples, nothing is composed or signed, drafts are
not persisted to disk, and the existing send flow does not mount `NetworkSendForm` yet.
