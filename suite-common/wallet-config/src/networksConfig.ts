import { DeviceModelInternal } from '@trezor/connect';

import { Networks, NetworkType, Explorer } from './types';

type NetworkTypeExplorerMap = {
    [key in NetworkType]: Explorer;
};

export const getExplorerUrls = (
    baseUrl: string,
    networkType: NetworkType,
    solanaDevnet?: boolean,
): Explorer => {
    const networkTypeExplorerMap: NetworkTypeExplorerMap = {
        bitcoin: {
            tx: `${baseUrl}/tx/`,
            account: `${baseUrl}/xpub/`,
            address: `${baseUrl}/address/`,
        },
        ethereum: {
            tx: `${baseUrl}/tx/`,
            account: `${baseUrl}/address/`,
            address: `${baseUrl}/address/`,
            nft: `${baseUrl}/nft/`,
        },
        ripple: {
            tx: `${baseUrl}/tx/`,
            account: `${baseUrl}/account/`,
            address: `${baseUrl}/account/`,
        },
        solana: {
            tx: `${baseUrl}/tx/`,
            account: `${baseUrl}/account/`,
            address: `${baseUrl}/account/`,
            queryString: solanaDevnet ? `?cluster=devnet` : '',
        },
        cardano: {
            tx: `${baseUrl}/tx/`,
            account: `${baseUrl}/address/`,
            address: `${baseUrl}/address/`,
            token: `${baseUrl}/asset/`,
        },
    };

    return networkTypeExplorerMap[networkType];
};

