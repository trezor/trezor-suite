import { type Explorer, type NetworkSymbol } from '@suite-common/wallet-config';

import { type ExplorerItem, type ExplorerState } from './explorerReducer';

export const selectNetworkExplorers = (state: ExplorerState, symbol: NetworkSymbol): ExplorerItem =>
    state.wallet.explorer[symbol];

export const selectNetworkExplorerType = (state: ExplorerState, symbol: NetworkSymbol) =>
    state.wallet.explorer[symbol].custom ? 'custom' : 'default';

export const selectExplorer = (
    state: ExplorerState,
    symbol?: NetworkSymbol,
): Explorer | undefined => {
    if (!symbol) {
        return undefined;
    }

    const config = state.wallet.explorer[symbol];

    return config.custom ?? config.default;
};
