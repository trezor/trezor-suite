# Headless composition of network modules

> [!NOTE]
> Builds on [ADR-003](https://github.com/trezor/trezor-suite/pull/34612) and changes none of its
> decisions. ADR-003 allows a headless contract for answers with the same shape for every network,
> and leaves "which operations it contains … to be explored and defined". This ADR defines it.

## Context

Under ADR-003 a feature whose UI differs per network is the module's component, and its logic stays
headless in `-suite-common`. Several callers need answers from that logic without rendering a
screen, and have no contract for them today:

- **Suite-owned flows.** Trading, Earn, staking and RBF compose, sign and broadcast transactions,
  and need fees. They render no network screen and have no contract for it, so each keeps its own
  switch over the network or its own copy of the device request.
- **Sign & verify, half done.** `develop` already has a headless contract for it
  ([`NetworkSignMessage`][sign-message]), but only the desktop and mobile forms use it: the
  WalletConnect adapters build their own device requests, and Trading calls Connect directly to sign
  typed data. The contract also lists every network's signature formats in one union, and Bitcoin
  narrows it back at run time; both are marked as hacks.
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

The names are illustrative. A family's network module exposes its headless API like this:

```ts
type SuiteCommonNetworkModule = {
    signVerify?: {
        signMessage(
            symbol: NetworkSymbol,
            params: SignMessageParams,
        ): Promise<Result<SignedMessage, SignError>>;
        verifyMessage?(
            symbol: NetworkSymbol,
            params: VerifyMessageParams,
        ): Promise<Result<void, VerifyError>>; // absent: cannot verify
    };
    fees?: {
        getRefreshPolicy(symbol: NetworkSymbol): {
            follow: 'subscription' | 'poll';
            minIntervalMs: number;
        };
        estimateFeeLevels(symbol: NetworkSymbol): Promise<Result<FeeLevels, FeeError>>;
    };
};
```

**Sign & verify.** The shared `signMessage` takes no signature format (rules 2 and 3), so the union of
every network's formats on `develop` goes away. A thunk or WalletConnect signs with the family's
default; the family's own component, under ADR-003, picks a format from the family's own type. Both
end in the same family function (rule 10).

```ts
// shared code: any network
const signed = await networkModule.signVerify?.signMessage(symbol, { device, path, message, hex });
const canVerify = networkModule.signVerify?.verifyMessage !== undefined;

// Bitcoin's own Sign & Verify component: Bitcoin's types
await signBitcoinMessage(symbol, { device, path, message, hex, format: 'electrum' }); // ✓
await signBitcoinMessage(symbol, { device, path, message, hex, format: 'cose' }); // ✗ not Bitcoin's
```

**Fees with Redux.** The thunk asks the network for its levels and stores them in the fees slice; the
refetch hook that Send, Trading and Earn share refreshes as the network says. The service comes
from `extra.services` in the thunk and from `useServices` in the hook.

```ts
export const updateFeeInfoThunk = createThunk<FeeInfo, { symbol: NetworkSymbol }, FeeThunkConfig>(
    'fees/update',
    async ({ symbol }, { extra, rejectWithValue }) => {
        const result = await extra.services.networks
            .getNetworkFees(symbol)
            ?.estimateFeeLevels(symbol);

        return result?.success ? result.payload : rejectWithValue(undefined);
    },
);

export const useRefetchFees = (symbol: NetworkSymbol) => {
    const { dispatch } = useServices(injectDispatch);
    const { getNetworkFees } = useServices(injectGetNetworkFees);

    useEffect(() => {
        const intervalMs = getNetworkFees(symbol)?.getRefreshPolicy(symbol).minIntervalMs;
        if (intervalMs === undefined) return;

        const id = setInterval(() => dispatch(updateFeeInfoThunk({ symbol })), intervalMs);

        return () => clearInterval(id);
    }, [dispatch, getNetworkFees, symbol]);
};
```

**Fees with TanStack Query.** The same two functions as one query per network. Components subscribe
with `useQuery`; a thunk or service reads the same cache entry.

```ts
export const getFeeLevelsQueryOptions = (
    { getNetworkFees }: GetNetworkFeesDep,
    symbol: NetworkSymbol,
) => {
    const fees = getNetworkFees(symbol);

    return queryOptions({
        queryKey: ['fee-levels', symbol], // identity as an opaque key (rule 11)
        queryFn: fees
            ? async () => {
                  const result = await fees.estimateFeeLevels(symbol);
                  if (!result.success) throw new Error(result.error.message);

                  return result.payload;
              }
            : skipToken, // the network has no fee estimate
        refetchInterval: fees?.getRefreshPolicy(symbol).minIntervalMs,
    });
};

const { data: feeLevels } = useQuery(getFeeLevelsQueryOptions(networks, symbol)); // Send, Trading, Earn
const feeLevels = await queryClient.ensureQueryData(getFeeLevelsQueryOptions(networks, symbol)); // a thunk
```

**Signing with Redux.** A thunk keeps the app's side effects (device state, analytics, toasts) and
calls the network's headless function; a component runs that thunk with `useMutation` to get pending
and error state. A device action is never retried.

```tsx
export const signMessageThunk = createThunk<SignedMessage, SignMessageArgs, SignThunkConfig>(
    'signVerify/sign',
    async ({ symbol, ...params }, { extra, rejectWithValue }) => {
        const signVerify = extra.services.networks.getNetworkModule(symbol).signVerify;
        const result = await signVerify?.signMessage(symbol, params);

        return result?.success ? result.payload : rejectWithValue(result?.error);
    },
);

const signMutation = useMutation({
    mutationFn: (args: SignMessageArgs) => dispatch(signMessageThunk(args)).unwrap(),
    retry: false, // a retry would prompt on the device again
    onSuccess: ({ signature }) => setValue('signature', signature),
});

signMutation.mutate({ symbol, device, path, message, hex }); // isPending and error drive the form
```

**Signing without Redux.** The headless functions are plain async functions, so a component binds
them with `useMutation` and the app's injected services: toasts and analytics go in its callbacks.
Data stays in queries over the same functions, and an action that changes it invalidates them.

```tsx
const { networks, toasts, analytics } = useServices(injectSignVerifyServices);
const queryClient = useQueryClient();
const signVerify = networks.getNetworkModule(symbol).signVerify;

const signMutation = useMutation({
    mutationFn: async (params: SignMessageParams) => {
        if (!signVerify) throw new SignError('unsupported'); // the network cannot sign

        const result = await signVerify.signMessage(symbol, params);
        if (!result.success) throw result.error;

        return result.payload;
    },
    retry: false, // a retry would prompt on the device again
    onSuccess: ({ signature }) => {
        setValue('signature', signature);
        toasts.show({ type: 'sign-message-success' });
    },
    onError: (error: SignError) => toasts.show({ type: 'sign-message-error', reason: error.type }),
    onSettled: (_, error) => analytics.report({ type: 'sign-message', success: !error }), // no account data
});

// a send form: the fee query from above, refetched after a broadcast
const { data: feeLevels } = useQuery(getFeeLevelsQueryOptions(networks, symbol));
const onBroadcast = () => queryClient.invalidateQueries({ queryKey: ['fee-levels', symbol] });
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

[sign-message]: https://github.com/trezor/trezor-suite/blob/560c000c72/networks/network-module/suite-common/suite-common-types/src/signVerify/NetworkSignMessage.ts#L12
[subscribe-blocks]: https://github.com/trezor/trezor-suite/blob/bd3630cfba27da8033d77ebb6a808f3784b41d74/suite-common/wallet-utils/src/backendUtils.ts#L79
