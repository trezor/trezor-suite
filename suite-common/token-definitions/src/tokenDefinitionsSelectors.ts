import { A, F, G, pipe } from '@mobily/ts-belt';

import { NetworkSymbol } from '@suite-common/wallet-config';
import { TokenInfo } from '@trezor/connect';
import { Account, TokenAddress } from '@suite-common/wallet-types';

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
    state: TokenDefinitionsRootState,
    networkSymbol: NetworkSymbol,
    contractAddress: TokenAddress,
) =>
    isTokenDefinitionKnown(
        state.tokenDefinitions?.[networkSymbol]?.coin?.data,
        networkSymbol,
        contractAddress,
    );

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

export const selectValidTokensByDeviceStateAndNetworkSymbol = (
    state: TokenDefinitionsRootState,
    accounts: Account[],
    networkSymbol: NetworkSymbol,
): TokenInfo[] => {
    return pipe(
        accounts,
        A.map(account => account.tokens),
        A.flat,
        A.uniq,
        A.filter(
            token =>
                G.isNotNullable(token) &&
                selectIsSpecificCoinDefinitionKnown(
                    state,
                    networkSymbol,
                    token.contract as TokenAddress,
                ),
        ),
        F.toMutable,
    );
};
