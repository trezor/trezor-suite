import { createSelector } from '@reduxjs/toolkit';

import type { Protocol } from '@trezor/network-module-suite-common-types';
import { typedObjectValues } from '@trezor/utils';

import type { NetworksRootState } from './networksReducer';
import type { NetworkSymbol } from '../src/NetworkModules';

export const selectSupportedNetworkSymbols = createSelector(
    [(state: NetworksRootState) => state.networks],
    (networks): readonly NetworkSymbol[] =>
        networks === null ? [] : typedObjectValues(networks).map(network => network.symbol),
);

// Keep this helper private: consumers should select only the concrete values they need,
// rather than subscribe to the entire network configuration.
const selectNetworkConfig = (state: NetworksRootState, symbol: NetworkSymbol) =>
    state.networks?.[symbol] ?? null;

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
