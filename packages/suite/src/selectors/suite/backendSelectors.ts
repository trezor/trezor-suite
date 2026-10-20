import { type NetworksRootState } from '@suite-common/networks';
import {
    type BlockchainRootState,
    blockchainInitialState,
    selectCustomBackends,
} from '@suite-common/wallet-core';

// every network, enabled or not: a disabled one would reconnect to its custom backend once enabled again
// regtest ships with a custom backend of its own, which is its default
export const selectResettableCustomBackendSymbols = (
    state: BlockchainRootState & NetworksRootState,
) =>
    selectCustomBackends(state)
        .map(({ symbol }) => symbol)
        .filter(
            symbol =>
                blockchainInitialState[symbol as keyof typeof blockchainInitialState].backends
                    .selected === undefined,
        );

export const selectHasCustomServers = (state: BlockchainRootState & NetworksRootState) =>
    selectResettableCustomBackendSymbols(state).length > 0;
