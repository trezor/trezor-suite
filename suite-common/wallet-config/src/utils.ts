import { networks, networksCompatibility } from './networksConfig';
import {
    AccountType,
    Network,
    NetworkAccountCollection,
    NetworkAccountTypes,
    NetworkFeature,
    Networks,
    NetworkSymbol,
} from './types';

export const accountTypesToArray = (accountTypes: NetworkAccountTypes): NetworkAccountCollection =>
    Object.entries(accountTypes).map(([key, value]) => ({
        ...value,
        accountType: key as AccountType,
    }));

const networksCollection: Network[] = Object.values(networks);

/**
 * @deprecated See `networksCompatibility`
 */
export const getMainnetsCompatible = (debug = false, bnb = false) =>
    networksCompatibility.filter(
        n =>
            !n.accountType &&
            !n.testnet &&
            (!n.isDebugOnlyNetwork || debug) &&
            (bnb || n.symbol !== 'bnb'),
    );

/**
 * @deprecated See `networksCompatibility`
 */
export const getTestnetsCompatible = (debug = false) =>
    networksCompatibility.filter(
        n => !n.accountType && n.testnet === true && (!n.isDebugOnlyNetwork || debug),
    );

export const getMainnets = (debug = false, bnb = false) =>
    networksCollection.filter(
        n => !n.testnet && (!n.isDebugOnlyNetwork || debug) && (bnb || n.symbol !== 'bnb'),
    );

export const getTestnets = (debug = false) =>
    networksCollection.filter(n => n.testnet === true && (!n.isDebugOnlyNetwork || debug));

export const ethereumTypeNetworkSymbols = networksCollection
    .filter(n => n.networkType === 'ethereum')
    .map(n => n.symbol);

export const getTestnetSymbols = () => getTestnets().map(n => n.symbol);

export const isBlockbookBasedNetwork = (symbol: NetworkSymbol) =>
    networks[symbol]?.customBackends.some(backend => backend === 'blockbook');

export const isDebugOnlyAccountType = (
    accountType: AccountType,
    symbol?: NetworkSymbol,
): boolean => {
    if (!symbol) return false;

    const network = (networks as Networks)?.[symbol];

    if (!network) return false;

    const accountTypeInfo = network.accountTypes[accountType];

    return !!accountTypeInfo?.isDebugOnlyAccountType;
};

export const getNetworkType = (symbol: NetworkSymbol) => networks[symbol]?.networkType;

// Takes into account just network features, not features for specific accountTypes.
export const getNetworkFeatures = (symbol: NetworkSymbol) =>
    networks[symbol]?.features as unknown as NetworkFeature;

export const getCoingeckoId = (symbol: NetworkSymbol) => networks[symbol]?.coingeckoId;

export const isNetworkSymbol = (symbol: NetworkSymbol | string): symbol is NetworkSymbol =>
    networks.hasOwnProperty(symbol);

export const getNetworkByCoingeckoId = (coingeckoId: string) =>
    networksCollection.find(n => n.coingeckoId === coingeckoId);

export const getNetworkByCoingeckoNativeId = (coingeckoId: string) =>
    networksCollection.find(n => n.coingeckoNativeId === coingeckoId);
