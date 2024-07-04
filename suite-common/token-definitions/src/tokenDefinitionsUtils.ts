import { NetworkSymbol, getNetworkFeatures } from '@suite-common/wallet-config';
import { parseAsset } from '@trezor/blockchain-link-utils/src/blockfrost';

import {
    DefinitionType,
    SimpleTokenStructure,
    TokenDefinitionsState,
    TokenManagementAction,
    TokenManagementStorage,
} from './tokenDefinitionsTypes';

export const getContractAddressForNetwork = (
    networkSymbol: NetworkSymbol,
    contractAddress: string,
) => {
    switch (networkSymbol) {
        case 'sol':
        case 'dsol':
            return contractAddress;
        case 'ada':
        case 'tada':
            const { policyId } = parseAsset(contractAddress);

            return policyId.toLowerCase();
        default:
            return contractAddress.toLowerCase();
    }
};

export const isTokenDefinitionKnown = (
    tokenDefinitions: SimpleTokenStructure | undefined,
    networkSymbol: NetworkSymbol,
    contractAddress: string,
) =>
    Array.isArray(tokenDefinitions)
        ? tokenDefinitions?.includes(getContractAddressForNetwork(networkSymbol, contractAddress))
        : false;

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
