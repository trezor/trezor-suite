import { createReducerWithExtraDeps } from '@suite-common/redux-utils';
import { Explorer, NetworkSymbol, networksCollection } from '@suite-common/wallet-config';
import { getExplorerUrlsRaw } from '@suite-common/wallet-config/src/getExplorerUrls';

import { explorerActions } from './explorerActions';

export type ExplorerItem = {
    default: Explorer;
    custom?: Explorer;
};

export type ExplorerConfig = Record<NetworkSymbol, ExplorerItem>;
export type ExplorerState = { wallet: { explorer: ExplorerConfig } };

const initialStatePredefined: Partial<ExplorerConfig> = {};

export const explorerInitialState: ExplorerConfig = networksCollection.reduce((state, network) => {
    state[network.symbol] = {
        default: getExplorerUrlsRaw(
            network.explorer.base,
            network.networkType,
            network.explorer.queryString,
        ),
        custom: undefined,
    };

    return state;
}, initialStatePredefined as ExplorerConfig);

export const prepareExplorerReducer = createReducerWithExtraDeps(
    explorerInitialState,
    (builder, extra) => {
        builder
            .addCase(explorerActions.setExplorer, (state, action) => {
                const { symbol, explorer } = action.payload;

                state[symbol] = {
                    ...state[symbol],
                    custom: explorer,
                };
            })
            .addCase(extra.actionTypes.storageLoad, extra.reducers.storageLoadExplorer);
    },
);
