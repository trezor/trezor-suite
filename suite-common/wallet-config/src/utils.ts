import { type NetworkDtoId } from '@suite-common/earn-stablecoin-api';
import { exhaustive } from '@trezor/type-utils';

import { networks } from './networksConfig';
import {
    type AccountType,
    type Network,
    type NetworkFeature,
    type NetworkSymbol,
    type NetworkSymbolExtended,
} from './types';

export const NORMAL_ACCOUNT_TYPE = 'normal' satisfies AccountType;

/**
 * array from `networks` as a `Network[]` type instead of inferred type
 */
export const networksCollection: Network[] = Object.values(networks);

/**
 * array of network symbols
 */
export const networkSymbolCollection = networksCollection.map(n => n.symbol);

interface GetMainnetsProps {
    debug?: boolean;
    useExperimentalNetworks?: boolean;
    includeTron?: boolean;
    allNetworks?: Network[];
}

export const getMainnets = ({
    debug = false,
    useExperimentalNetworks = false,
    includeTron = false,
    allNetworks = networksCollection,
}: GetMainnetsProps = {}) =>
    allNetworks.filter(
        n =>
            !n.testnet &&
            (!n.isDebugOnlyNetwork || debug) &&
            (!n.isExperimentalOnlyNetwork || useExperimentalNetworks) &&
            (n.symbol !== 'trx' || includeTron),
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
    allNetworks = networksCollection,
}: GetTestnetsProps) =>
    allNetworks.filter(
        n =>
            n.testnet &&
            useTestnetNetworks &&
            (!n.isDebugOnlyNetwork || debug) &&
            (!n.isExperimentalOnlyNetwork || useExperimentalNetworks),
    );

export const getTestnetSymbols = () => getTestnets({ useTestnetNetworks: true }).map(n => n.symbol);

export const isBlockbookBasedNetwork = (symbol: NetworkSymbol) =>
    networks[symbol]?.backendTypes.some(backend => backend === 'blockbook');

// TODO: move to networksConfig
export const externalBackendTypeNetworks: NetworkSymbol[] = [
    'bsc',
    'pol',
    'op',
    'arb',
    'base',
    'avax',
];

export const isTrezorInfraBasedNetwork = (symbol: NetworkSymbol) =>
    // https://github.com/trezor/trezor-suite/issues/18843
    networks[symbol]?.backendTypes.some(
        backend =>
            ['blockbook', 'stellar'].includes(backend) &&
            !externalBackendTypeNetworks.includes(symbol),
    );

export const getNetworkType = (symbol: NetworkSymbol) => networks[symbol]?.networkType;

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
    networks[symbol]?.features;

export const getCoingeckoId = (symbol: NetworkSymbol) => networks[symbol].coingeckoId;

export const isNetworkSymbol = (symbol: NetworkSymbolExtended): symbol is NetworkSymbol =>
    Object.hasOwn(networks, symbol);

/**
 * Get network object by symbol as a generic `Network` type.
 * If you need the exact inferred type, use `networks[symbol]` directly.
 * @param symbol
 */
export const getNetwork = (symbol: NetworkSymbol): Network => networks[symbol];

/**
 * Use instead of getNetwork, if there is not a guarantee that the symbol is a valid network symbol.
 * @param symbol
 */
export const getNetworkOptional = (symbol?: string) =>
    symbol && isNetworkSymbol(symbol) ? getNetwork(symbol) : undefined;

export const isAccountOfNetwork = (
    network: Network,
    accountType: string,
): accountType is AccountType =>
    Object.prototype.hasOwnProperty.call(network.accountTypes, accountType) ||
    accountType === 'normal';

export const getNetworkByCoingeckoId = (coingeckoId: string) =>
    networksCollection.find(n => n.coingeckoId === coingeckoId);

export const getNetworkByTradeCryptoId = (tradeCryptoId: string) =>
    networksCollection.find(n => n.tradeCryptoId === tradeCryptoId);

export const getNetworkByEvmChainId = (chainId: number) =>
    networksCollection.find(n => n.chainId === chainId);

export const getNetworkDisplaySymbol = (symbol: NetworkSymbol) => getNetwork(symbol).displaySymbol;

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

export const getNetworkDisplaySymbolName = (symbol: NetworkSymbol) => {
    const network = getNetwork(symbol);

    return network.displaySymbolName || network.name;
};

export const getNetworkDecimals = (symbol: NetworkSymbolExtended) => {
    const lowerCasedSymbol = symbol.toLowerCase();
    if (isNetworkSymbol(lowerCasedSymbol)) {
        return getNetwork(lowerCasedSymbol).decimals;
    }

    return undefined;
};

export const getNetworkByYieldXyzId = (yieldXyzId: NetworkDtoId) =>
    networksCollection.find(n => n.yieldXyzId === yieldXyzId) ?? null;
