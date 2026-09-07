import { type TokenDtoV2 } from '@suite-common/earn-stablecoin-defs';
import { getNetworkServices } from '@suite-common/networks';
import { exhaustive } from '@trezor/type-utils';

import { getNetwork, getSupportedNetworks } from './networksConfig';
import {
    type AccountType,
    type Network,
    type NetworkDisplaySymbol,
    type NetworkFeature,
    type NetworkSymbol,
    type NetworkSymbolExtended,
    type NetworkType,
} from './types';

export const NORMAL_ACCOUNT_TYPE = 'normal' satisfies AccountType;

export const getNetworksCollection = (): Network[] => getSupportedNetworks().map(getNetwork);

interface GetMainnetsProps {
    debug?: boolean;
    useExperimentalNetworks?: boolean;
    allNetworks?: Network[];
}

export const getMainnets = ({
    debug = false,
    useExperimentalNetworks = false,
    allNetworks = getNetworksCollection(),
}: GetMainnetsProps = {}): Network[] =>
    allNetworks.filter(
        n =>
            !n.testnet &&
            (!n.isDebugOnlyNetwork || debug) &&
            (!n.isExperimentalOnlyNetwork || useExperimentalNetworks),
    );

interface GetTestnetsProps {
    debug?: boolean;
    useExperimentalNetworks?: boolean;
    useTestnetNetworks?: boolean;
    allNetworks?: Network[];
}

export const getTestnets = ({
    debug = false,
    useExperimentalNetworks = false,
    useTestnetNetworks = false,
    allNetworks = getNetworksCollection(),
}: GetTestnetsProps): Network[] =>
    allNetworks.filter(
        n =>
            n.testnet &&
            useTestnetNetworks &&
            (!n.isDebugOnlyNetwork || debug) &&
            (!n.isExperimentalOnlyNetwork || useExperimentalNetworks),
    );

export const getTestnetSymbols = (): NetworkSymbol[] =>
    getTestnets({ useTestnetNetworks: true }).map(n => n.symbol);

export const filterNetworksByName = (someNetworks: Network[], searchQuery: string): Network[] => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    if (!normalizedQuery) {
        return someNetworks;
    }

    return someNetworks.filter(
        ({ symbol, name }) =>
            symbol.includes(normalizedQuery) || name.toLowerCase().includes(normalizedQuery),
    );
};

export const isNetworkSymbol = (symbol: NetworkSymbolExtended): symbol is NetworkSymbol =>
    getNetworkServices().isSupportedNetwork(symbol);

/**
 * Use instead of getNetwork, if there is not a guarantee that the symbol is a valid network symbol.
 * @param symbol
 */
export const getNetworkOptional = (symbol?: string): Network | undefined =>
    symbol && isNetworkSymbol(symbol) ? getNetwork(symbol) : undefined;

export const isBlockbookBasedNetwork = (symbol: NetworkSymbol) =>
    getNetworkOptional(symbol)?.backendOptions.some(option => option.type === 'blockbook');

export const isNetworkUsingExternalBackend = (symbol: NetworkSymbol) =>
    !!getNetworkOptional(symbol)?.backendOptions.some(
        option => 'isExternalBackend' in option && option.isExternalBackend,
    );

export const getNetworkType = (symbol: NetworkSymbol): NetworkType =>
    getNetwork(symbol)?.networkType;

export const isAccountBasedNetwork = (symbol: NetworkSymbol) => {
    const networkType = getNetworkType(symbol);
    switch (networkType) {
        case 'ethereum':
        case 'ripple':
        case 'solana':
        case 'stellar':
        case 'tron':
            return true;

        case 'bitcoin':
        case 'cardano':
            return false;

        default:
            return exhaustive(networkType);
    }
};

// Takes into account just network features, not features for specific accountTypes.
export const getNetworkFeatures = (symbol: NetworkSymbol): NetworkFeature[] =>
    getNetwork(symbol)?.features;

export const getCoingeckoId = (symbol: NetworkSymbol): string | undefined =>
    getNetwork(symbol).coingeckoId;

export const isAccountOfNetwork = (
    network: Network,
    accountType: string,
): accountType is AccountType =>
    Object.prototype.hasOwnProperty.call(network.accountTypes, accountType) ||
    accountType === 'normal';

// Account types with an index-less path template (root path) have exactly one account.
export const isSingleAccountType = (network: Network, accountType: string) => {
    const bip43Path = isAccountOfNetwork(network, accountType)
        ? network.accountTypes[accountType]?.bip43Path
        : undefined;

    return !(bip43Path ?? network.bip43Path).includes('i');
};

export const getNetworkByCoingeckoId = (coingeckoId: string): Network | undefined =>
    getNetworksCollection().find(n => n.coingeckoId === coingeckoId);

export const getNetworkByTradeCryptoId = (tradeCryptoId: string): Network | undefined =>
    getNetworksCollection().find(n => n.tradeCryptoId === tradeCryptoId);

export const getNetworkByEvmChainId = (chainId: number): Network | undefined =>
    getNetworksCollection().find(n => n.chainId === chainId);

export const getNetworkDisplaySymbol = (symbol: NetworkSymbol): NetworkDisplaySymbol =>
    getNetwork(symbol).displaySymbol;

export const getDisplaySymbol = (coinSymbol: string, contractAddress?: string | null) => {
    const MAX_SYMBOL_LENGTH = 10;
    const isTokenSymbolLong = coinSymbol.length > MAX_SYMBOL_LENGTH;

    const symbol = coinSymbol.toLowerCase();

    // TODO: L2 networks - Base, Arbitrum, Optimism native tokens
    if (isNetworkSymbol(symbol) && !contractAddress) {
        return getNetworkDisplaySymbol(symbol);
    }

    return isTokenSymbolLong ? `${coinSymbol.slice(0, MAX_SYMBOL_LENGTH)}...` : coinSymbol;
};

export const getNetworkDisplaySymbolName = (symbol: NetworkSymbol): string => {
    const network = getNetwork(symbol);

    return network.displaySymbolName || network.name;
};

export const getNetworkDecimals = (symbol: NetworkSymbolExtended): number | undefined => {
    const lowerCasedSymbol = symbol.toLowerCase();
    if (isNetworkSymbol(lowerCasedSymbol)) {
        return getNetwork(lowerCasedSymbol).decimals;
    }

    return undefined;
};

export const getNetworkByYieldXyzId = (yieldXyzId: TokenDtoV2['network']): Network | null =>
    getNetworksCollection().find(n => n.yieldXyzId === yieldXyzId) ?? null;

const formatNetworksAsString = (someNetworks: Network[]): string =>
    someNetworks.map(network => network.name).join(', ');

export const getNetworksWithMevProtection = (): string =>
    formatNetworksAsString(
        getNetworksCollection().filter(network => network.features.includes('mev-protection')),
    );

export const getNetworksWithNativeTokenReserve = (): string =>
    formatNetworksAsString(getNetworksCollection().filter(network => !!network.nativeTokenReserve));
