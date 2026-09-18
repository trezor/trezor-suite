# Network display services prototype

`NetworkDisplayServices` is the boundary between product-components and their host.
It imports only the shared network symbol type. It has no Redux or Suite dependency.

The host constructs a service once and injects it through `NetworkDisplayProvider`.
`NetworkIconSet` and the network dropdown in `SearchAsset` read from that service.
They no longer need a names map or the host's enabled-network list as props.

```tsx
const services = createStaticNetworkDisplayServices({
    networks: [
        { symbol: asNetworkSymbol('btc'), name: 'Bitcoin' },
        { symbol: asNetworkSymbol('eth'), name: 'Ethereum' },
    ],
});

<NetworkDisplayProvider services={services}>
    <NetworkIconSet size={20} gap={8} />
</NetworkDisplayProvider>;
```

The public entry points are `@trezor/product-components/network-display` for the
provider and hook, `/network-display/services` for the contracts, and
`/network-display/static` for the static implementation. Import the icon set from
`@trezor/product-components` and `asNetworkSymbol` from `@trezor/network-module-types`.

Suite constructs `createSuiteNetworkDisplayServices` in its composition root.
That adapter uses memoized selectors for enabled networks and display names, with
Redux's subscription mechanism. Product-components consume its snapshots through
`useSyncExternalStore`; neither Redux nor the application state crosses the boundary.

`getNetworks()` uses the host's available networks. An explicit symbol list overrides
that selection and preserves its order, including networks that are not enabled.
This supports protocol-specific searches. Missing names fall back to the symbol.

Creating a source must not subscribe or acquire resources. `subscribe` owns listener
registration and returns its cleanup function. Snapshots must be immutable and keep
their identity until the selected data changes. Server-rendered hosts must supply
`getServerSnapshot` with a snapshot consistent with initial client hydration; the
static implementation already does so. Suite's current adapter is client-only.

The `NetworkIconSet` story demonstrates the static implementation. The empty-wallet
network list and global asset search demonstrate the same components backed by Suite.
