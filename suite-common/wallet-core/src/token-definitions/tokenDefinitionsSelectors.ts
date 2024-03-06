import { D, pipe } from '@mobily/ts-belt';

import { NetworkSymbol, isEthereumBasedNetwork, networks } from '@suite-common/wallet-config';
import { isTokenDefinitionKnown } from '@suite-common/token-definitions';

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

export const selectShouldFetchTokenDefinition = (
    state: TokenDefinitionsRootState,
    networkSymbol: NetworkSymbol,
    contractAddress: string,
) => {
    const tokenDefinition = selectSpecificTokenDefinition(state, networkSymbol, contractAddress);
    const network = networks[networkSymbol];

    return isEthereumBasedNetwork(network) && (!tokenDefinition || tokenDefinition.error);
};

export const selectKnownNetworkTokens = (
    state: TokenDefinitionsRootState,
    networkSymbol: NetworkSymbol,
) => {
    const networkTokenDefinitions = selectTokenDefinitions(state, networkSymbol);

    return pipe(
        networkTokenDefinitions,
        D.filter(tokenDefinition => !!tokenDefinition.isTokenKnown),
        D.keys,
    );
};
