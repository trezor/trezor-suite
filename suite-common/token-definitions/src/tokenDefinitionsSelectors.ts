import { getUntracked } from 'proxy-memoize';

import { NetworkSymbol } from '@suite-common/wallet-config';
import { TokenAddress } from '@suite-common/wallet-types';
import { TokenInfo } from '@trezor/connect';

import { TokenDefinitionsRootState } from './tokenDefinitionsTypes';
import { isTokenDefinitionKnown } from './tokenDefinitionsUtils';

export const selectNetworkTokenDefinitions = (
    state: TokenDefinitionsRootState,
    networkSymbol: NetworkSymbol,
) => state.tokenDefinitions?.[networkSymbol];

export const selectCoinDefinitions = (
    state: TokenDefinitionsRootState,
    networkSymbol: NetworkSymbol,
) => state.tokenDefinitions?.[networkSymbol]?.coin;

export const selectNftDefinitions = (
    state: TokenDefinitionsRootState,
    networkSymbol: NetworkSymbol,
) => state.tokenDefinitions?.[networkSymbol]?.nft;

export const selectCoinDefinition = (
    stateTracked: TokenDefinitionsRootState,
    networkSymbol: NetworkSymbol,
    contractAddress: TokenAddress,
) => {
    // We need to use getUntracked here otherwise this could interfere with memoization in isTokenDefinitionKnown
    const state = getUntracked(stateTracked) ?? stateTracked;

    const coinDefinitions = state.tokenDefinitions?.[networkSymbol]?.coin?.data;
    const isKnown = isTokenDefinitionKnown(coinDefinitions, networkSymbol, contractAddress);

    return isKnown;
};

export const selectIsSpecificCoinDefinitionKnown = (
    state: TokenDefinitionsRootState,
    networkSymbol: NetworkSymbol,
    contractAddress: TokenAddress,
) => !!selectCoinDefinition(state, networkSymbol, contractAddress);

export const selectFilterKnownTokens = (
    state: TokenDefinitionsRootState,
    networkSymbol: NetworkSymbol,
    tokens: TokenInfo[],
) => {
    return tokens.filter(token =>
        selectCoinDefinition(state, networkSymbol, token.contract as TokenAddress),
    );
};
