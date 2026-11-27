# Headless composition of network modules

> [!NOTE]
> Builds on [ADR-003](https://github.com/trezor/trezor-suite/pull/34612) and changes none of its
> decisions. ADR-003 allows headless contracts for answers that have the same shape for every
> network, and leaves "which operations it contains … to be explored and defined". This ADR defines
> that API, and how Suite features and network components compose them.

## Context

ADR-003 decides that a feature whose UI differs per network is a component from the network module,
that a module's logic stays headless in its `-suite-common` package, that features are resolved for
a context, and that backends stay inside the module. It also allows a headless API where "Suite only
needs an answer from each network", in `@trezor/network-module-suite-common-types`, without saying
what it holds.

Several callers need those answers today and have no contract to get them from:

- **Suite-owned flows.** Trading, Earn and RBF compose, sign and broadcast transactions. Thunks and
  WalletConnect sign messages. They render no network screen, so a component gives them nothing to
  call, and each adds its own switch over the network, such as `isVerifySupported`, or its own copy
  of the device request.
- **Answers that depend on configuration.** Whether a network follows new blocks or is polled, which
  source serves its fees, whether Blockaid simulation or ERC-7730 clear signing cover it: these
  depend on the backend, remote network metadata or a probe at run time. On `develop` they are
  `networkType` checks in shared code ([`shouldSubscribeBlocks`][subscribe-blocks]) or values per
  symbol, and fees are refetched on one 60-second timer for every network.
- **A list of what a network supports.** Supporting networks at different levels, or chains added
  from a chain list over their own RPC, needs each network's supported functions per context, not
  only whether a page renders.
- **Modules without Suite bindings.** A network module can be written by someone who does not write
  React, or for a host that is not Suite. Such a module needs to work with only its headless
  package.

## Decision

The key words MUST, MUST NOT, SHOULD, SHOULD NOT and MAY are to be read as in
[RFC 2119](https://www.rfc-editor.org/rfc/rfc2119). A **family** is a group of networks sharing a
protocol model, served by one network module. **Shared code** is code outside a family's packages:
Suite features, pages, thunks, services and WalletConnect. The **headless API** is what ADR-003
calls a headless contract: a family's functions and properties, resolved for a context.

### Headless API

1. A function or property that shared code uses MUST be part of the family's headless API, in the
   Suite Common contract (`@trezor/network-module-suite-common-types`), usable without rendering
   UI. Shared code MUST use it and MUST NOT rebuild it.
2. A function that only the family's own components call MAY stay internal to the family. It joins
   the headless API when shared code needs it.
3. A headless function MUST have the same shape for every network. It takes only what every caller
   can supply and applies the family's defaults for the rest. Family-specific parameters belong to
   the family's own typed API, which its components use.
4. The headless API MUST NOT describe UI: no layout, field schemas, control labels or flags that
   tell a screen what to show. It returns results, such as a fee estimate, a composed or signed
   transaction, or an error.
5. A value that a family hands out and gets back, such as a chosen fee, MUST be opaque to shared
   code. Shared code passes it back unread.
6. Inputs and outputs MUST be serializable data. Expected failures SHOULD be returned as results
   rather than thrown.

### Context and availability

7. The headless API MUST be resolved for a context, as ADR-003 resolves features: the network and, where
   relevant, the account. The module reads its backend and remote metadata itself; shared code MUST
   NOT pass a backend.
8. Each function and property MUST be reported as supported, unsupported, or unknown while a probe
   is pending. Remote configuration MAY disable one that the release ships. Executable network code MUST
   ship in the release; data such as metadata and signed definitions MAY be fetched at run time.
9. The module MUST state how its data can be followed, by subscription or by polling, and the
   shortest useful interval. Shared code MAY pause or slow fetching for app reasons, such as a
   hidden window, but MUST NOT decide the method from the symbol or network type.

### Dependencies

10. The headless API MUST NOT read app state or import React. Anything the app owns, such as
    Trezor Connect, analytics and notifications, MUST reach them through injected dependencies.
11. A module MAY consist of its headless package only, with no React and no `@suite*` imports.
    Suite MUST be able to register such a module. Its features then appear where a lego default
    implementation needs nothing beyond the headless API; a feature that needs network-specific
    UI stays absent until the family has a component for it.

### Composition

12. A Suite-owned flow MUST get network answers through the headless API. Where part of its UI
    differs per network, such as fee selection, the flow MAY render that part as a feature of the
    network module, as ADR-003 pages do.
13. A family's components MUST call the same headless functions for anything shared code can also
    do, so a screen and a thunk sign through one path.
14. Shared code MUST NOT choose behavior by comparing a network's identity (`networkType`, symbol,
    chain id) to a literal. It MAY use identity as an opaque key for caches, settings, analytics,
    URLs and assets. A lint rule with a baseline that only shrinks enforces this for new and
    migrated code.
15. Each built-in network's supported functions in its default configuration MUST be covered by a
    snapshot test. Moving a feature onto the headless API MUST keep the support it had before.

## Examples

The names are illustrative. The contract below is the Suite Common counterpart of ADR-003's
`SuiteNetworkModule`.

```ts
// @trezor/network-module-suite-common-types
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
    simulation: Availability; // probed once per chain, unknown until then
    walletConnect?: WalletConnectHandler;
};

type FeeEstimate = { amount: Amount; choice: FeeChoice }; // FeeChoice is opaque (rule 5)
```

**Fees.** Send, Trading and Earn call the same function. With a query cache the refresh follows the
module; a thunk would call the same function.

```ts
const api = getNetworkApi({ symbol, account });
queryOptions({
    queryKey: ['fee', symbol, account.key, priority], // identity as an opaque key (rule 14)
    queryFn: () => api.estimateFee!({ account, outputs, priority }),
    refetchInterval: api.dataPolicy.follow === 'poll' ? api.dataPolicy.minIntervalMs : false,
});
```

**Trading.** Suite owns the flow and its partners; the network answers. Fee selection, whose UI
differs per network, is the module's feature, rendered by the Trading page.

```tsx
const FeeSelection = suiteModule.getFeeSelection?.(account)?.Component ?? DefaultFeePriority;
const composed = await api.composeTransaction?.({ account, outputs, fee: selected.choice });
const signed = await api.signTransaction?.({ device, account, transaction: composed.value });
await api.pushTransaction?.({ account, transaction: signed.value });
```

**Earn.** A yield provider returns an unsigned transaction. Earn shows a simulation only where the
network supports it, then signs and broadcasts through the network.

```ts
const unsigned = await yieldProvider.enter({ account, amount });
if (api.simulation === 'supported') showSimulation(await simulate(unsigned));
const signed = await api.signTransaction?.({ device, account, transaction: unsigned });
```

**WalletConnect.** A dapp speaks the family's language, so the family translates it inside its own
headless package. Suite's WalletConnect feature passes the request through.

```ts
// network-ethereum-suite-common: maps eth_signTypedData_v4 and friends to the family's typed API
const handler = api.walletConnect;
if (!handler?.methods.includes(request.method)) return reject(request, 'unsupported method');
const result = await handler.handleRequest({ device, account, request });
```

**A module with no Suite bindings.** An external contributor ships only the headless package. Suite
registers it with lego defaults (ADR-003's "whole default implementation"), so Receive and Send
appear; Sign & Verify with a format choice would need a component.

```ts
// networks/acme/network-acme-suite-common: no React, no @suite* imports
export const acmeModule = defineSuiteCommonNetworkModule({
    getSupportedNetworks: () => ['acme'],
    getNetworkApi: ({ account }) => ({
        dataPolicy: { follow: 'poll', minIntervalMs: 15_000 },
        estimateFee: params => estimateAcmeFee(deps, params),
        composeTransaction: params => composeAcmeTransaction(deps, params),
        signTransaction: params => deps.getTrezorConnect().acmeSignTransaction(params),
        pushTransaction: params => pushAcmeTransaction(deps, params),
        simulation: 'unsupported',
    }),
});
```

**Message signing.** The family's Sign & Verify component (ADR-003) uses the family's typed API, such
as Bitcoin's `format: 'electrum'`. A thunk or WalletConnect calls the headless `signMessage`, which
applies the family's default format. Both end in the same family function (rule 13).

An earlier reference implementation, [`develop...b5f7c559e7`][reference], shows a typed headless
API for message signing and transaction details. Its shared screens predate this revision;
under ADR-003 those screens are the family's components.

This ADR does not decide which functions exist beyond those shared code needs, how Suite caches
remote data, or whether external developers may write Suite UI.

**Changes to the ADR-003 proposal:** none to its decisions. It adds one case to its code structure:
a module MAY be headless only (rule 11), and Suite MUST support that. The dependency rule
in [`networks/forbiddenDeps.config.ts`][forbidden-deps] stays as #34986 set it, with one addition:
a module registered as headless-only MUST NOT import React or `@suite*` packages.

## Rejected alternatives

- **Leaving the headless API undefined:** each family's logic is headless but shaped per
  family, so Trading, Earn, thunks and WalletConnect need a switch over families.
- **Shared code calling each family's own API:** shared code then handles the union of every
  family's parameters, the engine ADR-003 rejects.
- **A headless API that describes screens:** field schemas or flags that a shared screen
  interprets are the same rejected engine. Network-specific UI stays a component.
- **Network code loaded at run time:** executable code ships in the release, where it is reviewed and
  signed with Suite; only data changes between releases.

## Consequences

- **Easier:** Trading, Earn, RBF, thunks, WalletConnect and tests call one function per action. A
  network's supported functions per context can be listed and tested. Remote metadata or a probe
  changes availability without a release, within what the release ships. An external module can
  start headless-only and gain components later.
- **Harder:** a function shared code calls must be given one shape for every network first.
  Network-specific UI still needs a component per family, per platform.
- **Migration is per feature.** A family can ship its components first and promote a function to
  the Suite Common contract when shared code needs it.
- **Revisit when** a function keeps needing family-specific parameters: that part is UI and
  belongs in a component.

[subscribe-blocks]: https://github.com/trezor/trezor-suite/blob/bd3630cfba27da8033d77ebb6a808f3784b41d74/suite-common/wallet-utils/src/backendUtils.ts#L79
[forbidden-deps]: https://github.com/trezor/trezor-suite/blob/develop/networks/forbiddenDeps.config.ts
[reference]: https://github.com/trezor/trezor-suite/compare/develop...b5f7c559e7e851667288f95acd2632381d9443bd
