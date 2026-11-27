# Headless composition of network modules

> [!NOTE]
> Builds on [ADR-003](https://github.com/trezor/trezor-suite/pull/34612) and changes none of its
> decisions. ADR-003 allows a headless contract for answers with the same shape for every network,
> and leaves "which operations it contains … to be explored and defined". This ADR defines it.

## Context

Under ADR-003 a feature whose UI differs per network is the module's component, and its logic stays
headless in `-suite-common`. Several callers need answers from that logic without rendering a
screen, and have no contract for them today:

- **Suite-owned flows.** Trading, Earn and RBF compose, sign and broadcast transactions; thunks and
  WalletConnect sign messages. Each adds its own switch over the network, such as
  `isVerifySupported`, or its own copy of the device request.
- **Answers that depend on configuration.** Block subscription or polling, the source of fees,
  Blockaid or ERC-7730 coverage: these depend on the backend, remote metadata or a probe at run
  time. On `develop` they are `networkType` checks ([`shouldSubscribeBlocks`][subscribe-blocks]) or
  values per symbol, and fees refresh on one 60-second timer for every network.
- **A list of what a network supports,** per context, for support levels and chains added over
  their own RPC.
- **Modules without Suite bindings,** written by someone who does not write React.

## Decision

The key words MUST, MUST NOT, SHOULD and MAY are to be read as in
[RFC 2119](https://www.rfc-editor.org/rfc/rfc2119). **Shared code** is code outside a family's
packages: Suite features, pages, thunks, services and WalletConnect. The **headless API** is a
family's functions and properties that shared code uses, in
`@trezor/network-module-suite-common-types`.

1. A function or property that shared code uses MUST be part of the headless API. Shared code MUST
   use it and MUST NOT rebuild it. A function only the family's components call MAY stay internal
   until shared code needs it.
2. A headless function MUST have the same shape for every network. It takes what every caller can
   supply and applies the family's defaults for the rest; family-specific parameters stay in the
   family's own API and components.
3. The headless API MUST NOT describe UI. It returns results: a fee estimate, a transaction, an
   error. A value a family hands out and gets back, such as a chosen fee, MUST be opaque to shared
   code.
4. Inputs and outputs MUST be serializable. Expected failures SHOULD be returned, not thrown.
5. The headless API MUST be resolved for a context, as ADR-003 resolves features. The module reads
   its backend and remote metadata itself.
6. Each function and property MUST be reported as supported, unsupported, or unknown while a probe
   is pending. Remote configuration MAY disable what the release ships; executable code MUST ship
   in the release.
7. The module MUST state how its data can be followed: subscription or polling, and the shortest
   useful interval. Shared code MAY pause or slow fetching for app reasons.
8. The headless API MUST NOT read app state or import React. App-owned services, such as Trezor
   Connect, analytics and notifications, MUST be injected.
9. A module MAY ship only its headless package, with no React or `@suite*` imports, and Suite MUST
   be able to register it. It gets the lego default of a feature that needs nothing beyond the
   headless API; a feature that needs network-specific UI stays absent until the family has a
   component.
10. A family's components MUST call the same headless functions for anything shared code can also
    do, so a screen and a thunk sign through one path.
11. Shared code MUST NOT choose behavior by comparing a network's identity (`networkType`, symbol,
    chain id) to a literal. It MAY use identity as an opaque key, for caches, settings, analytics,
    URLs and assets.
12. Each built-in network's supported functions in its default configuration MUST be covered by a
    snapshot test.

## Examples

The headless API, with illustrative names:

```ts
type Availability = 'supported' | 'unsupported' | 'unknown';

type SuiteCommonNetworkModule = {
    getSupportedNetworks(): readonly NetworkSymbol[];
    getNetworkApi(context: NetworkContext): NetworkApi; // the module reads its backend
};

type NetworkApi = {
    dataPolicy: { follow: 'subscription' | 'poll'; minIntervalMs: number };
    estimateFee?(params: EstimateFeeParams): Promise<Result<FeeEstimate, NetworkError>>;
    composeTransaction?(params: ComposeParams): Promise<Result<ComposedTx, NetworkError>>;
    signTransaction?(params: SignTxParams): Promise<Result<SignedTx, NetworkError>>;
    pushTransaction?(params: PushTxParams): Promise<Result<TxId, NetworkError>>;
    signMessage?(params: SignMessageParams): Promise<Result<SignedMessage, NetworkError>>;
    simulation: Availability; // probed once per chain
    walletConnect?: WalletConnectHandler;
};

type FeeEstimate = { amount: Amount; choice: FeeChoice }; // FeeChoice is opaque
```

**Fees.** Send, Trading and Earn call one function, and the refresh follows the module. A thunk
would call the same function.

```ts
const api = getNetworkApi({ symbol, account });
queryOptions({
    queryKey: ['fee', symbol, account.key, priority], // identity as an opaque key
    queryFn: () => api.estimateFee!({ account, outputs, priority }),
    refetchInterval: api.dataPolicy.follow === 'poll' ? api.dataPolicy.minIntervalMs : false,
});
```

**Trading and Earn.** Suite owns the flow; the network answers. Fee selection, whose UI differs per
network, is the module's feature, rendered by the page.

```tsx
const FeeSelection = suiteModule.getFeeSelection?.(account)?.Component ?? DefaultFeePriority;
const composed = await api.composeTransaction?.({ account, outputs, fee: selected.choice });
// Earn: a yield provider returns the unsigned transaction instead
if (api.simulation === 'supported') showSimulation(await simulate(composed.value));
const signed = await api.signTransaction?.({ device, account, transaction: composed.value });
await api.pushTransaction?.({ account, transaction: signed.value });
```

**WalletConnect.** The family translates the dapp's requests in its headless package.

```ts
const handler = api.walletConnect;
if (!handler?.methods.includes(request.method)) return reject(request, 'unsupported method');
const result = await handler.handleRequest({ device, account, request });
```

**Message signing.** The family's Sign & Verify component uses the family's own API, such as
Bitcoin's `format: 'electrum'`. A thunk or WalletConnect calls `signMessage`, which applies the
family's default. Both end in the same family function.

**A module with no Suite bindings.** An external contributor ships only the headless package; Suite
registers it with lego defaults, so Receive and Send appear.

```ts
// networks/acme/network-acme-suite-common: no React, no @suite* imports
export const acmeModule = defineSuiteCommonNetworkModule({
    getSupportedNetworks: () => ['acme'],
    getNetworkApi: () => ({
        dataPolicy: { follow: 'poll', minIntervalMs: 15_000 },
        estimateFee: params => estimateAcmeFee(deps, params),
        composeTransaction: params => composeAcmeTransaction(deps, params),
        signTransaction: params => deps.getTrezorConnect().acmeSignTransaction(params),
        pushTransaction: params => pushAcmeTransaction(deps, params),
        simulation: 'unsupported',
    }),
});
```

This ADR does not decide which functions exist beyond those shared code uses, how Suite caches
remote data, or whether external developers may write Suite UI.

## Rejected alternatives

- **Leaving the headless API undefined:** each family's logic stays shaped per family, so Trading,
  Earn, thunks and WalletConnect keep a switch over families.
- **An engine API:** networks describe their screens as data and one shared UI interprets them. The
  engine grows with every network's differences; ADR-003 rejects it for the same reason.
- **Networks that return no UI at all:** every feature would go through one shared screen per
  feature, bent with conditions where a network's flow differs. Network-specific UI stays the
  family's component.

## Consequences

- **Easier:** Trading, Earn, RBF, thunks, WalletConnect and tests call one function per action. A
  network's supported functions can be listed and tested per context. Remote metadata or a probe
  changes availability without a release. An external module can start headless-only.
- **Harder:** a function shared code uses needs one shape for every network first. Network-specific
  UI still needs a component per family and platform.
- **Migration is per feature:** a family can ship its components first and move a function into the
  headless API when shared code needs it.
- **Revisit when** a headless function keeps needing family-specific parameters: that part is UI and
  belongs in a component.

[subscribe-blocks]: https://github.com/trezor/trezor-suite/blob/bd3630cfba27da8033d77ebb6a808f3784b41d74/suite-common/wallet-utils/src/backendUtils.ts#L79
