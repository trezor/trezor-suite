import { type NetworkSymbol } from '@suite-common/wallet-config';

import { type BlockchainRootState } from './blockchainReducer';

export const selectIsElectrumBackendSelected = (
    state: BlockchainRootState,
    symbol: NetworkSymbol,
): boolean => state.wallet.blockchain[symbol].backends.selected === 'electrum';
