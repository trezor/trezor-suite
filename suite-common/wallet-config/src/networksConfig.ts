import { type NetworkSymbol, getNetworkServices } from '@suite-common/networks';
import type { SuiteCommonNetworkConfig } from '@trezor/network-module-suite-common-types';
import { typedObjectFromEntries } from '@trezor/utils';

import type { Network, NetworkType, Networks } from './types';

/**
 * @deprecated This static compatibility API is temporary during the modularization transition.
 * Access network services through the application composition root: use `useServices` in
 * components and `extra` in thunks.
 */
export const getNetworkConfig = (symbol: NetworkSymbol) =>
    getNetworkServices().getNetworkConfig(symbol);
export const isTestnet = (symbol: NetworkSymbol) => getNetworkServices().isTestnet(symbol);

// Preserve the stable object references of the legacy registry without reading services on import.
const legacyNetworks = new WeakMap<SuiteCommonNetworkConfig, Map<NetworkSymbol, Network>>();

export const getNetwork = (networkSymbol: NetworkSymbol): Network => {
    const config = getNetworkConfig(networkSymbol);
    const cachedNetworks = legacyNetworks.get(config) ?? new Map<NetworkSymbol, Network>();
    const cachedNetwork = cachedNetworks.get(networkSymbol);
    if (cachedNetwork) return cachedNetwork;

    const { settlementLayer, yieldXyzId, ...networkConfig } = config;
    const network: Network = {
        symbol: networkSymbol,
        settlementLayer: settlementLayer as NetworkSymbol | undefined,
        yieldXyzId: yieldXyzId as Network['yieldXyzId'],
        ...networkConfig,
    };
    cachedNetworks.set(networkSymbol, network);
    legacyNetworks.set(config, cachedNetworks);

    return network;
};

/**
 * @deprecated Network display order shall be composed from network modules using fractional
 * indexing. See https://github.com/trezor/trezor-suite/issues/32060.
 */
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

export const getSupportedNetworks = (): NetworkSymbol[] =>
    [...getNetworkServices().getSupportedNetworks()].sort(
        (firstNetworkSymbol, secondNetworkSymbol) =>
            getNetworkDisplayOrder(firstNetworkSymbol) -
            getNetworkDisplayOrder(secondNetworkSymbol),
    );

/**
 * @deprecated Access network configuration through the application composition root: use
 * `useServices` in components and `extra` in thunks.
 */
export const getNetworks = (): Networks =>
    typedObjectFromEntries(
        getSupportedNetworks().map(
            networkSymbol => [networkSymbol, getNetwork(networkSymbol)] as const,
        ),
    );

export type StakingNetworkSymbol = 'eth' | 'sol' | 'trx' | 'ada' | 'thod' | 'dsol';
export type StakingNetworkType = Extract<NetworkType, 'ethereum' | 'solana' | 'tron' | 'cardano'>;
type ProdStakingNetworkSymbol = 'eth' | 'sol' | 'trx' | 'ada';

const isStakingNetworkSymbol = (
    networkSymbol: NetworkSymbol,
): networkSymbol is StakingNetworkSymbol =>
    getNetworkConfig(networkSymbol).features.includes('staking');

export const getStakingSymbols = (): readonly StakingNetworkSymbol[] =>
    getSupportedNetworks().filter(isStakingNetworkSymbol);

const isProdStakingNetworkSymbol = (
    networkSymbol: StakingNetworkSymbol,
): networkSymbol is ProdStakingNetworkSymbol => !getNetworkConfig(networkSymbol).testnet;

export const getProdStakingSymbols = (): readonly ProdStakingNetworkSymbol[] =>
    getStakingSymbols().filter(isProdStakingNetworkSymbol);

export const STAKING_TYPES: readonly StakingNetworkType[] = [
    'ethereum',
    'solana',
    'tron',
    'cardano',
];
