import { type LegacyNetworkSymbol } from '@suite-common/legacy-network-config';
import { buildCustomEvmNetworkConfig } from '@suite-common/networks';
import {
    type Explorer,
    getParsedExplorerUrls,
    networksCollection,
} from '@suite-common/wallet-config';
import { type CustomEvmNetworkDefinition } from '@suite-common/wallet-types';
import {
    type ActionTypesDep,
    type ReducersDep,
    createReducerWithExtraDeps,
} from '@trezor/redux-utils';
import { typedObjectKeys } from '@trezor/utils';

import { explorerActions } from './explorerActions';
import { customEvmNetworksActions } from '../customNetworks/customEvmNetworksActions';

export type ExplorerItem = {
    default: Explorer;
    custom?: Explorer;
};

export type ExplorerConfig = Record<LegacyNetworkSymbol, ExplorerItem>;
export type ExplorerState = { wallet: { explorer: ExplorerConfig } };

const initialStatePredefined: Partial<ExplorerConfig> = {};

export const explorerInitialState: ExplorerConfig = networksCollection.reduce((state, network) => {
    state[network.symbol as LegacyNetworkSymbol] = {
        default: getParsedExplorerUrls(network.explorer),
        custom: undefined,
    };

    return state;
}, initialStatePredefined as ExplorerConfig);

export const addCustomEvmNetworkExplorer = (
    state: ExplorerConfig,
    definition: CustomEvmNetworkDefinition,
) => {
    const symbol = definition.symbol as LegacyNetworkSymbol;

    state[symbol] ??= {
        default: getParsedExplorerUrls(buildCustomEvmNetworkConfig(definition).explorer),
        custom: undefined,
    };
};

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
                const defaultExplorer = state[symbol as LegacyNetworkSymbol].default;
                const normalizedExplorer = explorer && normalizeExplorer(explorer);
                const isDefaultExplorer = typedObjectKeys(defaultExplorer).every(
                    key => normalizedExplorer?.[key] === defaultExplorer[key],
                );

                state[symbol as LegacyNetworkSymbol].custom = !isDefaultExplorer
                    ? normalizedExplorer
                    : undefined;
            })
            .addCase(customEvmNetworksActions.registered, (state, action) => {
                addCustomEvmNetworkExplorer(state, action.payload.definition);
            })
            .addCase(customEvmNetworksActions.unregistered, (state, action) => {
                delete state[action.payload.symbol as LegacyNetworkSymbol];
            })
            .addCase(extra.actionTypes.storageLoad, extra.reducers.storageLoadExplorer);
    },
);
