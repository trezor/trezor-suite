import { type LegacyNetworkSymbol } from '@suite-common/legacy-network-config';
import { type BackendType, type NetworkSymbol, getNetwork } from '@suite-common/wallet-config';

import { type BlockchainRootState } from './blockchainReducer';

export const selectIsElectrumBackendSelected = (
    state: BlockchainRootState,
    symbol: NetworkSymbol,
): boolean =>
    state.wallet.blockchain[symbol as LegacyNetworkSymbol].backends.selected === 'electrum';

export const selectActiveBackendType = (
    state: BlockchainRootState,
    symbol: NetworkSymbol,
): BackendType | undefined =>
    state.wallet.blockchain[symbol as LegacyNetworkSymbol].backends.selected;

/** The type of the backend the network is read from: the custom one, else the network's default. */
export const selectEffectiveBackendType = (
    state: BlockchainRootState,
    symbol: NetworkSymbol,
): BackendType | undefined =>
    selectActiveBackendType(state, symbol) ?? getNetwork(symbol).backendOptions[0]?.type;

/** The backend URL the worker reported; `undefined` before the first connection. */
export const selectBlockchainUrl = (
    state: BlockchainRootState,
    symbol: NetworkSymbol,
): string | undefined => state.wallet.blockchain[symbol as LegacyNetworkSymbol].url;
