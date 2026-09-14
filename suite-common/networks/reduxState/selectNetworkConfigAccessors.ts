import { createSelector } from '@reduxjs/toolkit';

import type { NetworksRootState } from './networksReducer';
import type { NetworkConfigDeps } from '../src/NetworkConfigDeps';

export const selectNetworkConfigAccessors = createSelector(
    [(state: NetworksRootState) => state.networks],
    (networks): NetworkConfigDeps => {
        const configs = Object.values(networks ?? {});

        return {
            getNetworkConfig: symbol => {
                const network = networks?.[symbol];
                if (!network) {
                    throw new Error(`Network configuration for ${symbol} is not loaded.`);
                }

                return network;
            },
            getNetworkConfigs: () => configs,
        };
    },
);
