import { type WithServices } from '@suite-common/redux-utils';

import { createTestCompositionRoot } from './createTestCompositionRoot';

// Every root declares its contract; `void` declares that nothing is injected.
const dependencyFreeRoot = createTestCompositionRoot<void, { value: number }>({
    preloadedState: { value: 1 },
});

void dependencyFreeRoot.services.store.getState().value;

// @ts-expect-error The contract must be declared.
createTestCompositionRoot({ preloadedState: { value: 1 } });

// @ts-expect-error The contract must be declared even when no options are passed.
createTestCompositionRoot();

// @ts-expect-error The State type argument must be declared.
createTestCompositionRoot<void>({});

// @ts-expect-error `any` is not a contract.
createTestCompositionRoot<any, { value: number }>({});

// @ts-expect-error `any` is not a state contract.
createTestCompositionRoot<void, any>({});

// A reducer does not stand in for the declared state.
createTestCompositionRoot<void, { value: number }>({
    // @ts-expect-error The reducer must produce the declared state.
    reducer: (state: { other: string } = { other: '' }) => state,
});

// Platform tests add thunk services that are intentionally unknown to suite-common. This
// compile-only test guards the explicit local contract that lets them supply those services
// without pulling the global application dependency graph into the test utility.
type PlatformExtraDependencies = WithServices<{
    platformOnlyService: () => void;
}>;

const platformRoot = createTestCompositionRoot<PlatformExtraDependencies, unknown>({
    services: () => ({ platformOnlyService: () => {} }),
});

void platformRoot.services.platformOnlyService;
void platformRoot.services.store;
void platformRoot.extra.services.platformOnlyService;

// @ts-expect-error Declared services must be composed.
createTestCompositionRoot<PlatformExtraDependencies, unknown>({});

createTestCompositionRoot<PlatformExtraDependencies, unknown>({
    // @ts-expect-error Composed services must satisfy the declared dependency contract.
    services: () => ({}),
});

// Services are composed from the store, so a service may depend on it.
type StoreDependentExtraDependencies = WithServices<{ getValue: () => number }>;

createTestCompositionRoot<StoreDependentExtraDependencies, { value: number }>({
    preloadedState: { value: 1 },
    services: store => ({ getValue: () => store.getState().value }),
});

// Static (non-service) extra dependencies are passed when the root is created.
type StaticExtraDependencies = WithServices<Record<never, never>> & {
    thunks: { run: () => void };
};

const staticRoot = createTestCompositionRoot<StaticExtraDependencies, unknown>({
    extra: { thunks: { run: () => {} } },
});

void staticRoot.extra.thunks.run;

// @ts-expect-error Declared static extra dependencies must be provided.
createTestCompositionRoot<StaticExtraDependencies, unknown>({});
