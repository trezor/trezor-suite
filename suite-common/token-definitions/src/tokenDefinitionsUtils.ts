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
) => tokens.filter(token => isTokenDefinitionKnown(tokenDefinitions, symbol, token.contract));

export const getSupportedDefinitionTypes = (symbol: NetworkSymbol) => {
    const isCoinDefinitionsEnabled = getNetworkFeatures(symbol).includes('coin-definitions');
    const isNftDefinitionsEnabled = getNetworkFeatures(symbol).includes('nft-definitions');

    return [
        ...(isCoinDefinitionsEnabled ? [DefinitionType.COIN] : []),
        ...(isNftDefinitionsEnabled ? [DefinitionType.NFT] : []),
    ];
};

type TokenDefinitionsParameters = [NetworkSymbol, DefinitionType, TokenManagementAction];

const getSafeDefinitionParameters = (
    definitionKey: string,
): TokenDefinitionsParameters | undefined => {
    const safeDefinitions = definitionKey
        .split('-')
        .filter(
            definitionPart => !['__proto__', 'constructor', 'prototype'].includes(definitionPart),
        );

    if (safeDefinitions.length !== 3) return undefined;

    return [
        safeDefinitions[0],
        safeDefinitions[1],
        safeDefinitions[2],
    ] as TokenDefinitionsParameters;
};

export const buildTokenDefinitionsFromStorage = (
    storageTokenDefinitions: TokenManagementStorage[],
): TokenDefinitionsState => {
    const tokenDefinitions: TokenDefinitionsState = {};

    for (const definition of storageTokenDefinitions) {
        const definitionParameters = getSafeDefinitionParameters(definition.key);

        if (!definitionParameters) continue;

        const [symbol, type, action] = definitionParameters;

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
