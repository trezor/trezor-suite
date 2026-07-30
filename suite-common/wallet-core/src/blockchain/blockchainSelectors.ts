import { type BackendType, type NetworkSymbol } from '@suite-common/wallet-config';
import { getBlockchain } from '@suite-common/wallet-utils';

import { type BlockchainRootState } from './blockchainReducer';

export const selectIsElectrumBackendSelected = (
    state: BlockchainRootState,
    symbol: NetworkSymbol,
): boolean => getBlockchain(state.wallet.blockchain, symbol).backends.selected === 'electrum';

export const selectActiveBackendType = (
    state: BlockchainRootState,
    symbol: NetworkSymbol,
): BackendType | undefined => getBlockchain(state.wallet.blockchain, symbol).backends.selected;
