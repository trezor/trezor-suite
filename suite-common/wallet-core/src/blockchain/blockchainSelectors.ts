import { type BackendType, type NetworkSymbol } from '@suite-common/wallet-config';

import { type BlockchainRootState } from './blockchainReducer';

export const selectIsElectrumBackendSelected = (
    state: BlockchainRootState,
    symbol: NetworkSymbol,
): boolean => state.wallet.blockchain[symbol].backends.selected === 'electrum';

export const selectActiveBackendType = (
    state: BlockchainRootState,
    symbol: NetworkSymbol,
): BackendType | undefined => state.wallet.blockchain[symbol].backends.selected;

/**
 * The backend the worker reported for the network — a custom one if the user set it, the coin's
 * default otherwise; `undefined` until the first connection.
 */
export const selectBlockchainUrl = (
    state: BlockchainRootState,
    symbol: NetworkSymbol,
): string | undefined => state.wallet.blockchain[symbol].url;
