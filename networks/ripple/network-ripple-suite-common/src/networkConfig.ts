import {
    DEFAULT_ACCOUNT_SYNC_INTERVAL,
    type Explorer,
    type SuiteCommonNetworkConfig,
    asDisplayOrderKey,
    asProtocol,
} from '@trezor/network-module-suite-common-types';
import { RIPPLE_DECIMALS } from '@trezor/network-ripple/constants';
import type { RippleNetworkSymbol } from '@trezor/network-ripple-types';

const syncIntervalBySymbol: Readonly<Record<RippleNetworkSymbol, number>> = {
    xrp: DEFAULT_ACCOUNT_SYNC_INTERVAL,
    txrp: DEFAULT_ACCOUNT_SYNC_INTERVAL,
};

const getExplorerUrls = (baseUrl: string): Explorer => ({
    base: baseUrl,
    tx: `${baseUrl}/tx/`,
    address: `${baseUrl}/account/`,
});

type NetworkConfig = SuiteCommonNetworkConfig & {
    readonly networkType: 'ripple';
};

export const networkConfigBySymbol = {
    xrp: {
        color: '#24292e',
        displayOrder: asDisplayOrderKey('aE'),
        protocols: [asProtocol('ripple'), asProtocol('xrp')],
        displaySymbol: 'XRP',
        name: 'XRP Ledger',
        networkType: 'ripple',
        bip43Path: "m/44'/144'/i'/0/0",
        decimals: RIPPLE_DECIMALS,
        testnet: false,
        explorer: getExplorerUrls('https://xrpscan.com'),
        features: [],
        backendOptions: [{ type: 'ripple' }],
        accountTypes: {},
        coingeckoId: 'ripple',
        tradeCryptoId: 'ripple',
        yieldXyzId: null,
    },
    txrp: {
        color: '#e75f5f',
        displayOrder: asDisplayOrderKey('aP'),
        protocols: [asProtocol('txrp')],
        displaySymbol: 'tXRP',
        name: 'XRP Testnet',
        networkType: 'ripple',
        bip43Path: "m/44'/144'/i'/0/0",
        decimals: RIPPLE_DECIMALS,
        testnet: true,
        explorer: getExplorerUrls('https://test.bithomp.com'),
        features: ['tokens'],
        backendOptions: [],
        accountTypes: {},
        coingeckoId: undefined,
        tradeCryptoId: 'test-ripple', // fake, coingecko does not have testnets
        yieldXyzId: null,
    },
} satisfies Readonly<Record<RippleNetworkSymbol, NetworkConfig>>;

export const getNetworkConfig = (symbol: RippleNetworkSymbol): SuiteCommonNetworkConfig =>
    networkConfigBySymbol[symbol];

export const getAccountSyncInterval = (symbol: RippleNetworkSymbol): number =>
    syncIntervalBySymbol[symbol];
