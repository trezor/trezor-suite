import type {
    ExternalStore,
    RuntimeNetworkKey,
    RuntimeNetworkPreferencesStore,
} from '@trezor/network-module-suite-common-types';

import type { RuntimeEvmNetworkDefinition } from './RuntimeEvmNetworkDefinition';
import {
    type RuntimeEvmNetworkReservations,
    type RuntimeEvmNetworkResolution,
    resolveRuntimeEvmNetworks,
} from './resolveRuntimeEvmNetworks';

export type RuntimeEvmNetworkRegistrySnapshot = RuntimeEvmNetworkResolution & {
    /** Whether runtime networks are read at all; the platform decides (e.g. a feature flag). */
    readonly isActive: boolean;

    /** The networks to read: the enabled ones, none while inactive. */
    readonly enabledDefinitions: readonly RuntimeEvmNetworkDefinition[];
};

export type RuntimeEvmNetworkRegistryDeps = {
    /** The user's choices, kept however the platform keeps them. */
    preferences: RuntimeNetworkPreferencesStore;

    /** Entries of Trezor's signed list, unchecked; a stable reference while it is unchanged. */
    trezorListed: ExternalStore<readonly unknown[]>;
    isActive: ExternalStore<boolean>;
    builtIn: RuntimeEvmNetworkReservations;
};

/** Runtime EVM networks and the user's choices about them, readable by any platform's UI. */
export type RuntimeEvmNetworkRegistry = ExternalStore<RuntimeEvmNetworkRegistrySnapshot> & {
    /** Keeps a network the user defined; it stays off until enabled. */
    addUserDefinition: (definition: RuntimeEvmNetworkDefinition) => void;
    removeUserDefinition: (symbol: string) => void;

    /** Turning a network on sends the wallet's EVM addresses to its nodes. */
    setEnabled: (key: RuntimeNetworkKey, isEnabled: boolean) => void;
};

export type RuntimeEvmNetworkRegistryDep = { runtimeEvmNetworkRegistry: RuntimeEvmNetworkRegistry };

export const injectRuntimeEvmNetworkRegistry = (services: any): RuntimeEvmNetworkRegistryDep => ({
    runtimeEvmNetworkRegistry: services.runtimeEvmNetworkRegistry,
});

/**
 * The registry over the platform's sources. Its snapshot is the same reference until a source
 * changes, so a consumer re-renders, and a network is rebuilt, only then.
 */
export const createRuntimeEvmNetworkRegistry = (
    deps: RuntimeEvmNetworkRegistryDeps,
): RuntimeEvmNetworkRegistry => {
    let cached:
        | {
              preferences: unknown;
              trezorListed: unknown;
              isActive: boolean;
              snapshot: RuntimeEvmNetworkRegistrySnapshot;
          }
        | undefined;

    const getSnapshot = () => {
        const preferences = deps.preferences.getSnapshot();
        const trezorListed = deps.trezorListed.getSnapshot();
        const isActive = deps.isActive.getSnapshot();

        if (
            cached?.preferences === preferences &&
            cached.trezorListed === trezorListed &&
            cached.isActive === isActive
        ) {
            return cached.snapshot;
        }

        const resolution = resolveRuntimeEvmNetworks({
            trezorListed,
            preferences,
            builtIn: deps.builtIn,
        });
        const snapshot = {
            ...resolution,
            isActive,
            enabledDefinitions: isActive
                ? resolution.networks
                      .filter(network => network.isEnabled)
                      .map(network => network.definition)
                : [],
        };
        cached = { preferences, trezorListed, isActive, snapshot };

        return snapshot;
    };

    return {
        getSnapshot,
        subscribe: listener => {
            const unsubscribes = [
                deps.preferences.subscribe(listener),
                deps.trezorListed.subscribe(listener),
                deps.isActive.subscribe(listener),
            ];

            return () => unsubscribes.forEach(unsubscribe => unsubscribe());
        },
        addUserDefinition: definition => deps.preferences.addUserDefinition(definition),
        removeUserDefinition: symbol => deps.preferences.removeUserDefinition(symbol),
        setEnabled: (key, isEnabled) => deps.preferences.setEnabled(key, isEnabled),
    };
};
