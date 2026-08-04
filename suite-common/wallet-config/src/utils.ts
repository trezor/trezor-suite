import { type TokenDtoV2 } from '@suite-common/earn-stablecoin-defs';
import type {
    GetNetworkConfigDep,
    NetworkModuleRepositoryDep,
    NetworkSymbol,
} from '@suite-common/networks';
import { exhaustive } from '@trezor/type-utils';

import { type NetworkConfigDeps, getNetworks } from './networksConfig';
import type {
    AccountType,
    Network,
    NetworkDisplaySymbol,
    NetworkFeature,
    NetworkSymbolExtended,
    NetworkType,
} from './types';

export const NORMAL_ACCOUNT_TYPE = 'normal' satisfies AccountType;

type GetMainnetsProps = {
    debug?: boolean;
    useExperimentalNetworks?: boolean;
    allNetworks: readonly Network[];
};

export const getMainnets = ({
    debug = false,
    useExperimentalNetworks = false,
    allNetworks,
}: GetMainnetsProps): Network[] =>
    allNetworks.filter(
        network =>
            !network.testnet &&
            (!network.isDebugOnlyNetwork || debug) &&
            (!network.isExperimentalOnlyNetwork || useExperimentalNetworks),
    );

type GetTestnetsProps = {
    debug?: boolean;
    useExperimentalNetworks?: boolean;
    useTestnetNetworks?: boolean;
    allNetworks: readonly Network[];
};

export const getTestnets = ({
    debug = false,
    useExperimentalNetworks = false,
    useTestnetNetworks = false,
    allNetworks,
}: GetTestnetsProps): Network[] =>
    allNetworks.filter(
        network =>
            network.testnet &&
            useTestnetNetworks &&
            (!network.isDebugOnlyNetwork || debug) &&
            (!network.isExperimentalOnlyNetwork || useExperimentalNetworks),
    );

export const getTestnetSymbols = (deps: NetworkConfigDeps): NetworkSymbol[] =>
    getNetworks(deps)
        .filter(network => network.testnet)
        .map(network => network.symbol);

export const filterNetworksByName = (
    networks: readonly Network[],
    searchQuery: string,
): Network[] => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    if (!normalizedQuery) {
        return [...networks];
    }

    return networks.filter(
        ({ symbol, name }) =>
            symbol.includes(normalizedQuery) || name.toLowerCase().includes(normalizedQuery),
    );
};

export const isBlockbookBasedNetwork = (
    deps: GetNetworkConfigDep,
    symbol: NetworkSymbol,
): boolean =>
    deps.getNetworkConfig(symbol).backendOptions.some(option => option.type === 'blockbook');

export const isNetworkUsingExternalBackend = (
    deps: GetNetworkConfigDep,
    symbol: NetworkSymbol,
): boolean =>
    deps.getNetworkConfig(symbol).backendOptions.some(option => option.isExternalBackend === true);

export const isAccountBasedNetwork = (
    deps: GetNetworkConfigDep,
    symbol: NetworkSymbol,
): boolean => {
    const { networkType } = deps.getNetworkConfig(symbol);

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

export const isNetworkSymbol = (
    deps: NetworkModuleRepositoryDep,
    symbol: NetworkSymbolExtended,
): symbol is NetworkSymbol => deps.networkModuleRepository.isSupportedNetwork(symbol);

export const getNetworkType = (deps: GetNetworkConfigDep, symbol: NetworkSymbol): NetworkType =>
    deps.getNetworkConfig(symbol).networkType;

export const getNetworkFeatures = (
    deps: GetNetworkConfigDep,
    symbol: NetworkSymbol,
): readonly NetworkFeature[] => deps.getNetworkConfig(symbol).features;

export const getCoingeckoId = (
    deps: GetNetworkConfigDep,
    symbol: NetworkSymbol,
): string | undefined => deps.getNetworkConfig(symbol).coingeckoId;

export const getNetworkChainId = (deps: GetNetworkConfigDep, symbol: NetworkSymbol): number => {
    const { chainId } = deps.getNetworkConfig(symbol);

    if (chainId === undefined) {
        throw new Error(`Network ${symbol} does not define a chain ID.`);
    }

    return chainId;
};

export const isAccountOfNetwork = (
    network: Network,
    accountType: string,
): accountType is AccountType =>
    Object.prototype.hasOwnProperty.call(network.accountTypes, accountType) ||
    accountType === 'normal';

export const findNetworkByCoingeckoId = (
    networks: readonly Network[],
    coingeckoId: string,
): Network | null => networks.find(network => network.coingeckoId === coingeckoId) ?? null;

export const findNetworkByTradeCryptoId = (
    networks: readonly Network[],
    tradeCryptoId: string,
): Network | null => networks.find(network => network.tradeCryptoId === tradeCryptoId) ?? null;

export const findNetworkByEvmChainId = (
    networks: readonly Network[],
    chainId: number,
): Network | null => networks.find(network => network.chainId === chainId) ?? null;

export const getDisplaySymbol = (
    deps: GetNetworkConfigDep & NetworkModuleRepositoryDep,
    coinSymbol: string,
    contractAddress?: string | null,
): string => {
    const maxSymbolLength = 10;
    const symbol = coinSymbol.toLowerCase();

    if (deps.networkModuleRepository.isSupportedNetwork(symbol) && !contractAddress) {
        return deps.getNetworkConfig(symbol).displaySymbol;
    }

    return coinSymbol.length > maxSymbolLength
        ? `${coinSymbol.slice(0, maxSymbolLength)}...`
        : coinSymbol;
};

export const getNetworkDisplaySymbolName = (
    deps: GetNetworkConfigDep,
    symbol: NetworkSymbol,
): string => {
    const network = deps.getNetworkConfig(symbol);

    return network.displaySymbolName || network.name;
};

export const getNetworkDisplaySymbol = (
    deps: GetNetworkConfigDep,
    symbol: NetworkSymbol,
): NetworkDisplaySymbol => deps.getNetworkConfig(symbol).displaySymbol;

export const getNetworkDecimals = (
    deps: GetNetworkConfigDep & NetworkModuleRepositoryDep,
    symbol: NetworkSymbolExtended,
): number | undefined => {
    const lowerCasedSymbol = symbol.toLowerCase();

    return deps.networkModuleRepository.isSupportedNetwork(lowerCasedSymbol)
        ? deps.getNetworkConfig(lowerCasedSymbol).decimals
        : undefined;
};

export const findNetworkByYieldXyzId = (
    networks: readonly Network[],
    yieldXyzId: TokenDtoV2['network'],
): Network | null => networks.find(network => network.yieldXyzId === yieldXyzId) ?? null;

const formatNetworksAsString = (networks: readonly Network[]): string =>
    networks.map(network => network.name).join(', ');

export const getNetworksWithFeature = (
    networks: readonly Network[],
    feature: NetworkFeature,
): string => formatNetworksAsString(networks.filter(network => network.features.includes(feature)));

export const getNetworksWithNativeTokenReserve = (networks: readonly Network[]): string =>
    formatNetworksAsString(networks.filter(network => !!network.nativeTokenReserve));

export type { NetworkType };
