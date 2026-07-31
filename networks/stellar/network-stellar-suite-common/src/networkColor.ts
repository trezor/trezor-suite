import type { NetworkColor } from '@trezor/network-module-suite-common-types';

import type { StellarNetworkSymbol } from './supportedNetworks';

const networkColorBySymbol: Record<StellarNetworkSymbol, NetworkColor> = {
    xlm: '#000000',
    txlm: '#e75f5f',
};

export const getNetworkColor = (symbol: StellarNetworkSymbol): NetworkColor =>
    networkColorBySymbol[symbol];
