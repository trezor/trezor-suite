import { type WithServices } from '@suite-common/redux-utils';

import { createTestStore } from './createTestStore';

// A store whose tested code needs no services requires no configuration.
const { store: dependencyFreeStore } = createTestStore({ preloadedState: { value: 1 } });

void dependencyFreeStore;

// Platform tests add thunk services that are intentionally unknown to suite-common. This
// compile-only test guards the explicit local contract that lets them supply those services
// without pulling the global application dependency graph into the test utility.
type PlatformExtraDependencies = WithServices<{
    platformOnlyService: () => void;
}>;

const { store, injectServicesIntoReduxExtra } = createTestStore<PlatformExtraDependencies>({
    preloadedState: { value: 1 },
});

injectServicesIntoReduxExtra({ platformOnlyService: () => {} });

// @ts-expect-error Injected services must satisfy the declared dependency contract.
injectServicesIntoReduxExtra({});

void store;

// Static (non-service) extra dependencies are passed when the store is created.
type StaticExtraDependencies = WithServices<Record<never, never>> & {
    thunks: { run: () => void };
};

createTestStore<StaticExtraDependencies>({ extra: { thunks: { run: () => {} } } });

// @ts-expect-error Declared static extra dependencies must be provided.
createTestStore<StaticExtraDependencies>({});
