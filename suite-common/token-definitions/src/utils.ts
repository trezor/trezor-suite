import { NetworkSymbol, getNetworkFeatures } from '@suite-common/wallet-config';

import { DefinitionType, SimpleTokenStructure } from './types';

export const caseContractAddressForNetwork = (
    networkSymbol: NetworkSymbol,
    contractAddress: string,
) => (networkSymbol === 'sol' ? contractAddress : contractAddress.toLowerCase());

export const isTokenDefinitionKnown = (
    tokenDefinitions: SimpleTokenStructure | undefined,
    networkSymbol: NetworkSymbol,
    contractAddress: string,
) =>
    Array.isArray(tokenDefinitions)
        ? tokenDefinitions?.includes(caseContractAddressForNetwork(networkSymbol, contractAddress))
        : false;

export const getSupportedDefinitionTypes = (networkSymbol: NetworkSymbol) => {
    const isCoinDefinitionsEnabled = getNetworkFeatures(networkSymbol).includes('coin-definitions');
    const isNftDefinitionsEnabled = getNetworkFeatures(networkSymbol).includes('nft-definitions');

    return [
        ...(isCoinDefinitionsEnabled ? [DefinitionType.COIN] : []),
        ...(isNftDefinitionsEnabled ? [DefinitionType.NFT] : []),
    ];
};