export const networks = {
    btc: {
        symbol: 'btc',
        name: 'Bitcoin',
        networkType: 'bitcoin',
        bip43Path: "m/84'/0'/i'",
        decimals: 8,
        testnet: false,
        explorer: getExplorerUrls('https://btc1.trezor.io', 'bitcoin'),
        features: ['rbf', 'sign-verify', 'amount-unit'],
        backendTypes: ['blockbook', 'electrum'],
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
        coingeckoNativeId: 'bitcoin',
    },
    eth: {
        symbol: 'eth',
        name: 'Ethereum',
        networkType: 'ethereum',
        chainId: 1,
        bip43Path: "m/44'/60'/0'/0/i",
        decimals: 18,
        testnet: false,
        explorer: getExplorerUrls('https://eth1.trezor.io', 'ethereum'),
        features: [
            'rbf',
            'sign-verify',
            'tokens',
            'nfts',
            'coin-definitions',
            'nft-definitions',
            'staking',
        ],
        backendTypes: ['blockbook'],
        accountTypes: {
            ledger: {
                // ledger (live), #1 acc is same as Trezor, so it is skipped
                accountType: 'ledger',
                bip43Path: "m/44'/60'/i'/0/0",
                isDebugOnlyAccountType: true,
            },
            legacy: {
                // ledger (legacy)
                accountType: 'legacy',
                bip43Path: "m/44'/60'/0'/i",
                isDebugOnlyAccountType: true,
            },
        },
        coingeckoId: 'ethereum',
        coingeckoNativeId: 'ethereum',
    },
    pol: {
        symbol: 'pol',
        name: 'Polygon PoS',
        networkType: 'ethereum',
        chainId: 137,
        bip43Path: "m/44'/60'/0'/0/i",
        decimals: 18,
        testnet: false,
        explorer: getExplorerUrls('https://pol1.trezor.io', 'ethereum'),
        features: ['rbf', 'sign-verify', 'tokens', 'nfts', 'coin-definitions', 'nft-definitions'],
        backendTypes: ['blockbook'],
        accountTypes: {
            ledger: {
                // ledger (live), #1 acc is same as Trezor, so it is skipped
                accountType: 'ledger',
                bip43Path: "m/44'/60'/i'/0/0",
                isDebugOnlyAccountType: true,
            },
        },
        coingeckoId: 'polygon-pos',
        coingeckoNativeId: 'polygon-ecosystem-token',
    },
    bsc: {
        symbol: 'bsc',
        name: 'BNB Smart Chain',
        networkType: 'ethereum',
        chainId: 56,
        bip43Path: "m/44'/60'/0'/0/i",
        decimals: 18,
        testnet: false,
        explorer: getExplorerUrls('https://bsc1.trezor.io', 'ethereum'),
        features: ['rbf', 'sign-verify', 'tokens', 'nfts', 'coin-definitions', 'nft-definitions'],
        backendTypes: ['blockbook'],
        accountTypes: {
            ledger: {
                // ledger (live), #1 acc is same as Trezor, so it is skipped
                accountType: 'ledger',
                bip43Path: "m/44'/60'/i'/0/0",
                isDebugOnlyAccountType: true,
            },
        },
        coingeckoId: 'binance-smart-chain',
        coingeckoNativeId: 'binancecoin',
    },
    arb: {
        symbol: 'arb',
        name: 'Arbitrum One',
        networkType: 'ethereum',
        chainId: 42161,
        bip43Path: "m/44'/60'/0'/0/i",
        decimals: 18,
        testnet: false,
        explorer: getExplorerUrls('https://arbiscan.io', 'ethereum'),
        features: ['rbf', 'sign-verify', 'tokens', 'nfts', 'coin-definitions', 'nft-definitions'],
        backendTypes: ['blockbook'],
        accountTypes: {
            ledger: {
                // ledger (live), #1 acc is same as Trezor, so it is skipped
                accountType: 'ledger',
                bip43Path: "m/44'/60'/i'/0/0",
                isDebugOnlyAccountType: true,
            },
        },
        coingeckoId: 'arbitrum-one',
        coingeckoNativeId: 'ethereum',
        isDebugOnlyNetwork: true,
    },
    base: {
        symbol: 'base',
        name: 'Base',
        networkType: 'ethereum',
        chainId: 8453,
        bip43Path: "m/44'/60'/0'/0/i",
        decimals: 18,
        testnet: false,
        explorer: getExplorerUrls('https://basescan.org', 'ethereum'),
        features: ['rbf', 'sign-verify', 'tokens', 'nfts', 'coin-definitions', 'nft-definitions'],
        backendTypes: ['blockbook'],
        accountTypes: {
            ledger: {
                // ledger (live), #1 acc is same as Trezor, so it is skipped
                accountType: 'ledger',
                bip43Path: "m/44'/60'/i'/0/0",
                isDebugOnlyAccountType: true,
            },
        },
        coingeckoId: 'base',
        coingeckoNativeId: 'ethereum',
        isDebugOnlyNetwork: true,
    },
    op: {
        symbol: 'op',
        name: 'Optimism',
        networkType: 'ethereum',
        chainId: 10,
        bip43Path: "m/44'/60'/0'/0/i",
        decimals: 18,
        testnet: false,
        explorer: getExplorerUrls('https://optimistic.etherscan.io', 'ethereum'),
        features: ['rbf', 'sign-verify', 'tokens', 'nfts', 'coin-definitions', 'nft-definitions'],
        backendTypes: ['blockbook'],
        accountTypes: {
            ledger: {
                // ledger (live), #1 acc is same as Trezor, so it is skipped
                accountType: 'ledger',
                bip43Path: "m/44'/60'/i'/0/0",
                isDebugOnlyAccountType: true,
            },
        },
        coingeckoId: 'optimistic-ethereum',
        coingeckoNativeId: 'ethereum',
        isDebugOnlyNetwork: true,
    },
    sol: {
        symbol: 'sol',
        name: 'Solana',
        networkType: 'solana',
        bip43Path: "m/44'/501'/i'/0'", // phantom - bip44Change
        decimals: 9,
        testnet: false,
        features: ['tokens', 'coin-definitions', 'staking'],
        explorer: getExplorerUrls('https://solscan.io', 'solana'),
        support: {
            [DeviceModelInternal.T2T1]: '2.6.4',
            [DeviceModelInternal.T2B1]: '2.6.4',
            [DeviceModelInternal.T3B1]: '2.0.0',
            [DeviceModelInternal.T3T1]: '2.0.0',
            [DeviceModelInternal.T3W1]: '2.0.0',
        },
        backendTypes: ['solana'],
        accountTypes: {
            ledger: {
                // bip44Change - Ledger Live
                accountType: 'ledger',
                bip43Path: "m/44'/501'/i'",
                isDebugOnlyAccountType: true,
            },
        },
        coingeckoId: 'solana',
        coingeckoNativeId: 'solana',
    },
    ada: {
        // icarus derivation
        symbol: 'ada',
        name: 'Cardano',
        networkType: 'cardano',
        bip43Path: "m/1852'/1815'/i'",
        decimals: 6,
        testnet: false,
        features: ['tokens', 'staking', 'coin-definitions'],
        explorer: getExplorerUrls('https://cexplorer.io', 'cardano'),
        support: {
            [DeviceModelInternal.T2T1]: '2.4.3',
            [DeviceModelInternal.T2B1]: '2.0.0',
            [DeviceModelInternal.T3B1]: '2.0.0',
            [DeviceModelInternal.T3T1]: '2.0.0',
            [DeviceModelInternal.T3W1]: '2.0.0',
        },
        backendTypes: ['blockfrost'],
        accountTypes: {
            legacy: {
                // icarus-trezor derivation, differs from default just for 24 words seed
                accountType: 'legacy',
                bip43Path: "m/1852'/1815'/i'",
                isDebugOnlyAccountType: true,
            },
            ledger: {
                // ledger derivation
                accountType: 'ledger',
                bip43Path: "m/1852'/1815'/i'",
                isDebugOnlyAccountType: true,
            },
        },
        coingeckoId: 'cardano',
        coingeckoNativeId: 'cardano',
    },
    etc: {
        symbol: 'etc',
        name: 'Ethereum Classic',
        networkType: 'ethereum',
        chainId: 61,
        bip43Path: "m/44'/61'/0'/0/i",
        decimals: 18,
        testnet: false,
        explorer: getExplorerUrls('https://etc1.trezor.io', 'ethereum'),
        features: ['sign-verify', 'tokens', 'coin-definitions', 'nfts', 'nft-definitions'],
        backendTypes: ['blockbook'],
        accountTypes: {},
        coingeckoId: 'ethereum-classic',
        coingeckoNativeId: 'ethereum-classic',
    },
    xrp: {
        symbol: 'xrp',
        name: 'XRP',
        networkType: 'ripple',
        bip43Path: "m/44'/144'/i'/0/0",
        decimals: 6,
        testnet: false,
        explorer: getExplorerUrls('https://xrpscan.com', 'ripple'),
        features: [],
        backendTypes: ['ripple'],
        accountTypes: {},
        coingeckoId: 'ripple',
        coingeckoNativeId: 'ripple',
    },
    ltc: {
        symbol: 'ltc',
        name: 'Litecoin',
        networkType: 'bitcoin',
        bip43Path: "m/84'/2'/i'",
        decimals: 8,
        testnet: false,
        explorer: getExplorerUrls('https://ltc1.trezor.io', 'bitcoin'),
        features: ['sign-verify'],
        backendTypes: ['blockbook'],
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
        coingeckoNativeId: 'litecoin',
    },
    bch: {
        symbol: 'bch',
        name: 'Bitcoin Cash',
        networkType: 'bitcoin',
        bip43Path: "m/44'/145'/i'",
        decimals: 8,
        testnet: false,
        explorer: getExplorerUrls('https://bch1.trezor.io', 'bitcoin'),
        features: ['sign-verify'],
        backendTypes: ['blockbook'],
        accountTypes: {},
        coingeckoId: 'bitcoin-cash',
        coingeckoNativeId: 'bitcoin-cash',
    },
    doge: {
        symbol: 'doge',
        name: 'Dogecoin',
        networkType: 'bitcoin',
        bip43Path: "m/44'/3'/i'",
        decimals: 8,
        testnet: false,
        explorer: getExplorerUrls('https://doge1.trezor.io', 'bitcoin'),
        features: ['sign-verify'],
        backendTypes: ['blockbook'],
        accountTypes: {},
        coingeckoId: 'dogecoin',
        coingeckoNativeId: 'dogecoin',
    },
    zec: {
        symbol: 'zec',
        name: 'Zcash',
        networkType: 'bitcoin',
        bip43Path: "m/44'/133'/i'",
        decimals: 8,
        testnet: false,
        explorer: getExplorerUrls('https://zec1.trezor.io', 'bitcoin'),
        features: ['sign-verify'],
        backendTypes: ['blockbook'],
        accountTypes: {},
        coingeckoId: 'zcash',
        coingeckoNativeId: 'zcash',
    },
    dash: {
        symbol: 'dash',
        name: 'Dash',
        networkType: 'bitcoin',
        bip43Path: "m/44'/5'/i'",
        decimals: 8,
        testnet: false,
        explorer: getExplorerUrls('https://dash1.trezor.io', 'bitcoin'),
        features: ['sign-verify'],
        backendTypes: ['blockbook'],
        accountTypes: {},
        coingeckoId: 'dash',
        coingeckoNativeId: 'dash',
    },
    btg: {
        symbol: 'btg',
        name: 'Bitcoin Gold',
        networkType: 'bitcoin',
        bip43Path: "m/49'/156'/i'",
        decimals: 8,
        testnet: false,
        explorer: getExplorerUrls('https://btg1.trezor.io', 'bitcoin'),
        features: ['sign-verify'],
        backendTypes: ['blockbook'],
        accountTypes: {
            legacy: {
                accountType: 'legacy',
                bip43Path: "m/44'/156'/i'",
            },
        },
        coingeckoId: 'bitcoin-gold',
        coingeckoNativeId: 'bitcoin-gold',
    },
    dgb: {
        symbol: 'dgb',
        name: 'DigiByte',
        networkType: 'bitcoin',
        bip43Path: "m/49'/20'/i'",
        decimals: 8,
        testnet: false,
        explorer: getExplorerUrls('https://dgb1.trezor.io', 'bitcoin'),
        features: ['sign-verify'],
        backendTypes: ['blockbook'],
        accountTypes: {
            legacy: {
                accountType: 'legacy',
                bip43Path: "m/44'/20'/i'",
            },
        },
        coingeckoId: 'digibyte',
        coingeckoNativeId: 'digibyte',
    },
    nmc: {
        symbol: 'nmc',
        name: 'Namecoin',
        networkType: 'bitcoin',
        bip43Path: "m/44'/7'/i'",
        decimals: 8,
        testnet: false,
        explorer: getExplorerUrls('https://nmc1.trezor.io', 'bitcoin'),
        features: ['sign-verify'],
        backendTypes: ['blockbook'],
        accountTypes: {},
        coingeckoId: 'namecoin',
        coingeckoNativeId: 'namecoin',
    },
    vtc: {
        symbol: 'vtc',
        name: 'Vertcoin',
        networkType: 'bitcoin',
        bip43Path: "m/84'/28'/i'",
        decimals: 8,
        testnet: false,
        explorer: getExplorerUrls('https://vtc1.trezor.io', 'bitcoin'),
        features: ['sign-verify'],
        backendTypes: ['blockbook'],
        accountTypes: {
            segwit: {
                accountType: 'segwit',
                bip43Path: "m/49'/28'/i'",
            },
            legacy: {
                accountType: 'legacy',
                bip43Path: "m/44'/28'/i'",
            },
        },
        coingeckoId: 'vertcoin',
        coingeckoNativeId: 'vertcoin',
    },
    // testnets
    test: {
        symbol: 'test',
        name: 'Bitcoin Testnet',
        networkType: 'bitcoin',
        bip43Path: "m/84'/1'/i'",
        decimals: 8,
        testnet: true,
        explorer: getExplorerUrls('https://tbtc1.trezor.io', 'bitcoin'),
        features: ['rbf', 'sign-verify', 'amount-unit'],
        backendTypes: ['blockbook', 'electrum'],
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
        coingeckoNativeId: 'test-bitcoin', // fake, coingecko does not have testnets
    },
    regtest: {
        symbol: 'regtest',
        name: 'Bitcoin Regtest',
        networkType: 'bitcoin',
        bip43Path: "m/84'/1'/i'",
        decimals: 8,
        testnet: true,
        explorer: getExplorerUrls('http://localhost:19121', 'bitcoin'),
        features: ['rbf', 'sign-verify', 'amount-unit'],
        backendTypes: ['blockbook', 'electrum'],
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
        coingeckoNativeId: undefined,
    },
    tsep: {
        symbol: 'tsep',
        name: 'Ethereum Sepolia',
        networkType: 'ethereum',
        bip43Path: "m/44'/1'/0'/0/i",
        chainId: 11155111,
        decimals: 18,
        testnet: true,
        explorer: getExplorerUrls('https://sepolia1.trezor.io', 'ethereum'),
        features: ['rbf', 'sign-verify', 'tokens', 'nfts', 'nft-definitions'],
        backendTypes: ['blockbook'],
        accountTypes: {},
        coingeckoId: undefined,
        coingeckoNativeId: undefined,
    },
    thol: {
        symbol: 'thol',
        name: 'Ethereum Holesky',
        networkType: 'ethereum',
        bip43Path: "m/44'/1'/0'/0/i",
        chainId: 17000,
        decimals: 18,
        testnet: true,
        explorer: getExplorerUrls('https://holesky1.trezor.io', 'ethereum'),
        features: ['rbf', 'sign-verify', 'tokens', 'nfts', 'nft-definitions'],
        backendTypes: ['blockbook'],
        accountTypes: {},
        coingeckoId: undefined,
        coingeckoNativeId: undefined,
    },
    dsol: {
        symbol: 'dsol',
        name: 'Solana Devnet',
        networkType: 'solana',
        bip43Path: "m/44'/501'/i'/0'",
        decimals: 9,
        testnet: true,
        features: ['tokens', 'staking'],
        explorer: getExplorerUrls('https://solscan.io', 'solana', true),
        support: {
            [DeviceModelInternal.T2T1]: '2.6.4',
            [DeviceModelInternal.T2B1]: '2.6.4',
            [DeviceModelInternal.T3B1]: '2.0.0',
            [DeviceModelInternal.T3T1]: '2.0.0',
            [DeviceModelInternal.T3W1]: '2.0.0',
        },
        backendTypes: ['solana'],
        accountTypes: {},
        coingeckoId: undefined,
        coingeckoNativeId: undefined,
    },
    tada: {
        // icarus derivation
        symbol: 'tada',
        name: 'Cardano Testnet',
        networkType: 'cardano',
        bip43Path: "m/1852'/1815'/i'",
        decimals: 6,
        testnet: true,
        features: ['tokens', 'staking'],
        explorer: getExplorerUrls('https://preview.cexplorer.io', 'cardano'),
        support: {
            [DeviceModelInternal.T2T1]: '2.4.3',
            [DeviceModelInternal.T2B1]: '2.6.1',
            [DeviceModelInternal.T3B1]: '2.0.0',
            [DeviceModelInternal.T3T1]: '2.0.0',
            [DeviceModelInternal.T3W1]: '2.0.0',
        },
        backendTypes: ['blockfrost'],
        accountTypes: {
            legacy: {
                // icarus-trezor derivation
                accountType: 'legacy',
                bip43Path: "m/1852'/1815'/i'",
            },
            ledger: {
                // ledger derivation
                accountType: 'ledger',
                bip43Path: "m/1852'/1815'/i'",
            },
        },
        coingeckoId: undefined,
        coingeckoNativeId: undefined,
    },
    txrp: {
        symbol: 'txrp',
        name: 'XRP Testnet',
        networkType: 'ripple',
        bip43Path: "m/44'/144'/i'/0/0",
        decimals: 6,
        testnet: true,
        explorer: getExplorerUrls('https://test.bithomp.com', 'ripple'),
        features: ['tokens'],
        backendTypes: [],
        accountTypes: {},
        coingeckoId: undefined,
        coingeckoNativeId: 'test-ripple', // fake, coingecko does not have testnets
    },
} as const satisfies Networks;
