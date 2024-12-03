import { NetworkSymbol, getNetworkFeatures } from '@suite-common/wallet-config';
import { getContractAddressForNetworkSymbol } from '@suite-common/wallet-utils';
import { TokenInfo } from '@trezor/connect';

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
    symbol: NetworkSymbol,
    contractAddress: string,
) => {
    if (!tokenDefinitions) return false;

    if (!tokenDefinitionsMap.has(tokenDefinitions)) {
        tokenDefinitionsMap.set(tokenDefinitions, new Set(tokenDefinitions));
    }

    const contractAddressForNetwork = getContractAddressForNetworkSymbol(symbol, contractAddress);

    return tokenDefinitionsMap.get(tokenDefinitions)?.has(contractAddressForNetwork);
};

export const filterKnownTokens = (
    tokenDefinitions: SimpleTokenStructure | undefined,
    symbol: NetworkSymbol,
    tokens: TokenInfo[],
) => {
    return tokens.filter(token => isTokenDefinitionKnown(tokenDefinitions, symbol, token.contract));
};

export const getSupportedDefinitionTypes = (symbol: NetworkSymbol) => {
    const isCoinDefinitionsEnabled = getNetworkFeatures(symbol).includes('coin-definitions');
    const isNftDefinitionsEnabled = getNetworkFeatures(symbol).includes('nft-definitions');

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
        const [symbol, type, action] = definition.key.split('-') as [
            NetworkSymbol,
            DefinitionType,
            TokenManagementAction,
        ];
        const networkTokenDefinition = tokenDefinitions[symbol];

        if (!networkTokenDefinition) {
            tokenDefinitions[symbol] = {
                coin: { error: false, data: undefined, isLoading: false, hide: [], show: [] },
                nft: { error: false, data: undefined, isLoading: false, hide: [], show: [] },
            };
        }

        const networkTokenDefinitionType = tokenDefinitions[symbol]?.[type];

        if (networkTokenDefinitionType) {
            networkTokenDefinitionType[action] = definition.value;
        }
    }

    return tokenDefinitions;
};
