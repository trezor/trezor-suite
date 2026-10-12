import type { Reducer } from 'redux';
import { createSelector } from 'reselect';

import type {
    NetworkConfigs,
    NetworkConfigState,
    NetworkSymbol,
} from '@trezor/network-module-types';
import { typedObjectKeys } from '@trezor/utils';

export const networksReducer: Reducer<NetworkConfigs> = (state = null) => state;

export const selectNetworkOptions = createSelector(
    [(state: NetworkConfigState) => state.networks],
    (networks): readonly { symbol: NetworkSymbol; name: string }[] =>
        networks === null
            ? []
            : typedObjectKeys(networks).map(symbol => ({ symbol, name: networks[symbol].name })),
);
