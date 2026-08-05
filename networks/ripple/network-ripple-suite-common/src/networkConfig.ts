import {
    type Explorer,
    type SuiteCommonNetworkConfig,
    asNetworkDisplaySymbol,
    asProtocol,
} from '@trezor/network-module-suite-common-types';
import { RIPPLE_DECIMALS, type RippleNetworkSymbol } from '@trezor/network-ripple/constants';

const getExplorerUrls = (baseUrl: string): Explorer => ({
    base: baseUrl,
    tx: `${baseUrl}/tx/`,
    address: `${baseUrl}/account/`,
});

const networkConfigBySymbol: Readonly<Record<RippleNetworkSymbol, SuiteCommonNetworkConfig>> = {
    xrp: {
        color: '#24292e',
        protocols: [asProtocol('ripple'), asProtocol('xrp')],
        displaySymbol: asNetworkDisplaySymbol('XRP'),
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
        protocols: [asProtocol('txrp')],
        displaySymbol: asNetworkDisplaySymbol('tXRP'),
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
};

export const getNetworkConfig = (symbol: RippleNetworkSymbol): SuiteCommonNetworkConfig =>
    networkConfigBySymbol[symbol];
