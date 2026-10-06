import { createSelector } from 'reselect';

import type { NetworkConfigState, NetworkSymbol } from '@trezor/network-module-types';
import { typedObjectKeys } from '@trezor/utils';

import type { NetworkConfig } from './NetworkConfig';

const selectNetworkConfigs = (state: NetworkConfigState) => state.networks;

export const selectNetworkOptions: (
    state: NetworkConfigState,
    /** Filters which networks are displayed and sets their order to match this list. */
    requestedSymbols?: readonly NetworkSymbol[],
) => readonly NetworkConfig[] = createSelector(
    [
        selectNetworkConfigs,
        (_state: NetworkConfigState, requestedSymbols?: readonly NetworkSymbol[]) =>
            requestedSymbols,
    ],
    (networks, requestedSymbols): readonly NetworkConfig[] => {
        const toNetworkConfig = (symbol: NetworkSymbol): NetworkConfig => ({
            symbol,
            name: networks?.[symbol]?.name ?? symbol,
        });

        if (requestedSymbols !== undefined) {
            return requestedSymbols.map(toNetworkConfig);
        }

        if (networks === null) {
            return [];
        }

        return typedObjectKeys(networks).map(toNetworkConfig);
    },
);
