import { NetworkSymbol, getNetworkFeatures } from '@suite-common/wallet-config';
import { getContractAddressForNetwork } from '@suite-common/wallet-utils';

import {
    DefinitionType,
    SimpleTokenStructure,
    TokenDefinitionsState,
    TokenManagementAction,
    TokenManagementStorage,
} from './tokenDefinitionsTypes';

// Using Set greatly improves performance of this function because of O(1) complexity instead of O(n) for Array.includes
const tokenDefinitionsMap = new WeakMap<SimpleTokenStructure, Set<string>>();
export const isTokenDefinitionKnown = (
    tokenDefinitions: SimpleTokenStructure | undefined,
    networkSymbol: NetworkSymbol,
    contractAddress: string,
) => {
    if (!tokenDefinitions) return false;

    if (!tokenDefinitionsMap.has(tokenDefinitions)) {
        tokenDefinitionsMap.set(tokenDefinitions, new Set(tokenDefinitions));
    }

    const contractAddressForNetwork = getContractAddressForNetwork(networkSymbol, contractAddress);

    return tokenDefinitionsMap.get(tokenDefinitions)?.has(contractAddressForNetwork);
};

export const getSupportedDefinitionTypes = (networkSymbol: NetworkSymbol) => {
    const isCoinDefinitionsEnabled = getNetworkFeatures(networkSymbol).includes('coin-definitions');
    const isNftDefinitionsEnabled = getNetworkFeatures(networkSymbol).includes('nft-definitions');

    return [
        ...(isCoinDefinitionsEnabled ? [DefinitionType.COIN] : []),
        ...(isNftDefinitionsEnabled ? [DefinitionType.NFT] : []),
    ];
};

export const buildTokenDefinitionsFromStorage = (
    storageTokenDefinitions: TokenManagementStorage[],
): TokenDefinitionsState => {
    const tokenDefinitions: TokenDefinitionsState = {};

    for (const definition of storageTokenDefinitions) {
        const [network, type, action] = definition.key.split('-');
        const networkTokenDefinition = tokenDefinitions[network as NetworkSymbol];

        if (!networkTokenDefinition) {
            tokenDefinitions[network as NetworkSymbol] = {
                coin: { error: false, data: undefined, isLoading: false, hide: [], show: [] },
                nft: { error: false, data: undefined, isLoading: false, hide: [], show: [] },
            };
        }

        const networkTokenDefinitionType =
            tokenDefinitions[network as NetworkSymbol]?.[type as DefinitionType];

        if (networkTokenDefinitionType) {
            networkTokenDefinitionType[action as TokenManagementAction] = definition.value;
        }
    }

    return tokenDefinitions;
};
