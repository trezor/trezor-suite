import { type TokenDtoV2 } from '@suite-common/earn-stablecoin-defs';
import type { NetworkConfigDeps, Networks } from '@suite-common/networks';
import { exhaustive } from '@trezor/type-utils';

import type {
    NetworkConfigWithoutTestnets,
    StakingNetworkSymbol,
    StakingNetworkType,
} from './networkConfigTypes';
import {
    type AccountType,
    type Network,
    type NetworkFeature,
    type NetworkSymbol,
    type NetworkSymbolExtended,
    type NetworkType,
} from './networkTypes';

export const NORMAL_ACCOUNT_TYPE = 'normal' satisfies AccountType;

export const getNetworksCollection = (deps: NetworkConfigDeps): Network[] =>
    deps.getNetworkConfigs() as Network[];

export const getSupportedNetworks = (deps: NetworkConfigDeps): NetworkSymbol[] =>
    deps.getNetworkConfigs().map(network => network.symbol);

export const getNetworks = (deps: NetworkConfigDeps) =>
    Object.fromEntries(
        deps.getNetworkConfigs().map(network => [network.symbol, network]),
    ) as Networks;

export const getNetwork = <TSymbol extends NetworkSymbol>(
    deps: NetworkConfigDeps,
    symbol: TSymbol,
) => deps.getNetworkConfig(symbol) as Network & Networks[TSymbol];

export const getStakingSymbols = (deps: NetworkConfigDeps): readonly StakingNetworkSymbol[] =>
    deps
        .getNetworkConfigs()
        .filter(network => network.features.includes('staking'))
        .map(network => network.symbol as StakingNetworkSymbol);

export const getStakingTypes = (deps: NetworkConfigDeps): readonly StakingNetworkType[] => [
    ...new Set(
        deps
            .getNetworkConfigs()
            .filter(network => network.features.includes('staking'))
            .map(network => network.networkType as StakingNetworkType),
    ),
];

export const getProdStakingSymbols = (
    deps: NetworkConfigDeps,
): readonly (StakingNetworkSymbol & NetworkConfigWithoutTestnets['symbol'])[] =>
    deps
        .getNetworkConfigs()
        .filter(network => network.features.includes('staking') && !network.testnet)
        .map(
            network =>
                network.symbol as StakingNetworkSymbol & NetworkConfigWithoutTestnets['symbol'],
        );

interface GetMainnetsProps {
    debug?: boolean;
    useExperimentalNetworks?: boolean;
    allNetworks?: Network[];
}

export const getMainnets = (
    networkConfigDeps: NetworkConfigDeps,
    {
        debug = false,
        useExperimentalNetworks = false,
        allNetworks = getNetworksCollection(networkConfigDeps),
    }: GetMainnetsProps = {},
): Network[] =>
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

export const getTestnets = (
    networkConfigDeps: NetworkConfigDeps,
    {
        debug = false,
        useExperimentalNetworks = false,
        useTestnetNetworks = false,
        allNetworks = getNetworksCollection(networkConfigDeps),
    }: GetTestnetsProps,
): Network[] =>
    allNetworks.filter(
        n =>
            n.testnet &&
            useTestnetNetworks &&
            (!n.isDebugOnlyNetwork || debug) &&
            (!n.isExperimentalOnlyNetwork || useExperimentalNetworks),
    );

export const getTestnetSymbols = (networkConfigDeps: NetworkConfigDeps): NetworkSymbol[] =>
    getTestnets(networkConfigDeps, { useTestnetNetworks: true }).map(n => n.symbol);

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

export const isBlockbookBasedNetwork = (
    networkConfigDeps: NetworkConfigDeps,
    symbol: NetworkSymbol,
) =>
    getNetwork(networkConfigDeps, symbol)?.backendOptions.some(
        option => option.type === 'blockbook',
    );

export const isNetworkUsingExternalBackend = (
    networkConfigDeps: NetworkConfigDeps,
    symbol: NetworkSymbol,
) =>
    !!getNetwork(networkConfigDeps, symbol)?.backendOptions.some(
        option => 'isExternalBackend' in option && option.isExternalBackend,
    );

export const getNetworkType = (
    networkConfigDeps: NetworkConfigDeps,
    symbol: NetworkSymbol,
): NetworkType => getNetwork(networkConfigDeps, symbol)?.networkType;

