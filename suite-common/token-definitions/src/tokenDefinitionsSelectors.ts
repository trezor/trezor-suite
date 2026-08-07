import type { GetNetworkConfigDep } from '@suite-common/networks';
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
    state: TokenDefinitionsRootState,
    symbol: NetworkSymbol,
    contractAddress: TokenAddress,
    deps: GetNetworkConfigDep,
) => {
    const coinDefinitions = state.tokenDefinitions?.[symbol]?.coin?.data;
    const isKnown = isTokenDefinitionKnown(deps, coinDefinitions, symbol, contractAddress);

    return isKnown;
};

export const selectIsSpecificCoinDefinitionKnown = (
    state: TokenDefinitionsRootState,
    symbol: NetworkSymbol,
    contractAddress: TokenAddress,
    deps: GetNetworkConfigDep,
) => !!selectCoinDefinition(state, symbol, contractAddress, deps);

export const selectFilterKnownTokens = (
    state: TokenDefinitionsRootState,
    symbol: NetworkSymbol,
    tokens: TokenInfo[],
    deps: GetNetworkConfigDep,
) =>
    returnStableArrayIfEmpty(
        tokens.filter(token =>
            selectCoinDefinition(state, symbol, token.contract as TokenAddress, deps),
        ),
    );
