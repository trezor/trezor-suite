import { NetworkSymbol } from '@suite-common/wallet-config';
import { isTokenDefinitionKnown } from '@suite-common/token-definitions';
import { TokenInfo } from '@trezor/connect';

import { TokenDefinitionsRootState } from './tokenDefinitionsTypes';

export const selectNetworkTokenDefinitions = (
    state: TokenDefinitionsRootState,
    networkSymbol: NetworkSymbol,
) => state.wallet.tokenDefinitions?.[networkSymbol];

export const selectCoinDefinitions = (
    state: TokenDefinitionsRootState,
    networkSymbol: NetworkSymbol,
) => state.wallet.tokenDefinitions?.[networkSymbol]?.coin;

export const selectNftDefinitions = (
    state: TokenDefinitionsRootState,
    networkSymbol: NetworkSymbol,
) => state.wallet.tokenDefinitions?.[networkSymbol]?.nft;

export const selectCoinDefinition = (
    state: TokenDefinitionsRootState,
    networkSymbol: NetworkSymbol,
    contractAddress: string,
) =>
    isTokenDefinitionKnown(
        state.wallet.tokenDefinitions?.[networkSymbol]?.coin?.data,
        networkSymbol,
        contractAddress,
    );

export const selectIsSpecificCoinDefinitionKnown = (
    state: TokenDefinitionsRootState,
    networkSymbol: NetworkSymbol,
    contractAddress: string,
) => !!selectCoinDefinition(state, networkSymbol, contractAddress);

export const selectFilterKnownTokens = (
    state: TokenDefinitionsRootState,
    networkSymbol: NetworkSymbol,
    tokens: TokenInfo[],
) => {
    return tokens.filter(token => selectCoinDefinition(state, networkSymbol, token.contract));
};
