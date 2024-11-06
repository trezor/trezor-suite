import { networks } from './networksConfig';
import {
    AccountType,
    Network,
    NetworkFeature,
    NetworkSymbol,
    NormalizedNetworkAccount,
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

export const getMainnets = (debug = false) =>
    networksCollection.filter(n => !n.testnet && (!n.isDebugOnlyNetwork || debug));

export const getTestnets = (debug = false) =>
    networksCollection.filter(n => n.testnet === true && (!n.isDebugOnlyNetwork || debug));

export const getTestnetSymbols = () => getTestnets().map(n => n.symbol);

/**
 * For a given network, return a collection of accounts incl. 'normal', and with missing properties backfilled from 'normal'
 */
export const normalizeNetworkAccounts = (network: Network): NormalizedNetworkAccount[] => {
    const normalAccount: NormalizedNetworkAccount = {
        accountType: NORMAL_ACCOUNT_TYPE,
        bip43Path: network.bip43Path,
        features: network.features,
    };
    const alternativeAccounts = Object.values(network.accountTypes).map(account => ({
        ...normalAccount,
        ...account,
    }));

    return [normalAccount, ...alternativeAccounts];
};

export const isBlockbookBasedNetwork = (symbol: NetworkSymbol) =>
    networks[symbol]?.customBackends.some(backend => backend === 'blockbook');

export const getNetworkType = (symbol: NetworkSymbol) => networks[symbol]?.networkType;

// Takes into account just network features, not features for specific accountTypes.
export const getNetworkFeatures = (symbol: NetworkSymbol): NetworkFeature[] =>
    networks[symbol]?.features;

export const getCoingeckoId = (symbol: NetworkSymbol) => networks[symbol].coingeckoId;

export const isNetworkSymbol = (symbol: NetworkSymbol | string): symbol is NetworkSymbol =>
    Object.prototype.hasOwnProperty.call(networks, symbol);

/**
 * Get network object by symbol as a generic `Network` type.
 * If you need the exact inferred type, use `networks[symbol]` directly.
 * @param symbol
 */
export const getNetwork = (symbol: NetworkSymbol): Network => networks[symbol];

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

export const getNetworkByCoingeckoNativeId = (coingeckoId: string) =>
    networksCollection.find(n => n.coingeckoNativeId === coingeckoId);
