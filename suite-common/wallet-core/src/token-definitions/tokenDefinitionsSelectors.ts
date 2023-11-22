import { NetworkSymbol } from '@suite-common/wallet-config';

import { TokenDefinitionsRootState } from './tokenDefinitionsTypes';

export const selectTokenDefinitions = (
    state: TokenDefinitionsRootState,
    networkSymbol: NetworkSymbol,
) => state.wallet.tokenDefinitions?.[networkSymbol] || {};

export const selectSpecificTokenDefinition = (
    state: TokenDefinitionsRootState,
    networkSymbol: NetworkSymbol,
    contractAddress: string,
) => state.wallet.tokenDefinitions?.[networkSymbol]?.[contractAddress];
