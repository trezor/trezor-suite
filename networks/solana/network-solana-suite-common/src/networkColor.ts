import type { NetworkColor } from '@trezor/network-module-suite-common-types';

import type { SolanaNetworkSymbol } from './supportedNetworks';

const networkColorBySymbol: Record<SolanaNetworkSymbol, NetworkColor> = {
    sol: '#9945ff',
    dsol: '#9945ff',
};

export const getNetworkColor = (symbol: SolanaNetworkSymbol): NetworkColor =>
    networkColorBySymbol[symbol];
