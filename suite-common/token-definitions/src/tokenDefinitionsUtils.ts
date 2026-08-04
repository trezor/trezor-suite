import {
    type NetworkSymbol,
    getCoingeckoId,
    getNetworkFeatures,
} from '@suite-common/wallet-config';
import { getContractAddressForNetworkSymbol } from '@suite-common/wallet-utils';
import { type TokenInfo } from '@trezor/connect';
import { isCodesignBuild } from '@trezor/env-utils';
import { isSafeObjectKey } from '@trezor/utils';

import {
    TOKEN_DEFINITIONS_PREFIX_URL,
    TOKEN_DEFINITIONS_SUFFIX_URL,
} from './tokenDefinitionsConstants';
import {
    DefinitionType,
    type SimpleTokenStructure,
    type TokenDefinitionsState,
    type TokenManagementAction,
    type TokenManagementStorage,
    type TokenStructureType,
} from './tokenDefinitionsTypes';

// Using Set greatly improves performance of this function because of O(1) complexity instead of O(n) for Array.includes
const tokenDefinitionsMap = new WeakMap<SimpleTokenStructure, Set<string>>();
export const isTokenDefinitionKnown = (
    tokenDefinitions: SimpleTokenStructure | undefined,
    symbol: NetworkSymbol,
    contractAddress: string,
) => {
    if (!tokenDefinitions) return false;

    // `tokenDefinitions` is typed as `string[]`, but it originates verbatim from an
    // unsigned data.trezor.io JSON fetch (getTokenDefinitionThunk stores the response with
    // no runtime shape validation). A compromised/buggy backend returning a non-array (e.g.
    // `{}`, a number or a bare string) would otherwise crash here — `new Set(nonIterable)`
    // throws, and a string key throws "Invalid value used as weak map key" in WeakMap.set.
    // Because this runs inside render-time Redux selectors with no ErrorBoundary, that throw
    // becomes a render crash across transaction/token lists. Drop the malformed definition.
    if (!Array.isArray(tokenDefinitions)) return false;

    if (!tokenDefinitionsMap.has(tokenDefinitions)) {
        tokenDefinitionsMap.set(tokenDefinitions, new Set(tokenDefinitions));
    }

    const contractAddressForNetwork = getContractAddressForNetworkSymbol(symbol, contractAddress);

    return tokenDefinitionsMap.get(tokenDefinitions)?.has(contractAddressForNetwork);
};

// The token definitions payload is typed as `string[]`, but it originates verbatim from an
// unsigned data.trezor.io JSON fetch (see `fetchTokenDefinitions`) with no runtime shape
// validation, so a compromised/MITM backend can return a non-array or an array containing
// non-string entries. Consumers deref it as a real `string[]` — e.g. `contract.split('-')`
// in suite-native `useInactiveStellarTokens`, which runs at render time with no ErrorBoundary
// — where a poison value throws a TypeError and crashes the consuming render/selector.
// Coerce to a genuine `string[]` at this single data boundary so the declared type holds.
export const sanitizeTokenDefinitions = (data: unknown): string[] =>
    Array.isArray(data) ? data.filter((item): item is string => typeof item === 'string') : [];

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
    const safeDefinitions = definitionKey.split('-').filter(isSafeObjectKey);

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

export const fetchTokenDefinitions = async (
    symbol: NetworkSymbol,
    type: DefinitionType,
    structure: TokenStructureType,
) => {
    const coingeckoId = getCoingeckoId(symbol);

    if (!coingeckoId) {
        throw Error('Cannot fetch token definitions for network without CoinGecko asset id!');
    }

    const env = isCodesignBuild() ? 'stable' : 'develop';

    const response = await fetch(
        `${TOKEN_DEFINITIONS_PREFIX_URL}/${env}/${coingeckoId}.${structure}.${type}.${TOKEN_DEFINITIONS_SUFFIX_URL}`,
    );

    if (!response.ok) {
        throw Error(response.statusText);
    }

    const data = await response.json();

    return data;
};
