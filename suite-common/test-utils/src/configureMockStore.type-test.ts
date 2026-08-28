import { type UnknownAction } from '@reduxjs/toolkit';

import { type WithServices } from '@suite-common/redux-utils';

import { configureMockStore } from './configureMockStore';

// Platform tests add thunk services that are intentionally unknown to suite-common. This
// compile-only test guards the third generic that lets them supply those platform-specific
// overrides; removing or narrowing that extension point must fail the package type-check.
type PlatformExtraDependencies = WithServices<{
    platformOnlyService: () => void;
}>;

const store = configureMockStore<{ value: number }, UnknownAction, PlatformExtraDependencies>({
    extra: {
        services: {
            platformOnlyService: () => {},
        },
    },
    preloadedState: { value: 1 },
});

void store;
