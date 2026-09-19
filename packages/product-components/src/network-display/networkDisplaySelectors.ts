import { createSelector } from 'reselect';

import type { NetworkConfigState, NetworkSymbol } from '@trezor/network-module-types';
import { typedObjectKeys } from '@trezor/utils';

import type { NetworkOption } from './NetworkOption';

export const selectNetworkConfigs = (state: NetworkConfigState) => state.networks;

export const selectNetworkOptions: (
    state: NetworkConfigState,
    symbols?: readonly NetworkSymbol[],
) => readonly NetworkOption[] = createSelector(
    [
        selectNetworkConfigs,
        (_state: NetworkConfigState, symbols?: readonly NetworkSymbol[]) => symbols,
    ],
    (networks, symbols): readonly NetworkOption[] =>
        (symbols ?? (networks === null ? [] : typedObjectKeys(networks))).map(symbol => ({
            symbol,
            name: networks?.[symbol]?.name ?? symbol,
        })),
);
