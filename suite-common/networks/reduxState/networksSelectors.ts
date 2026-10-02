import { createSelector } from '@reduxjs/toolkit';

import type { Protocol } from '@trezor/network-module-suite-common-types';
import { typedObjectFromEntries, typedObjectValues } from '@trezor/utils';

import type { NetworkMetadata } from './NetworkMetadata';
import type { NetworksRootState } from './networksReducer';
import type { NetworkSymbol } from '../src/NetworkModules';

export const selectSupportedNetworkSymbols = createSelector(
    [(state: NetworksRootState) => state.networks],
    (networks): readonly NetworkSymbol[] =>
        networks === null ? [] : typedObjectValues(networks).map(network => network.symbol),
);

export const selectNetworkNamesMap = createSelector(
    [(state: NetworksRootState) => state.networks],
    (networks): Record<NetworkSymbol, string> | null =>
        networks === null
            ? null
            : typedObjectFromEntries(
                  typedObjectValues(networks).map(({ symbol, name }) => [symbol, name] as const),
              ),
);

export const selectNetworkConfig = (
    state: NetworksRootState,
    symbol: NetworkSymbol,
): NetworkMetadata | null => state.networks?.[symbol] ?? null;

export const selectNetworkConfigs = createSelector(
    [(state: NetworksRootState) => state.networks],
    (networks): readonly NetworkMetadata[] =>
        networks === null ? [] : typedObjectValues(networks),
);

export const selectNetworkColor = (state: NetworksRootState, symbol?: NetworkSymbol | null) =>
    symbol ? selectNetworkConfig(state, symbol)?.color : undefined;

export const selectNetworkSymbolForProtocol = (
    state: NetworksRootState,
    protocol: Protocol | undefined,
): NetworkSymbol | null => {
    if (protocol === undefined || state.networks === null) {
        return null;
    }

    return (
        typedObjectValues(state.networks).find(network => network.protocols.includes(protocol))
            ?.symbol ?? null
    );
};
