import {
    type SuiteCommonNetworkConfig,
    asProtocol,
} from '@trezor/network-module-suite-common-types';

import type { EthereumNetworkSymbol } from './supportedNetworks';

const networkConfigBySymbol: Readonly<Record<EthereumNetworkSymbol, SuiteCommonNetworkConfig>> = {
    eth: { color: '#454a75', protocols: [asProtocol('ethereum'), asProtocol('eth')] },
    pol: {
        color: '#7b3fe4',
        protocols: [asProtocol('polygon'), asProtocol('matic'), asProtocol('pol')],
    },
    bsc: {
        color: '#f0b90b',
        protocols: [asProtocol('binance'), asProtocol('bnb'), asProtocol('bsc')],
    },
    arb: {
        color: '#213147',
        protocols: [
            asProtocol('arbitrum'),
            asProtocol('arbitrum-one'),
            asProtocol('arb'),
            asProtocol('arbitrum-ethereum'),
        ],
    },
    base: { color: '#0052ff', protocols: [asProtocol('base')] },
    op: { color: '#ff0720', protocols: [asProtocol('optimism'), asProtocol('op')] },
    rhc: {
        color: '#ccff00',
        protocols: [asProtocol('robinhood'), asProtocol('robinhood-chain'), asProtocol('rhc')],
    },
    hype: {
        color: '#97fce4',
        protocols: [asProtocol('hyperliquid'), asProtocol('hyperevm'), asProtocol('hype')],
    },
    avax: { color: '#e84142', protocols: [asProtocol('avalanche'), asProtocol('avax')] },
    etc: { color: '#60c67e', protocols: [asProtocol('ethclassic'), asProtocol('etc')] },
    tsep: { color: '#454a75', protocols: [asProtocol('tsep')] },
    thod: { color: '#454a75', protocols: [asProtocol('thod')] },
};

export const getNetworkConfig = (symbol: EthereumNetworkSymbol): SuiteCommonNetworkConfig =>
    networkConfigBySymbol[symbol];
