import {
    type SuiteCommonNetworkConfig,
    asProtocol,
} from '@trezor/network-module-suite-common-types';

import type { BitcoinNetworkSymbol } from './supportedNetworks';

const networkConfigBySymbol: Readonly<Record<BitcoinNetworkSymbol, SuiteCommonNetworkConfig>> = {
    btc: { color: '#f29937', protocols: [asProtocol('bitcoin'), asProtocol('btc')] },
    test: { color: '#e75f5f', protocols: [asProtocol('test')] },
    regtest: { color: '#e75f5f', protocols: [asProtocol('regtest')] },
    ltc: { color: '#a6a8a9', protocols: [asProtocol('litecoin'), asProtocol('ltc')] },
    doge: { color: '#c8af47', protocols: [asProtocol('dogecoin'), asProtocol('doge')] },
    zec: { color: '#f5b300', protocols: [asProtocol('zcash'), asProtocol('zec')] },
    bch: { color: '#0ac18e', protocols: [asProtocol('bitcoincash'), asProtocol('bch')] },
};

export const getNetworkConfig = (symbol: BitcoinNetworkSymbol): SuiteCommonNetworkConfig =>
    networkConfigBySymbol[symbol];
