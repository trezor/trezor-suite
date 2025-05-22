import { Explorer, NetworkSymbol } from '@suite-common/wallet-config';

import { type ExplorerState } from './explorerReducer';

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
