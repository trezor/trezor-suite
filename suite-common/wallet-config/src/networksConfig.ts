import type {
    GetNetworkConfigDep,
    NetworkModuleRepositoryDep,
    NetworkSymbol,
} from '@suite-common/networks';

import type { Network, NetworkType } from './types';

export type NetworkConfigDeps = GetNetworkConfigDep & NetworkModuleRepositoryDep;

export const selectNetworkConfigDeps = (services: any): NetworkConfigDeps => ({
    getNetworkConfig: services.getNetworkConfig,
    networkModuleRepository: services.networkModuleRepository,
});

const networkDisplayOrder: readonly NetworkSymbol[] = [
    'btc',
    'eth',
    'pol',
    'bsc',
    'arb',
    'base',
    'op',
    'rhc',
    'hype',
    'avax',
    'sol',
    'trx',
    'ada',
    'etc',
    'xrp',
    'xlm',
    'ltc',
    'bch',
    'doge',
    'zec',
    'test',
    'regtest',
    'tsep',
    'thod',
    'dsol',
    'txrp',
    'txlm',
    'ttrx',
];

const getNetworkDisplayOrder = (networkSymbol: NetworkSymbol): number => {
    const order = networkDisplayOrder.indexOf(networkSymbol);

    return order === -1 ? Number.MAX_SAFE_INTEGER : order;
};

export const toNetwork = (
    symbol: NetworkSymbol,
    networkConfig: ReturnType<NetworkConfigDeps['getNetworkConfig']>,
): Network => {
    const { settlementLayer, yieldXyzId, ...config } = networkConfig;

    return {
        symbol,
        settlementLayer: settlementLayer as NetworkSymbol | undefined,
        yieldXyzId: yieldXyzId as Network['yieldXyzId'],
        ...config,
    };
};

export const getNetworks = (deps: NetworkConfigDeps): readonly Network[] =>
    deps.networkModuleRepository
        .getSupportedNetworks()
        .toSorted(
            (firstNetworkSymbol, secondNetworkSymbol) =>
                getNetworkDisplayOrder(firstNetworkSymbol) -
                getNetworkDisplayOrder(secondNetworkSymbol),
        )
        .map(symbol => toNetwork(symbol, deps.getNetworkConfig(symbol)));

export type StakingNetworkSymbol = 'eth' | 'sol' | 'trx' | 'ada' | 'thod' | 'dsol';
export type StakingNetworkType = Extract<NetworkType, 'ethereum' | 'solana' | 'tron' | 'cardano'>;
type ProdStakingNetworkSymbol = 'eth' | 'sol' | 'trx' | 'ada';

export const isStakingNetworkSymbol = (
    deps: GetNetworkConfigDep,
    networkSymbol: NetworkSymbol,
): networkSymbol is StakingNetworkSymbol =>
    deps.getNetworkConfig(networkSymbol).features.includes('staking');

export const getStakingNetworkSymbols = (
    deps: NetworkConfigDeps,
): readonly StakingNetworkSymbol[] =>
    deps.networkModuleRepository
        .getSupportedNetworks()
        .filter(networkSymbol => isStakingNetworkSymbol(deps, networkSymbol));

const isProdStakingNetworkSymbol = (
    deps: GetNetworkConfigDep,
    networkSymbol: StakingNetworkSymbol,
): networkSymbol is ProdStakingNetworkSymbol => !deps.getNetworkConfig(networkSymbol).testnet;

export const getProdStakingNetworkSymbols = (
    deps: NetworkConfigDeps,
): readonly ProdStakingNetworkSymbol[] =>
    getStakingNetworkSymbols(deps).filter(
        networkSymbol => isProdStakingNetworkSymbol(deps, networkSymbol),
    );

export const STAKING_NETWORK_TYPES: readonly StakingNetworkType[] = [
    'ethereum',
    'solana',
    'tron',
    'cardano',
];
