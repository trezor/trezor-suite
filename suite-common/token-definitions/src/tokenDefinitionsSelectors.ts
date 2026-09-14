import { type NetworksRootState, selectNetworkConfigAccessors } from '@suite-common/networks';
import { returnStableArrayIfEmpty } from '@suite-common/redux-utils';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type TokenAddress } from '@suite-common/wallet-types';
import { type TokenInfo } from '@trezor/connect';

import type { TokenDefinitionsRootState, TokenDefinitionsState } from './tokenDefinitionsTypes';
import { isTokenDefinitionKnown } from './tokenDefinitionsUtils';

export const selectTokenDefinitions = (state: TokenDefinitionsRootState) => state.tokenDefinitions;

export const getSimpleCoinDefinitionsByNetwork = (
    state: TokenDefinitionsState,
    symbol: NetworkSymbol,
) => state[symbol]?.coin?.data;

export const selectNetworkTokenDefinitions = (
    state: TokenDefinitionsRootState,
    symbol: NetworkSymbol,
) => state.tokenDefinitions?.[symbol];

export const selectCoinDefinitions = (state: TokenDefinitionsRootState, symbol: NetworkSymbol) =>
    state.tokenDefinitions?.[symbol]?.coin;

export const selectNftDefinitions = (state: TokenDefinitionsRootState, symbol: NetworkSymbol) =>
    state.tokenDefinitions?.[symbol]?.nft;

export const selectCoinDefinition = (
    state: TokenDefinitionsRootState & NetworksRootState,
    symbol: NetworkSymbol,
    contractAddress: TokenAddress,
) => {
    const networkConfigDeps = selectNetworkConfigAccessors(state);

    const coinDefinitions = state.tokenDefinitions?.[symbol]?.coin?.data;
    const isKnown = isTokenDefinitionKnown(
        networkConfigDeps,
        coinDefinitions,
        symbol,
        contractAddress,
    );

    return isKnown;
};

export const selectIsSpecificCoinDefinitionKnown = (
    state: TokenDefinitionsRootState & NetworksRootState,
    symbol: NetworkSymbol,
    contractAddress: TokenAddress,
) => !!selectCoinDefinition(state, symbol, contractAddress);

export const selectFilterKnownTokens = (
    state: TokenDefinitionsRootState & NetworksRootState,
    symbol: NetworkSymbol,
    tokens: TokenInfo[],
) =>
    returnStableArrayIfEmpty(
        tokens.filter(token => selectCoinDefinition(state, symbol, token.contract as TokenAddress)),
    );
