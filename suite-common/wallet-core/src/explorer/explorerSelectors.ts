import { type Explorer, type NetworkSymbol } from '@suite-common/wallet-config';

import { type ExplorerItem, type ExplorerState, getExplorer } from './explorerReducer';

export const selectNetworkExplorers = (state: ExplorerState, symbol: NetworkSymbol): ExplorerItem =>
    getExplorer(state.wallet.explorer, symbol);

export const selectNetworkExplorerType = (state: ExplorerState, symbol: NetworkSymbol) =>
    selectNetworkExplorers(state, symbol).custom ? 'custom' : 'default';

export const selectExplorer = (
    state: ExplorerState,
    symbol?: NetworkSymbol,
): Explorer | undefined => {
    if (!symbol) {
        return undefined;
    }

    const config = getExplorer(state.wallet.explorer, symbol);

    return config.custom ?? config.default;
};
