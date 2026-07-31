import type { NetworkColor } from '@trezor/network-module-suite-common-types';

import type { TronNetworkSymbol } from './supportedNetworks';

const networkColorBySymbol: Record<TronNetworkSymbol, NetworkColor> = {
    trx: '#ec002a',
    ttrx: '#ec002a',
};

export const getNetworkColor = (symbol: TronNetworkSymbol): NetworkColor =>
    networkColorBySymbol[symbol];
