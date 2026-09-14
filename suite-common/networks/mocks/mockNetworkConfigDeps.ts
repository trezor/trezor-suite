import type { NetworkConfigDeps } from '../src/NetworkConfigDeps';
import { createNetworksCompositionRoot } from '../src/createNetworksCompositionRoot';

export const mockNetworkConfigDeps = (): NetworkConfigDeps => {
    const networks = createNetworksCompositionRoot({
        dispatch: () => {
            throw new Error('Network configuration fixtures must not dispatch actions.');
        },
        getTrezorConnect: () => {
            throw new Error('Network configuration fixtures must not call Connect.');
        },
    });

    return {
        getNetworkConfig: networks.getNetworkConfig,
        getNetworkConfigs: networks.getNetworkConfigs,
    };
};
