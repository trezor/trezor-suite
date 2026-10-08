import { useSyncExternalStore } from 'react';

import { useServices } from '@suite-common/dependency-injection';
import { injectRuntimeEvmNetworkRegistry } from '@trezor/network-ethereum-suite-common';

/**
 * Runtime EVM networks and the user's choices about them, read from the registry service rather
 * than Redux. Re-renders only when the networks, the choices or the flag change.
 */
export const useRuntimeEvmNetworkRegistry = () => {
    const { runtimeEvmNetworkRegistry } = useServices(injectRuntimeEvmNetworkRegistry);
    const snapshot = useSyncExternalStore(
        runtimeEvmNetworkRegistry.subscribe,
        runtimeEvmNetworkRegistry.getSnapshot,
    );

    return { snapshot, registry: runtimeEvmNetworkRegistry };
};
