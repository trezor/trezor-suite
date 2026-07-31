import type { NetworkColor } from '@trezor/network-module-suite-common-types';

import type { CardanoNetworkSymbol } from './supportedNetworks';

const networkColorBySymbol: Record<CardanoNetworkSymbol, NetworkColor> = {
    ada: '#3468d1',
};

export const getNetworkColor = (symbol: CardanoNetworkSymbol): NetworkColor =>
    networkColorBySymbol[symbol];
