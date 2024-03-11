import { NetworkSymbol } from '@suite-common/wallet-config';

import { BlockchainRootState } from './blockchainReducer';

export const selectIsElectrumBackendSelected = (
    state: BlockchainRootState,
    networkSymbol: NetworkSymbol,
): boolean => state.wallet.blockchain[networkSymbol].backends.selected === 'electrum';
