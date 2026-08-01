import {
    type SuiteCommonNetworkConfig,
    asProtocol,
} from '@trezor/network-module-suite-common-types';

import type { TronNetworkSymbol } from './supportedNetworks';

const networkConfigBySymbol: Readonly<Record<TronNetworkSymbol, SuiteCommonNetworkConfig>> = {
    trx: { color: '#ec002a', protocols: [asProtocol('tron'), asProtocol('trx')] },
    ttrx: { color: '#ec002a', protocols: [asProtocol('ttrx')] },
};

export const getNetworkConfig = (symbol: TronNetworkSymbol): SuiteCommonNetworkConfig =>
    networkConfigBySymbol[symbol];
