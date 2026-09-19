import { createSelector } from 'reselect';

import type { NetworkSymbol } from '@trezor/network-module-types';
import { typedObjectKeys } from '@trezor/utils';

import type { NetworkDisplayState, NetworkOption } from './NetworkDisplayConfig';

export const selectNetworkConfigs = (state: NetworkDisplayState) => state.networks;

export const selectNetworkOptions: (
    state: NetworkDisplayState,
    symbols?: readonly NetworkSymbol[],
) => readonly NetworkOption[] = createSelector(
    [
        selectNetworkConfigs,
        (_state: NetworkDisplayState, symbols?: readonly NetworkSymbol[]) => symbols,
    ],
    (networks, symbols): readonly NetworkOption[] =>
        (symbols ?? (networks === null ? [] : typedObjectKeys(networks))).map(symbol => ({
            symbol,
            name: networks?.[symbol]?.name ?? symbol,
        })),
);
