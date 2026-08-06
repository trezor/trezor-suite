import type { EthereumNetworkSymbol } from '@trezor/network-ethereum/constants';
import {
    DEFAULT_ACCOUNT_SYNC_INTERVAL,
    type SuiteCommonNetworkConfig,
    asProtocol,
} from '@trezor/network-module-suite-common-types';

const syncIntervalBySymbol: Readonly<Record<EthereumNetworkSymbol, number>> = {
    eth: DEFAULT_ACCOUNT_SYNC_INTERVAL,
    pol: DEFAULT_ACCOUNT_SYNC_INTERVAL / 1.5,
    bsc: DEFAULT_ACCOUNT_SYNC_INTERVAL / 1.5,
    arb: DEFAULT_ACCOUNT_SYNC_INTERVAL / 1.5,
    base: DEFAULT_ACCOUNT_SYNC_INTERVAL / 1.5,
    op: DEFAULT_ACCOUNT_SYNC_INTERVAL / 1.5,
    rhc: DEFAULT_ACCOUNT_SYNC_INTERVAL / 1.5,
    hype: DEFAULT_ACCOUNT_SYNC_INTERVAL / 1.5,
    avax: DEFAULT_ACCOUNT_SYNC_INTERVAL / 1.5,
    etc: DEFAULT_ACCOUNT_SYNC_INTERVAL,
    tsep: DEFAULT_ACCOUNT_SYNC_INTERVAL,
    thod: DEFAULT_ACCOUNT_SYNC_INTERVAL,
};

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

export const getAccountSyncInterval = (symbol: EthereumNetworkSymbol): number =>
    syncIntervalBySymbol[symbol];
