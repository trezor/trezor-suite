import { type UnknownAction } from '@reduxjs/toolkit';

import { type WithServices } from '@suite-common/redux-utils';

import { configureMockStore } from './configureMockStore';

// @ts-expect-error Every test must provide a config with an explicit dependency value.
configureMockStore();

// @ts-expect-error A test must explicitly declare that it has no dependencies.
configureMockStore({});

const dependencyFreeStore = configureMockStore({
    extra: undefined,
    preloadedState: { value: 1 },
});

void dependencyFreeStore;

// Platform tests add thunk services that are intentionally unknown to suite-common. This
// compile-only test guards the explicit local contract that lets them supply those services
// without pulling the global application dependency graph into the test utility.
type PlatformExtraDependencies = WithServices<{
    platformOnlyService: () => void;
}>;

const platformExtraDependencies: PlatformExtraDependencies = {
    services: {
        platformOnlyService: () => {},
    },
};

const store = configureMockStore({
    extra: platformExtraDependencies,
    preloadedState: { value: 1 },
});

void store;

// @ts-expect-error A non-void dependency contract must be backed by an explicit value.
configureMockStore<PlatformExtraDependencies, { value: number }, UnknownAction>({
    preloadedState: { value: 1 },
});
