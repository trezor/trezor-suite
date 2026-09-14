import { type NetworkMetadata, networksActions } from '@suite-common/networks';
import {
    type ActionTypesDep,
    type ReducersDep,
    createReducerWithExtraDeps,
} from '@suite-common/redux-utils';
import {
    type Explorer,
    type NetworkSymbol,
    getParsedExplorerUrls,
} from '@suite-common/wallet-config';
import { typedObjectKeys } from '@trezor/utils';

import { explorerActions } from './explorerActions';

export type ExplorerItem = {
    default: Explorer;
    custom?: Explorer;
};

export type ExplorerConfig = Record<NetworkSymbol, ExplorerItem>;
export type ExplorerState = { wallet: { explorer: ExplorerConfig } };

export const createExplorerInitialState = (
    networkConfigs: readonly NetworkMetadata[],
): ExplorerConfig =>
    Object.fromEntries(
        networkConfigs.map(network => [
            network.symbol,
            {
                default: getParsedExplorerUrls(network.explorer),
                custom: undefined,
            },
        ]),
    ) as ExplorerConfig;

export const explorerInitialState = {} as ExplorerConfig;

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
            .addCase(networksActions.setNetworks, (state, action) => {
                const initialNetworks = createExplorerInitialState(action.payload);
                action.payload.forEach(network => {
                    state[network.symbol] = {
                        ...state[network.symbol],
                        default: initialNetworks[network.symbol].default,
                    };
                });
            })
            .addCase(explorerActions.setExplorer, (state, action) => {
                const { symbol, explorer } = action.payload;
                const defaultExplorer = state[symbol].default;
                const normalizedExplorer = explorer && normalizeExplorer(explorer);
                const isDefaultExplorer = typedObjectKeys(defaultExplorer).every(
                    key => normalizedExplorer?.[key] === defaultExplorer[key],
                );

                state[symbol].custom = !isDefaultExplorer ? normalizedExplorer : undefined;
            })
            .addCase(extra.actionTypes.storageLoad, extra.reducers.storageLoadExplorer);
    },
);
