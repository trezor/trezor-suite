# Dependency Injection

## Context

Most Suite logic lives in Redux thunks. Thunks give us two recurring problems: they make every caller responsible for the dependencies of everything below it, and they have no owner, so anything stateful that cannot go into Redux ends up as a module-level variable. A third problem follows from both: a running process kept in Redux is spread across thunks, middlewares and reducers.

### A parent thunk must provide the dependencies of all its children

A thunk receives its dependencies through `extra`, and so does every thunk it dispatches. The parent's contract therefore has to contain the dependencies of its whole subtree:

- [`RunDiscoveryThunkDeps`](https://github.com/trezor/trezor-suite/blob/55440db6b37efd7605ce893a638707e04d40906a/suite-common/wallet-core/src/discovery/discoveryThunks.ts#L377) needs `analytics` because of `updateDiscoveryThunk`, `getTradedAccountKeys` because of `reportAccountInfoThunk`, `reportSecurityCheck` because of `processDiscoveryEntropyCheckThunk`, and `thunks.fetchAndSaveMetadata` because of a helper. Onboarding's `goToSuiteThunk` sits on top of it and inherits all of them.
- [`InitThunkDeps`](https://github.com/trezor/trezor-suite/blob/55440db6b37efd7605ce893a638707e04d40906a/packages/suite/src/actions/suite/initAction.ts#L82) intersects six dependency types and fifteen state types. Through WalletConnect it requires `lockDevice`, which only the connect-popup flow four levels down uses.
- [`SignAndPushSendFormTransactionThunkDeps`](https://github.com/trezor/trezor-suite/blob/55440db6b37efd7605ce893a638707e04d40906a/packages/suite/src/actions/wallet/send/sendFormThunks.ts#L266) requires `getIsWindowVisible`, because a grandchild that syncs accounts with the blockchain uses it.

The codebase has 215 `…ThunkDeps` and 416 `…ThunkState` types, many of them aliases that only repeat a child's type. Nothing checks that they are complete. [`createThunk`](https://github.com/trezor/trezor-suite/blob/55440db6b37efd7605ce893a638707e04d40906a/packages/redux-utils/src/createThunk.ts#L11) widens `dispatch` to `ThunkDispatch<any, any, …>` so that parents can dispatch children. [`StartDiscoveryThunkDeps`](https://github.com/trezor/trezor-suite/blob/55440db6b37efd7605ce893a638707e04d40906a/suite-common/wallet-core/src/discovery/discoveryThunks.ts#L775) already misses the entropy-check dependency of the run it starts. A missing dependency shows up as a runtime `TypeError`, and only on the path that uses it.

Thunks are even injected into other thunks through [`extra.thunks`](https://github.com/trezor/trezor-suite/blob/55440db6b37efd7605ce893a638707e04d40906a/suite-common/extra-dependencies/src/ExtraDependenciesStatic.ts#L14), which is deprecated as an antipattern. On mobile it is filled with [stubs that silently do nothing](https://github.com/trezor/trezor-suite/blob/55440db6b37efd7605ce893a638707e04d40906a/suite-native-app/state/src/createNativeExtraDependencies.ts#L21).

Tests pay the same price. A test of a parent must mock the services of its grandchildren, like [discovery's `createExtra`](https://github.com/trezor/trezor-suite/blob/55440db6b37efd7605ce893a638707e04d40906a/suite-common/wallet-core/src/discovery/discoveryThunks.test.ts#L190) or `goToSuite.test.ts`, which supplies `fetchAndSaveMetadata` and `getTradedAccountKeys` used three levels down. The alternative is to `jest.mock` the child modules away.

### Thunks have no owner, so state becomes a superglobal

SDK clients, provider instances, timers and registries cannot live in Redux. Thunks have no lifecycle to hold them, so they become module-level variables that any thunk reads and writes:

- **WalletConnect.** [`let walletKit`](https://github.com/trezor/trezor-suite/blob/55440db6b37efd7605ce893a638707e04d40906a/suite-common/walletconnect/src/walletConnectThunks.ts#L33) is a process-wide variable assigned by whichever init runs first. Three code paths trigger init, and the pair thunk [lazily inits it too](https://github.com/trezor/trezor-suite/blob/55440db6b37efd7605ce893a638707e04d40906a/suite-common/walletconnect/src/walletConnectThunks.ts#L495). The SDK's event handlers keep the `dispatch` of the store that initialized it, and nothing ever disposes it.
- **Legacy metadata labeling.** [`providerInstance` and `fetchIntervals`](https://github.com/trezor/trezor-suite/blob/55440db6b37efd7605ce893a638707e04d40906a/suite/metadata/src/metadataProviderThunks.ts#L38) are exported mutable objects. Other files mutate them through a namespace import, and a thunk returns the provider instance, which turns `dispatch` into a service locator.
- **Many more:** `CoinjoinService`'s [static instance registry](https://github.com/trezor/trezor-suite/blob/55440db6b37efd7605ce893a638707e04d40906a/suite/coinjoin/src/coinjoinService.ts#L36), the [`tradeApi` singleton](https://github.com/trezor/trezor-suite/blob/55440db6b37efd7605ce893a638707e04d40906a/suite-common/trading/src/tradeApi.ts#L486) with a static API key, polling timers in token definitions, staking and the message system, the process-wide set of scoped Connect call ids, and the native device access mutex. There are about 20–25 such globals reachable from thunks and middlewares.
- **SDK singletons.** 61 of 185 thunk files import `TrezorConnect` directly, and 37 test files `jest.mock('@trezor/connect')`. The same apps already inject it as `getTrezorConnect` elsewhere.

Ownership, initialization order and disposal of this state are implicit. It is shared by every store in the process, and tests must reset or mock whole modules.

### A running process kept in Redux

Account discovery is a process: it runs, is awaited, waits for the user and can be cancelled. Redux holds only a snapshot of it. A run starts in four thunks, ends from middlewares, deletions and UI cancels, and about 130 files read it from Redux. No code owns a run, so anything about a whole run, such as reporting its outcome and duration (#32267), has to be rebuilt from state transitions. The [discovery epic](https://github.com/trezor/trezor-suite/issues/35209) records the details.

An older proposal in [#17911](https://github.com/trezor/trezor-suite/issues/17911#issuecomment-2765400030) identified the same problem and suggested a stateless discovery process with progress events, dispatched into Redux by a thunk. It does not do full DI: the state stays in Redux and thunks remain the glue.

### Suite Sync already does it right

[`createSuiteSyncCompositionRoot`](https://github.com/trezor/trezor-suite/blob/55440db6b37efd7605ce893a638707e04d40906a/suite-common/suite-sync/src/createSuiteSyncCompositionRoot.ts) builds the whole feature from services once:

- Each service declares only its direct collaborators. [`createTurnOnSuiteSync`](https://github.com/trezor/trezor-suite/blob/55440db6b37efd7605ce893a638707e04d40906a/suite-common/suite-sync/src/createTurnOnSuiteSync.ts) needs `ensureWalletSuiteSyncOn`, `dispatch` and two getters. It knows nothing about the keys, quota, storage and relays that `ensureWalletSuiteSyncOn` itself needs.
- Stateful parts have an owner. The repository of Evolu-backed storages, one per wallet, and the subscription storage are created in the root and passed to the services that use them. There is no module-level state.
- Redux stays for data. Services `dispatch` actions and read state through getters made with `toGetter`.
- Tests mock only direct collaborators with `createMockDeps`, without a store.

## Decision

> [!IMPORTANT]
> Application logic is composed from **services** with explicit dependencies, wired once in **composition roots**. New logic is not written as thunks. A **stateful observable service** is the special case for running processes.

### Services

- **Only direct collaborators.** A service is created by `createX(deps)` and declares only what it uses itself. A collaborator's own dependencies are wired in the composition root and never reach the caller. The compiler checks the wiring once, at the root. The [dependency injection skill](../../skills/dependency-injection/SKILL.md) defines the shape (`XDeps`, `X`, `XDep`, `createX`, `injectX`).
- **Redux holds data, not logic.** Services change data by dispatching plain actions and read it through getters. Reducers, actions and selectors stay.
- **No module-level state.** SDK clients, provider instances, timers, registries and mutexes belong to a service created in a composition root, with explicit initialization and disposal. Two roots never share them.
- **SDKs are injected.** Trezor Connect is reached through `getTrezorConnect`, never through a direct import in application logic.
- **Callers.** React gets services with `useServices`, and services get each other as dependencies. During migration, a remaining thunk may call a service through `extra.services`. A service that still needs a legacy thunk receives it as an injected function created in the root, never through `extra.thunks`.

### Hooks are wiring only

A hook calls `useServices`, `useObservable` and `useSelector` and passes the results to plain functions. Any logic, including values derived from service and Redux state, lives in those functions, which are tested without React.

### Stateful observable services

A stateful service is the case where dependency injection replaces state that would otherwise be a superglobal or a process kept in Redux. Use one when the thing is not data but a running process: a promise that needs synchronization, with state that is more than plain values.

`@trezor/dependency-injection` provides the contract and a helper:

```ts
export type Observable<T> = {
    getSnapshot: () => T;
    subscribe: (listener: () => void) => () => void;
};

// The service keeps `update` private and exposes only `state`.
export const createObservableState = <T>(initial: T) => {
    /* ... */
    return { state, update };
};
```

- **One writer.** Only the service changes its state, through its own methods (`start`, `cancel`, …). Contracts expose no setters.
- **Immutable snapshots.** Every change replaces the snapshot and never mutates it.
- **React** reads a slice with `useObservable(x.state, selector)`, built on `useSyncExternalStore`. The selector result is compared with `Object.is`, so a component re-renders only when its slice changes. `useObservable` lives next to `useServices`.
- **Thunks and other services** await the service's methods or read `deps.x.state.getSnapshot()`.
- **Redux selectors never read services.** A value derived from both is a plain function that takes both values.
- **No Redux mirror.** Readers observe the service. Its state is not copied into Redux.
- **Reacting to a process.** Code that must act after a process does something awaits the method that runs it and continues explicitly. Nothing listens to Redux actions to learn what a process did.

```ts
const { discovery } = useServices(injectDiscovery);
const run = useObservable(discovery.state, state => state.runs[devicePath]);
```

### Lifetime

- **Singleton:** one instance per composition root, e.g. discovery.
- **Repository:** one per composition root, holding instances keyed by an id, created on demand and disposed when removed, like Suite Sync's storage repository. Each instance owns its own state. The repository exposes an observable only if consumers need the set of instances.
- **Tests** create a fresh instance from its factory with mocked direct collaborators, without a store.

### Example: discovery

Illustrative only; the details belong to the [discovery epic](https://github.com/trezor/trezor-suite/issues/35209).

```ts
export type Discovery = {
    state: Observable<DiscoveryState>;
    start: (params: StartDiscoveryParams) => Promise<DiscoveryOutcome>;
    restart: (params: StartDiscoveryParams) => Promise<DiscoveryOutcome>;
    cancel: (devicePath: DeviceUniquePath) => void;
    submitPassphrase: (devicePath: DeviceUniquePath) => void;
};
```

A run is one awaited operation from start to outcome. Waiting for the user happens inside it, and `cancel` aborts it, so the run always settles with its own outcome. Reporting the outcome and its duration wraps `start` in one place:

```ts
export const createReportedDiscovery = (deps: ReportedDiscoveryDeps): Discovery => ({
    ...deps.discovery,
    start: async params => {
        const startedAt = Date.now();
        const outcome = await deps.discovery.start(params);
        deps.analytics.report(toDiscoveryResultEvent(params, outcome, Date.now() - startedAt));

        return outcome;
    },
});
```

### Migration

- **New code** adds no thunks, no `extra.thunks` entries and no module-level mutable state.
- **Existing thunks** move to services feature by feature, in epics. Discovery is the first ([#35209](https://github.com/trezor/trezor-suite/issues/35209)). A feature moves whole: its thunks become services, its module-level state gets an owner, and its tests are ported to mock only direct collaborators.

## Rejected alternatives

- **Keep thunks and type `dispatch` strictly:** the compiler would catch missing dependencies, but every parent would still carry its subtree's dependencies, and stateful collaborators would still have no owner.
- **Inject thunks into thunks (`extra.thunks`):** already deprecated. It hides the same subtree dependencies behind a static object filled outside the composition root.
- **Module-level singletons with setters:** they remain superglobals, with implicit initialization order and shared state between stores and tests.
- **Keep processes in Redux, or mirror a service's state into Redux:** the process stays spread across thunks, middlewares and reducers, or there are two sources of truth and every reader stays coupled to Redux.
- **jotai vanilla stores or an rxjs `BehaviorSubject` for observable state:** library types leak into service contracts. jotai is used only on mobile and rxjs only as a transitive dependency, while our contract maps one to one onto `useSyncExternalStore`.
- **Redux listener middleware or sagas:** they still coordinate logic through actions and a state snapshot.

## Consequences

- **Easier:** every unit declares only its direct dependencies, and the compiler checks the wiring once at the root. Tests mock direct collaborators only. Stateful collaborators have an owner, a lifecycle and per-root isolation. A process is one awaited operation, so cross-cutting concerns such as analytics and timing wrap it in one place.
- **Harder:** composition roots grow and need module-level roots to stay readable, which ADR-001 already allows. Thunks and services coexist until migration finishes, and migrating takes many epics. A value derived from Redux and service state cannot be a memoized Redux selector.
- **Ruled out:** new thunks, `extra.thunks`, module-level mutable state, direct SDK singleton imports in application logic, and Redux selectors reading services.
- **Not a concern:** Redux DevTools and the Redux logger do not show service state.
- **Unchanged:** confidential data in a service snapshot (device state, descriptors, balances) is redacted before it reaches logs or Sentry, as for Redux state today.
- **Revisit** if composition roots become hard to follow despite module-level roots, or if many stateful services need values derived across each other.