export const isAccountBasedNetwork = (
    networkConfigDeps: NetworkConfigDeps,
    symbol: NetworkSymbol,
) => {
    const networkType = getNetworkType(networkConfigDeps, symbol);
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
export const getNetworkFeatures = (
    networkConfigDeps: NetworkConfigDeps,
    symbol: NetworkSymbol,
): NetworkFeature[] => getNetwork(networkConfigDeps, symbol)?.features;

export const getCoingeckoId = (
    networkConfigDeps: NetworkConfigDeps,
    symbol: NetworkSymbol,
): string | undefined => getNetwork(networkConfigDeps, symbol).coingeckoId;

export const isNetworkSymbol = (
    networkConfigDeps: NetworkConfigDeps,
    symbol: NetworkSymbolExtended,
): symbol is NetworkSymbol =>
    networkConfigDeps.getNetworkConfigs().some(network => network.symbol === symbol);

/**
 * Use instead of getNetwork, if there is not a guarantee that the symbol is a valid network symbol.
 * @param symbol
 */
export const getNetworkOptional = (
    networkConfigDeps: NetworkConfigDeps,
    symbol?: string,
): Network | undefined =>
    symbol && isNetworkSymbol(networkConfigDeps, symbol)
        ? getNetwork(networkConfigDeps, symbol)
        : undefined;

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

export const getNetworkByCoingeckoId = (
    networkConfigDeps: NetworkConfigDeps,
    coingeckoId: string,
): Network | undefined =>
    getNetworksCollection(networkConfigDeps).find(n => n.coingeckoId === coingeckoId);

export const getNetworkByTradeCryptoId = (
    networkConfigDeps: NetworkConfigDeps,
    tradeCryptoId: string,
): Network | undefined =>
    getNetworksCollection(networkConfigDeps).find(n => n.tradeCryptoId === tradeCryptoId);

export const getNetworkByEvmChainId = (
    networkConfigDeps: NetworkConfigDeps,
    chainId: number,
): Network | undefined => getNetworksCollection(networkConfigDeps).find(n => n.chainId === chainId);

export const getNetworkDisplaySymbol = (
    networkConfigDeps: NetworkConfigDeps,
    symbol: NetworkSymbol,
): string => getNetwork(networkConfigDeps, symbol).displaySymbol;

export const getDisplaySymbol = (
    networkConfigDeps: NetworkConfigDeps,
    coinSymbol: string,
    contractAddress?: string | null,
) => {
    const MAX_SYMBOL_LENGTH = 10;
    const isTokenSymbolLong = coinSymbol.length > MAX_SYMBOL_LENGTH;

    const symbol = coinSymbol.toLowerCase();

    // TODO: L2 networks - Base, Arbitrum, Optimism native tokens
    if (isNetworkSymbol(networkConfigDeps, symbol) && !contractAddress) {
        return getNetworkDisplaySymbol(networkConfigDeps, symbol);
    }

    return isTokenSymbolLong ? `${coinSymbol.slice(0, MAX_SYMBOL_LENGTH)}...` : coinSymbol;
};

export const getNetworkDisplaySymbolName = (
    networkConfigDeps: NetworkConfigDeps,
    symbol: NetworkSymbol,
): string => {
    const network = getNetwork(networkConfigDeps, symbol);

    return network.displaySymbolName || network.name;
};

export const getNetworkDecimals = (
    networkConfigDeps: NetworkConfigDeps,
    symbol: NetworkSymbolExtended,
): number | undefined => {
    const lowerCasedSymbol = symbol.toLowerCase();
    if (isNetworkSymbol(networkConfigDeps, lowerCasedSymbol)) {
        return getNetwork(networkConfigDeps, lowerCasedSymbol).decimals;
    }

    return undefined;
};

export const getNetworkByYieldXyzId = (
    networkConfigDeps: NetworkConfigDeps,
    yieldXyzId: TokenDtoV2['network'],
): Network | null =>
    getNetworksCollection(networkConfigDeps).find(n => n.yieldXyzId === yieldXyzId) ?? null;

const formatNetworksAsString = (someNetworks: Network[]): string =>
    someNetworks.map(network => network.name).join(', ');

export const getNetworksWithMevProtection = (networkConfigDeps: NetworkConfigDeps): string =>
    formatNetworksAsString(
        getNetworksCollection(networkConfigDeps).filter(network =>
            network.features.includes('mev-protection'),
        ),
    );

export const getNetworksWithNativeTokenReserve = (networkConfigDeps: NetworkConfigDeps): string =>
    formatNetworksAsString(
        getNetworksCollection(networkConfigDeps).filter(network => !!network.nativeTokenReserve),
    );
