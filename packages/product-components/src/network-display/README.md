# Network config store prototype

`NetworkDisplayProvider` injects the `NetworkConfigStore` contract from
`@trezor/network-module-types`:

```ts
type NetworkConfigStore = {
    getState: () => {
        networks: Readonly<Record<NetworkSymbol, { readonly name: string }>> | null;
    };
    subscribe: (onChange: () => void) => () => void;
};
```

Consumers use pure selectors with a generic `useNetworkDisplaySelector` hook:

```tsx
import { selectNetworkOptions, useNetworkDisplaySelector } from '@trezor/product-components';

const networks = useNetworkDisplaySelector(selectNetworkOptions);
const filteredNetworks = useNetworkDisplaySelector(state => selectNetworkOptions(state, symbols));
```

The hook uses `useSyncExternalStore` directly and subscribes to the selected value.
There are no hooks for individual queries. `selectNetworkOptions` uses Reselect to
keep the result stable when unrelated state changes. These same selectors work with
React Redux's `useSelector`; the hook above reads the injected network store instead
of requiring a Redux provider.

Suite's Redux store already satisfies the contract. `Main` obtains it from services:

```tsx
const { store } = useServices(injectStore);

<NetworkDisplayProvider store={store}>{children}</NetworkDisplayProvider>;
```

Product-components import neither Redux nor Suite's state or selectors. The provider
only takes the store; selectors belong at consumer call sites.

Connect Explorer calls `createConnectExplorerNetworkDisplayStore` from its composition
root to build a fixed config map from its existing coin definitions. This store contains
only that map and a no-op subscription. `createConnectExplorerApp` wraps the app in the
same provider, and `ConnectInitForm` selects its network names through it.

```tsx
const state = { networks: { [asNetworkSymbol('btc')]: { name: 'Bitcoin' } } };
const store: NetworkConfigStore = {
    getState: () => state,
    subscribe: () => () => {},
};

<NetworkDisplayProvider store={store}>{children}</NetworkDisplayProvider>;
```

Import `NetworkConfig`, `NetworkConfigState`, and `NetworkConfigStore` from
`@trezor/network-module-types`. These contracts contain no React or Redux dependencies.
Import the provider, hook, selectors, and UI-specific `NetworkOption` type from
`@trezor/product-components`.
The store supplies configuration, not user preferences. By default the options
selector uses all config keys. Suite passes its enabled-network list to individual
components; protocol searches can override it. Explicit lists retain their order,
and missing configs fall back to the symbol.

Snapshots and selector results must be immutable and retain their references until
selected data changes. Memoize selectors that return arrays or objects. Server
rendering uses the same snapshot getter; server and initial client configs must agree.
Explorer's fixed config store satisfies this for Next's static rendering.
