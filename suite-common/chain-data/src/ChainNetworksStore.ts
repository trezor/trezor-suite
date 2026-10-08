import { useSyncExternalStore } from 'react';

import { useServices } from '@suite-common/dependency-injection';
import type { ChainNetwork, ExternalStore } from '@trezor/network-module-suite-common-types';

/**
 * The chain networks the app reads and sends through: the networks the user selected, each bound
 * to its chosen backend, plus any the platform adds (runtime networks). It publishes only when the
 * list changes, so consumers re-render only then, and no state library is needed to read it.
 */
export type ChainNetworksStore = ExternalStore<readonly ChainNetwork[]>;

export type ChainNetworksStoreDep = { chainNetworksStore: ChainNetworksStore };

export const injectChainNetworksStore = (services: any): ChainNetworksStoreDep => ({
    chainNetworksStore: services.chainNetworksStore,
});

export type ChainNetworksStoreDeps = {
    /** Calls back whenever anything the networks are built from may have changed. */
    subscribeToSources: (onChange: () => void) => () => void;

    /** The current networks; a network whose inputs did not change keeps its instance. */
    getNetworks: () => readonly ChainNetwork[];
};

const isSameNetworkList = (a: readonly ChainNetwork[], b: readonly ChainNetwork[]) =>
    a.length === b.length && a.every((network, index) => network === b[index]);

/**
 * A chain networks store over the platform's sources. It stays subscribed for the app's lifetime,
 * so a read outside React (e.g. when a send starts) sees the current networks too.
 */
export const createChainNetworksStore = (deps: ChainNetworksStoreDeps): ChainNetworksStore => {
    const listeners = new Set<() => void>();
    let snapshot = deps.getNetworks();

    deps.subscribeToSources(() => {
        const networks = deps.getNetworks();
        if (isSameNetworkList(snapshot, networks)) return;

        snapshot = networks;
        listeners.forEach(listener => listener());
    });

    return {
        getSnapshot: () => snapshot,
        subscribe: listener => {
            listeners.add(listener);

            return () => {
                listeners.delete(listener);
            };
        },
    };
};

/** The chain networks, re-rendering the component only when the list changes. */
export const useSelectedChainNetworks = () => {
    const { chainNetworksStore } = useServices(injectChainNetworksStore);

    return useSyncExternalStore(chainNetworksStore.subscribe, chainNetworksStore.getSnapshot);
};
