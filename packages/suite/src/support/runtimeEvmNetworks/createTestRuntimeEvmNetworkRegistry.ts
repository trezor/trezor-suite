import { createRuntimeEvmNetworkRegistry } from '@trezor/network-ethereum-suite-common';
import {
    type ExternalStore,
    createInMemoryRuntimeNetworkPreferencesStore,
} from '@trezor/network-module-suite-common-types';

import { BUILT_IN_NETWORK_RESERVATIONS } from './runtimeEvmNetworkSources';

const createStaticSource = <T>(value: T): ExternalStore<T> => ({
    getSnapshot: () => value,
    subscribe: () => () => {},
});

export type TestRuntimeEvmNetworkRegistryParams = {
    isActive?: boolean;
    trezorListed?: readonly unknown[];
};

/** A registry over in-memory preferences, for tests of the views that read it. */
export const createTestRuntimeEvmNetworkRegistry = ({
    isActive = true,
    trezorListed = [],
}: TestRuntimeEvmNetworkRegistryParams = {}) =>
    createRuntimeEvmNetworkRegistry({
        preferences: createInMemoryRuntimeNetworkPreferencesStore(),
        trezorListed: createStaticSource(trezorListed),
        isActive: createStaticSource(isActive),
        builtIn: BUILT_IN_NETWORK_RESERVATIONS,
    });
