import { D, pipe } from '@mobily/ts-belt';

import { NetworkSymbol, isEthereumBasedNetwork, networks } from '@suite-common/wallet-config';

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
