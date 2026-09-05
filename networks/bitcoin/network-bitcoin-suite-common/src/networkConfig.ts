import type { BitcoinNetworkSymbol } from '@trezor/network-bitcoin/constants';
import {
    type Explorer,
    type SuiteCommonNetworkConfig,
    asNetworkDisplaySymbol,
    asProtocol,
} from '@trezor/network-module-suite-common-types';

const getExplorerUrls = (baseUrl: string): Explorer => ({
    base: baseUrl,
    tx: `${baseUrl}/tx/`,
    address: `${baseUrl}/address/`,
});

const networkConfigBySymbol: Readonly<Record<BitcoinNetworkSymbol, SuiteCommonNetworkConfig>> = {
    btc: {
        color: '#f29937',
        protocols: [asProtocol('bitcoin'), asProtocol('btc')],
        displaySymbol: asNetworkDisplaySymbol('BTC'),
        name: 'Bitcoin',
        networkType: 'bitcoin',
        bip43Path: "m/84'/0'/i'",
        decimals: 8,
        testnet: false,
        explorer: getExplorerUrls('https://mempool.space'),
        features: ['rbf', 'sign-verify', 'amount-unit', 'graph'],
        backendOptions: [{ type: 'blockbook' }, { type: 'electrum' }],
        accountTypes: {
            coinjoin: {
                accountType: 'coinjoin',
                bip43Path: "m/10025'/0'/i'/1'", // https://github.com/satoshilabs/slips/blob/master/slip-0025.md#public-key-derivation
                backendType: 'coinjoin', // use non-standard backend
                features: ['rbf', 'amount-unit'], // no sign-verify
            },
            taproot: {
                accountType: 'taproot',
                bip43Path: "m/86'/0'/i'",
                features: ['rbf', 'amount-unit'], // no sign-verify
            },
            segwit: {
                accountType: 'segwit',
                bip43Path: "m/49'/0'/i'",
            },
            legacy: {
                accountType: 'legacy',
                bip43Path: "m/44'/0'/i'",
            },
        },
        coingeckoId: 'bitcoin',
        tradeCryptoId: 'bitcoin',
        caipId: 'bip122:000000000019d6689c085ae165831e93',
        yieldXyzId: null,
    },
    test: {
        color: '#e75f5f',
        protocols: [asProtocol('test')],
        displaySymbol: asNetworkDisplaySymbol('TEST'),
        name: 'Bitcoin Testnet',
        networkType: 'bitcoin',
        bip43Path: "m/84'/1'/i'",
        decimals: 8,
        testnet: true,
        explorer: getExplorerUrls('https://mempool.space/testnet4'),
        features: ['rbf', 'sign-verify', 'amount-unit', 'graph'],
        backendOptions: [{ type: 'blockbook' }, { type: 'electrum' }],
        accountTypes: {
            coinjoin: {
                accountType: 'coinjoin',
                bip43Path: "m/10025'/1'/i'/1'", // https://github.com/satoshilabs/slips/blob/master/slip-0025.md#public-key-derivation
                backendType: 'coinjoin', // use non-standard backend
                features: ['rbf', 'amount-unit'], // no sign-verify
            },
            taproot: {
                accountType: 'taproot',
                bip43Path: "m/86'/1'/i'",
                features: ['rbf', 'amount-unit'], // no sign-verify
            },
            segwit: {
                accountType: 'segwit',
                bip43Path: "m/49'/1'/i'",
            },
            legacy: {
                accountType: 'legacy',
                bip43Path: "m/44'/1'/i'",
            },
        },
        coingeckoId: undefined,
        tradeCryptoId: 'test-bitcoin', // fake, coingecko does not have testnets
        caipId: 'bip122:000000000933ea01ad0ee984209779ba',
        yieldXyzId: null,
    },
    regtest: {
        color: '#e75f5f',
        protocols: [asProtocol('regtest')],
        displaySymbol: asNetworkDisplaySymbol('REGTEST'),
        name: 'Bitcoin Regtest',
        networkType: 'bitcoin',
        bip43Path: "m/84'/1'/i'",
        decimals: 8,
        testnet: true,
        explorer: getExplorerUrls('http://localhost:19121'),
        features: ['rbf', 'sign-verify', 'amount-unit', 'graph'],
        backendOptions: [{ type: 'blockbook' }, { type: 'electrum' }],
        accountTypes: {
            coinjoin: {
                accountType: 'coinjoin',
                bip43Path: "m/10025'/1'/i'/1'", // https://github.com/satoshilabs/slips/blob/master/slip-0025.md#public-key-derivation
                backendType: 'coinjoin', // use non-standard backend
                features: ['rbf', 'amount-unit'], // no sign-verify
            },
            taproot: {
                accountType: 'taproot',
                bip43Path: "m/86'/1'/i'",
                features: ['rbf', 'amount-unit'], // no sign-verify
            },
            segwit: {
                accountType: 'segwit',
                bip43Path: "m/49'/1'/i'",
            },
            legacy: {
                accountType: 'legacy',
                bip43Path: "m/44'/1'/i'",
            },
        },
        isDebugOnlyNetwork: true,
        coingeckoId: undefined,
        tradeCryptoId: undefined,
        yieldXyzId: null,
    },
    ltc: {
        color: '#a6a8a9',
        protocols: [asProtocol('litecoin'), asProtocol('ltc')],
        displaySymbol: asNetworkDisplaySymbol('LTC'),
        name: 'Litecoin',
        networkType: 'bitcoin',
        bip43Path: "m/84'/2'/i'",
        decimals: 8,
        testnet: false,
        explorer: getExplorerUrls('https://blockchair.com/litecoin'),
        features: ['sign-verify', 'graph'],
        backendOptions: [{ type: 'blockbook' }],
        accountTypes: {
            segwit: {
                accountType: 'segwit',
                bip43Path: "m/49'/2'/i'",
            },
            legacy: {
                accountType: 'legacy',
                bip43Path: "m/44'/2'/i'",
            },
        },
        coingeckoId: 'litecoin',
        tradeCryptoId: 'litecoin',
        caipId: 'bip122:12a765e31ffd4059bada1e25190f6e98',
        yieldXyzId: null,
    },
    doge: {
        color: '#c8af47',
        protocols: [asProtocol('dogecoin'), asProtocol('doge')],
        displaySymbol: asNetworkDisplaySymbol('DOGE'),
        name: 'Dogecoin',
        networkType: 'bitcoin',
        bip43Path: "m/44'/3'/i'",
        decimals: 8,
        testnet: false,
        explorer: getExplorerUrls('https://blockchair.com/dogecoin'),
        features: ['sign-verify', 'graph'],
        backendOptions: [{ type: 'blockbook' }],
        accountTypes: {},
        coingeckoId: 'dogecoin',
        tradeCryptoId: 'dogecoin',
        caipId: 'bip122:1a91e3dace36e2be3bf030a65679fe82',
        yieldXyzId: null,
    },
    zec: {
        color: '#f5b300',
        protocols: [asProtocol('zcash'), asProtocol('zec')],
        displaySymbol: asNetworkDisplaySymbol('ZEC'),
        name: 'Zcash',
        networkType: 'bitcoin',
        bip43Path: "m/44'/133'/i'",
        decimals: 8,
        testnet: false,
        explorer: getExplorerUrls('https://blockchair.com/zcash'),
        features: ['sign-verify', 'graph'],
        backendOptions: [{ type: 'blockbook' }],
        accountTypes: {},
        coingeckoId: 'zcash',
        tradeCryptoId: 'zcash',
        yieldXyzId: null,
    },
    // testnets
    bch: {
        color: '#0ac18e',
        protocols: [asProtocol('bitcoincash'), asProtocol('bch')],
        displaySymbol: asNetworkDisplaySymbol('BCH'),
        name: 'Bitcoin Cash',
        networkType: 'bitcoin',
        bip43Path: "m/44'/145'/i'",
        decimals: 8,
        testnet: false,
        explorer: getExplorerUrls('https://blockchair.com/bitcoin-cash'),
        features: ['sign-verify', 'graph'],
        backendOptions: [{ type: 'blockbook' }],
        accountTypes: {},
        coingeckoId: 'bitcoin-cash',
        tradeCryptoId: 'bitcoin-cash',
        yieldXyzId: null,
    },
};

export const getNetworkConfig = (symbol: BitcoinNetworkSymbol): SuiteCommonNetworkConfig =>
    networkConfigBySymbol[symbol];
