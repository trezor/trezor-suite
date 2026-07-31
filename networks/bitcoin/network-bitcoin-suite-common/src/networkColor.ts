import type { NetworkColor } from '@trezor/network-module-suite-common-types';

import type { BitcoinNetworkSymbol } from './supportedNetworks';

const networkColorBySymbol: Record<BitcoinNetworkSymbol, NetworkColor> = {
    btc: '#f29937',
    test: '#e75f5f',
    regtest: '#e75f5f',
    ltc: '#a6a8a9',
    doge: '#c8af47',
    zec: '#f5b300',
    bch: '#0ac18e',
};

export const getNetworkColor = (symbol: BitcoinNetworkSymbol): NetworkColor =>
    networkColorBySymbol[symbol];
