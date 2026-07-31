import type { NetworkColor } from '@trezor/network-module-suite-common-types';

import type { RippleNetworkSymbol } from './supportedNetworks';

const networkColorBySymbol: Record<RippleNetworkSymbol, NetworkColor> = {
    xrp: '#24292e',
    txrp: '#e75f5f',
};

export const getNetworkColor = (symbol: RippleNetworkSymbol): NetworkColor =>
    networkColorBySymbol[symbol];
