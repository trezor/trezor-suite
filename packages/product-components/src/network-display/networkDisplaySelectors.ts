import { createSelector } from 'reselect';

import {
    type NetworkConfigState,
    type NetworkSymbol,
    asNetworkSymbol,
} from '@trezor/network-module-types';
import { typedObjectKeys } from '@trezor/utils';

import type { NetworkConfig } from './NetworkConfig';

export const selectNetworkConfigs = (state: NetworkConfigState) => state.networks;

export const selectNetworkConfig: (
    state: NetworkConfigState,
    symbol: string,
) => NetworkConfig | undefined = createSelector(
    [
        (state: NetworkConfigState, symbol: string) => state.networks?.[asNetworkSymbol(symbol)],
        (_state: NetworkConfigState, symbol: string) => asNetworkSymbol(symbol),
    ],
    (config, symbol) => (config ? { ...config, symbol } : undefined),
);

export const selectNetworkConfigByCoingeckoId = (
    state: NetworkConfigState,
    coingeckoId: string,
): NetworkConfig | undefined => {
    if (!state.networks) return undefined;

    const symbol = typedObjectKeys(state.networks).find(
        networkSymbol => state.networks?.[networkSymbol].coingeckoId === coingeckoId,
    );

    return symbol ? selectNetworkConfig(state, symbol) : undefined;
};

export const selectDisplaySymbol = (
    state: NetworkConfigState,
    coinSymbol: string,
    contractAddress?: string | null,
): string => {
    const config = selectNetworkConfig(state, coinSymbol.toLowerCase());
    if (config && !contractAddress) return config.displaySymbol ?? coinSymbol;

    return coinSymbol.length > 10 ? `${coinSymbol.slice(0, 10)}...` : coinSymbol;
};

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

export const selectNetworkDisplayConfig = createSelector(
    [selectNetworkConfigs, (_state: NetworkConfigState, symbol: string) => symbol.toLowerCase()],
    (networks, symbol): NetworkConfig | undefined => {
        if (!networks) return undefined;

        const symbols = typedObjectKeys(networks);
        const networkSymbol =
            symbols.find(key => key === symbol) ??
            symbols.find(key => networks[key].displaySymbol?.toLowerCase() === symbol);

        return networkSymbol ? { ...networks[networkSymbol], symbol: networkSymbol } : undefined;
    },
);
