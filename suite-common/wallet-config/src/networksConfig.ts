import { type NetworkSymbol, createNetworksCompositionRoot } from '@suite-common/networks';
import { typedObjectFromEntries } from '@trezor/utils';

import type { Network, NetworkType, Networks } from './types';

/**
 * @deprecated This module-level composition is temporary during the modularization transition.
 * Access network services through the application composition root: use `useServices` in
 * components and `extra` in thunks.
 */
const networkServices = createNetworksCompositionRoot();
const { getNetworkConfig, getSupportedNetworks } = networkServices;
export const { isTestnet } = networkServices;

const createNetwork = (networkSymbol: NetworkSymbol): Network => {
    const { settlementLayer, yieldXyzId, ...networkConfig } = getNetworkConfig(networkSymbol);

    return {
        symbol: networkSymbol,
        settlementLayer: settlementLayer as NetworkSymbol | undefined,
        yieldXyzId: yieldXyzId as Network['yieldXyzId'],
        ...networkConfig,
    };
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

const registeredNetworkSymbols = [...getSupportedNetworks()].sort(
    (firstNetworkSymbol, secondNetworkSymbol) =>
        getNetworkDisplayOrder(firstNetworkSymbol) - getNetworkDisplayOrder(secondNetworkSymbol),
);

/**
 * @deprecated Access network configuration through the application composition root: use
 * `useServices` in components and `extra` in thunks.
 */
export const networks: Networks = typedObjectFromEntries(
    registeredNetworkSymbols.map(
        networkSymbol => [networkSymbol, createNetwork(networkSymbol)] as const,
    ),
);

export type StakingNetworkSymbol = 'eth' | 'sol' | 'trx' | 'ada' | 'thod' | 'dsol';
export type StakingNetworkType = Extract<NetworkType, 'ethereum' | 'solana' | 'tron' | 'cardano'>;
type ProdStakingNetworkSymbol = 'eth' | 'sol' | 'trx' | 'ada';

const isStakingNetworkSymbol = (
    networkSymbol: NetworkSymbol,
): networkSymbol is StakingNetworkSymbol =>
    getNetworkConfig(networkSymbol).features.includes('staking');

export const STAKING_SYMBOLS: readonly StakingNetworkSymbol[] =
    registeredNetworkSymbols.filter(isStakingNetworkSymbol);

const isProdStakingNetworkSymbol = (
    networkSymbol: StakingNetworkSymbol,
): networkSymbol is ProdStakingNetworkSymbol => !getNetworkConfig(networkSymbol).testnet;

export const PROD_STAKING_SYMBOLS: readonly ProdStakingNetworkSymbol[] = STAKING_SYMBOLS.filter(
    isProdStakingNetworkSymbol,
);

export const STAKING_TYPES: readonly StakingNetworkType[] = [
    'ethereum',
    'solana',
    'tron',
    'cardano',
];
