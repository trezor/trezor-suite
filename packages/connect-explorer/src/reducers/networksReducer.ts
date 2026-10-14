import type { Reducer } from 'redux';
import { createSelector } from 'reselect';

import type {
    NetworkConfigState,
    NetworkConfigs,
    NetworkSymbol,
} from '@trezor/network-module-types';
import { typedObjectEntries } from '@trezor/utils';

export const networksReducer: Reducer<NetworkConfigs> = (state = null) => state;

export const selectNetworkOptions = createSelector(
    [(state: NetworkConfigState) => state.networks],
    (networks): readonly { symbol: NetworkSymbol; name: string }[] =>
        networks === null
            ? []
            : typedObjectEntries(networks).map(([symbol, config]) => ({
                  symbol,
                  name: config.name,
              })),
);
