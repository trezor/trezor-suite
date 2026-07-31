import type { NetworkColor } from '@trezor/network-module-suite-common-types';

import type { EthereumNetworkSymbol } from './supportedNetworks';

const networkColorBySymbol: Record<EthereumNetworkSymbol, NetworkColor> = {
    eth: '#454a75',
    pol: '#7b3fe4',
    bsc: '#f0b90b',
    arb: '#213147',
    base: '#0052ff',
    op: '#ff0720',
    rhc: '#ccff00',
    hype: '#97fce4',
    avax: '#e84142',
    etc: '#60c67e',
    tsep: '#454a75',
    thod: '#454a75',
};

export const getNetworkColor = (symbol: EthereumNetworkSymbol): NetworkColor =>
    networkColorBySymbol[symbol];
