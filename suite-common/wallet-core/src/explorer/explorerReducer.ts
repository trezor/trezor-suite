import {
    type ActionTypesDep,
    type ReducersDep,
    createReducerWithExtraDeps,
} from '@suite-common/redux-utils';
import {
    type Explorer,
    type NetworkSymbol,
    getParsedExplorerUrls,
    networksCollection,
} from '@suite-common/wallet-config';
import { typedObjectKeys } from '@trezor/utils';

import { explorerActions } from './explorerActions';

export type ExplorerItem = {
    default: Explorer;
    custom?: Explorer;
};

export type ExplorerConfig = Record<NetworkSymbol, ExplorerItem>;
export type ExplorerState = { wallet: { explorer: ExplorerConfig } };

export const getExplorer = (explorers: ExplorerConfig, symbol: NetworkSymbol): ExplorerItem => {
    const explorer = explorers[symbol];

    if (explorer === undefined) {
        throw new Error(`Explorer state not found: ${symbol}`);
    }

    return explorer;
};

const initialStatePredefined: Partial<ExplorerConfig> = {};

export const explorerInitialState: ExplorerConfig = networksCollection.reduce((state, network) => {
    state[network.symbol] = {
        default: getParsedExplorerUrls(network.explorer),
        custom: undefined,
    };

    return state;
}, initialStatePredefined as ExplorerConfig);

const normalizeExplorer = (explorer: Explorer) => {
    typedObjectKeys(explorer).forEach(key => {
        if (explorer[key]) {
            explorer[key] = explorer[key].replace(/^\/+|\/+$/g, '').trim();
        }
    });

    return explorer;
};

export type ExplorerReducerDeps = ActionTypesDep<'storageLoad'> &
    ReducersDep<'storageLoadExplorer'>;

export const prepareExplorerReducer = createReducerWithExtraDeps(
    explorerInitialState,
    (builder, extra: ExplorerReducerDeps) => {
        builder
            .addCase(explorerActions.setExplorer, (state, action) => {
                const { symbol, explorer } = action.payload;
                const currentExplorer = getExplorer(state, symbol);
                const defaultExplorer = currentExplorer.default;
                const normalizedExplorer = explorer && normalizeExplorer(explorer);
                const isDefaultExplorer = typedObjectKeys(defaultExplorer).every(
                    key => normalizedExplorer?.[key] === defaultExplorer[key],
                );

                currentExplorer.custom = !isDefaultExplorer ? normalizedExplorer : undefined;
            })
            .addCase(extra.actionTypes.storageLoad, extra.reducers.storageLoadExplorer);
    },
);
