# Network display injection prototype

Product-components accept display data through `NetworkDisplayProvider`. Hosts with
an observable store can instead use `NetworkDisplayStoreProvider`, which reads
selected values through React's `useSyncExternalStore`.

The store contract contains only `getState` and `subscribe`. Redux already satisfies
it, so Suite passes its existing store and selectors directly:

```tsx
<NetworkDisplayStoreProvider
    store={store}
    selectNetworks={selectEnabledNetworks}
    selectNetworkNamesMap={selectNetworkNamesMap}
>
    <NetworkIconSet size={20} gap={8} />
</NetworkDisplayStoreProvider>
```

Selectors belong to the host. Product-components do not import Redux, Suite's state
types, or its selectors. There is no Suite adapter, service factory, or composition
root registration. The generic `useExternalStore` hook can select other domains in
the same way. Selectors must return immutable values with stable references until
those values change; unrelated store updates do not rerender consumers.

A static host such as Connect Explorer supplies a plain object:

```tsx
const bitcoin = asNetworkSymbol('btc');
const ethereum = asNetworkSymbol('eth');
const networkDisplay = {
    networks: [bitcoin, ethereum],
    networkNamesMap: { [bitcoin]: 'Bitcoin', [ethereum]: 'Ethereum' },
};

<NetworkDisplayProvider value={networkDisplay}>
    <NetworkIconSet size={20} gap={8} />
</NetworkDisplayProvider>;
```

Import both providers from `@trezor/product-components/network-display`, and the
optional `NetworkDisplayConfig` type from `/network-display/config`. Import the icon
set from `@trezor/product-components` and `asNetworkSymbol` from
`@trezor/network-module-types`.

The separate network list preserves the host's availability and ordering; the names
map may include disabled networks. Components default to that list. An explicit
`networks` prop overrides it, including disabled networks for protocol searches.
Missing names fall back to symbols.

The static provider also supports server rendering. The store provider currently
targets client-rendered hosts; SSR would need a hydration snapshot contract.

The `NetworkIconSet` story demonstrates the plain-object provider. Suite's
empty-wallet list and global asset search use the Redux store directly. Connect
Explorer's startup and UI are unchanged by this prototype.
