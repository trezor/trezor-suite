# Network config store prototype

`NetworkDisplayProvider` reads network configs from a small external-store contract:

```ts
type NetworkDisplayStore = {
    getState: () => {
        networks: Readonly<Record<NetworkSymbol, { readonly name: string }>> | null;
    };
    subscribe: (onChange: () => void) => () => void;
};
```

Suite's Redux store already satisfies this contract. `Main` obtains it from services:

```tsx
const { store } = useServices(injectStore);

<NetworkDisplayProvider store={store}>{children}</NetworkDisplayProvider>;
```

Product-components import neither Redux nor Suite's state or selectors. The provider
uses `useSyncExternalStore` directly to observe `store.getState().networks`. Other
state changes keep the same config snapshot and do not rerender its consumers.

Connect Explorer builds a fixed config map from its existing coin definitions in
`createConnectExplorerCompositionRoot`. Its separate display store contains only
that map and a no-op subscription. `createConnectExplorerApp` wraps the app in the
same provider, and `ConnectInitForm` reads its network names through `useNetworkOptions`.
It does not use Explorer's Redux state for network configs.

```tsx
const state = { networks: { [asNetworkSymbol('btc')]: { name: 'Bitcoin' } } };
const store: NetworkDisplayStore = {
    getState: () => state,
    subscribe: () => () => {},
};

<NetworkDisplayProvider store={store}>{children}</NetworkDisplayProvider>;
```

Import the provider and hook from `@trezor/product-components/network-display` and
store/config types from `@trezor/product-components/network-display/config`.

The store supplies configuration, not user preferences. By default components use
all keys of the config map. Suite passes its enabled-network list to individual
components; protocol searches can override it. Explicit lists retain their order,
and missing configs fall back to the symbol.

Store snapshots must be immutable and retain their reference until configs change.
Server rendering uses the same snapshot getter; server and initial client configs
must agree. Explorer's fixed config store satisfies this for Next's static rendering.
