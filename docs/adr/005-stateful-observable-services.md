# Running processes live in stateful observable services, not in Redux

## Context

Redux works well for data: accounts, settings, transactions. It works badly for a **process**: something that runs, is awaited, has to be synchronized (cancellation, ordering, waiting for the user) and whose state is more than plain data.

Account discovery is the clearest example. A run is a process, but Redux holds only a snapshot of it, so the process is spread across thunks, middlewares and reducers that coordinate through that snapshot:

- A run starts with the `startDiscovery` action, dispatched from four different thunks. The work itself (`runDiscoveryThunk`) is often started separately and later, by the UI once a passphrase is entered.
- A run ends from outside as often as from inside: a middleware on device disconnect, deleting the discovery when the device is forgotten, the rollback of a failed network activation, passphrase screens cancelling or "silently" restarting it.
- About 85 files read discovery state directly and about 45 more through derived selectors. Other slices and middlewares react to discovery actions to refresh graphs, coinjoin accounts or coin visibility.

Because no single piece of code owns a run, anything that concerns the whole run has to be rebuilt from state transitions. Reporting the outcome of a run hooks into every state update, and adding its duration ([#32267](https://github.com/trezor/trezor-suite/issues/32267)) needs extra timing fields in Redux ([#34487](https://github.com/trezor/trezor-suite/pull/34487), [#35198](https://github.com/trezor/trezor-suite/pull/35198)).

Our dependency injection ([skill](../../skills/dependency-injection/SKILL.md)) has only stateless services. The only way service code reaches React reactively is `useGetter`, which reads Redux. A service cannot own state that the UI observes.

## Decision

> [!IMPORTANT]
> A process is a **stateful DI service**. It owns its state, exposes it as an **observable**, and is the only code that writes it. Its state is not stored in Redux.

Use a stateful service when the thing is not data but a running process: a promise that needs synchronization, with state that is more than plain values. Keep data in Redux.

### Observable contract

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
- **DI rules unchanged.** A stateful service follows the existing `XDeps`, `X`, `XDep`, `createX(deps)` and `injectX` pattern; `state: Observable<XState>` is one of its members.

### Reading state

- **React** gets the service with `useServices` and reads a slice with `useObservable`, built on `useSyncExternalStore`. The selector result is compared with `Object.is`, so a component re-renders only when its slice changes. `useObservable` lives next to `useServices`.
- **Thunks and other services** await the service's methods or read `deps.x.state.getSnapshot()`.
- **Redux selectors never read services.** A value derived from both Redux state and a service snapshot is a plain function that takes both values, called from a hook or a thunk.

```ts
const { discovery } = useServices(injectDiscovery);
const run = useObservable(discovery.state, state => state.runs[devicePath]);
```

### Reacting to a process

Code that must act after a process does something awaits the method that runs it and continues explicitly. Nothing listens to Redux actions to learn what a process did.

### Lifetime

- **Singleton:** one instance per composition root, e.g. discovery.
- **Repository:** one per composition root, holding instances keyed by an id, created on demand and disposed when removed. `createSuiteSyncStorageRepository` already works this way for the Evolu-backed storage of each wallet. Each instance owns its own observable state; the repository exposes an observable only if consumers need the set of instances.
- **No module-level state.** Tests create a fresh instance from its factory with mocked dependencies, without a Redux store.

### Example: discovery

Illustrative only; the details belong to the discovery change.

```ts
export type Discovery = {
    state: Observable<DiscoveryState>;
    start: (params: StartDiscoveryParams) => Promise<DiscoveryOutcome>;
    restart: (params: StartDiscoveryParams) => Promise<DiscoveryOutcome>;
    cancel: (devicePath: DeviceUniquePath) => void;
    submitPassphrase: (devicePath: DeviceUniquePath) => void;
};
```

A run is one awaited operation from start to outcome. Waiting for the user happens inside it, and `cancel` aborts it, so the run always settles with its own outcome. Reporting the outcome and its duration then wraps `start` in one place:

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

## Rejected alternatives

- **Keep processes in Redux:** the process stays spread across thunks, middlewares and reducers, outcomes have many writers, and every concern about a whole run needs more fields in state.
- **Service owns the process and mirrors its state into Redux:** two sources of truth, every reader stays coupled to Redux, and a temporary mirror tends to become permanent.
- **jotai vanilla stores or an rxjs `BehaviorSubject`:** library types leak into service contracts. jotai is used only on mobile and rxjs only as a transitive dependency, while our contract maps one to one onto `useSyncExternalStore`.
- **Redux listener middleware or sagas:** they still coordinate a process through actions and a state snapshot.

## Consequences

- **Easier:** a process is one awaited operation, so cross-cutting concerns (analytics, timing, logging) wrap it in one place. Cancellation is explicit. Tests need no store.
- **Harder:** a value derived from Redux and service state cannot be a memoized Redux selector. Contributors work with two state mechanisms with a clear rule between them. Moving discovery touches every file that reads its state today.
- **Ruled out:** Redux selectors reading services, and middlewares reacting to what a process did.
- **Not a concern:** Redux DevTools and the Redux logger do not show service state.
- **Unchanged:** confidential data in a snapshot (device state, descriptors, balances) is redacted before it reaches logs or Sentry, as for Redux state today.
- **Revisit** if many services need values derived across each other; then consider a shared derivation primitive instead of ad hoc functions.
