import {
    type Explorer,
    type SuiteCommonNetworkConfig,
    asNetworkDisplaySymbol,
    asProtocol,
} from '@trezor/network-module-suite-common-types';
import { STELLAR_DECIMALS, type StellarNetworkSymbol } from '@trezor/network-stellar/constants';

const getExplorerUrls = (baseUrl: string): Explorer => ({
    base: baseUrl,
    tx: `${baseUrl}/tx/`,
    address: `${baseUrl}/account/`,
    token: `${baseUrl}/asset/`,
});

const networkConfigBySymbol: Readonly<Record<StellarNetworkSymbol, SuiteCommonNetworkConfig>> = {
    xlm: {
        color: '#000000',
        protocols: [asProtocol('stellar'), asProtocol('xlm')],
        displaySymbol: asNetworkDisplaySymbol('XLM'),
        name: 'Stellar',
        networkType: 'stellar',
        bip43Path: "m/44'/148'/i'",
        decimals: STELLAR_DECIMALS,
        testnet: false,
        explorer: getExplorerUrls('https://stellar.expert/explorer/public'),
        features: ['tokens', 'coin-definitions'],
        backendOptions: [{ type: 'stellar' }],
        accountTypes: {},
        coingeckoId: 'stellar',
        tradeCryptoId: 'stellar',
        yieldXyzId: 'stellar',
        caipId: 'stellar:pubnet',
    },
    txlm: {
        color: '#e75f5f',
        protocols: [asProtocol('txlm')],
        displaySymbol: asNetworkDisplaySymbol('tXLM'),
        name: 'Stellar Testnet',
        networkType: 'stellar',
        bip43Path: "m/44'/148'/i'",
        decimals: STELLAR_DECIMALS,
        testnet: true,
        explorer: getExplorerUrls('https://stellar.expert/explorer/testnet'),
        features: ['tokens'],
        backendOptions: [{ type: 'stellar' }],
        accountTypes: {},
        coingeckoId: undefined,
        tradeCryptoId: undefined,
        yieldXyzId: 'stellar-testnet',
        caipId: 'stellar:testnet',
    },
};

export const getNetworkConfig = (symbol: StellarNetworkSymbol): SuiteCommonNetworkConfig =>
    networkConfigBySymbol[symbol];
