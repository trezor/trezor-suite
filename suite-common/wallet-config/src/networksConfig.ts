import { DeviceModelInternal } from '@trezor/device-utils';
import { typedObjectEntries } from '@trezor/utils';

import { getExplorerUrls } from './getExplorerUrls';
import { type NetworkFeature, type Networks } from './types';

export const networks = {
    btc: {
        symbol: 'btc',
        displaySymbol: 'BTC',
        name: 'Bitcoin',
        networkType: 'bitcoin',
        bip43Path: "m/84'/0'/i'",
        decimals: 8,
        testnet: false,
        explorer: getExplorerUrls('https://mempool.space', 'bitcoin'),
        features: ['rbf', 'sign-verify', 'amount-unit', 'graph'],
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
        tradeCryptoId: 'bitcoin',
        caipId: 'bip122:000000000019d6689c085ae165831e93',
        yieldXyzId: null,
    },
    eth: {
        symbol: 'eth',
        displaySymbol: 'ETH',
        name: 'Ethereum',
        networkType: 'ethereum',
        chainId: 1,
        bip43Path: "m/44'/60'/0'/0/i",
        decimals: 18,
        testnet: false,
        explorer: getExplorerUrls('https://etherscan.io', 'ethereum'),
        features: [
            'rbf',
            'sign-verify',
            'tokens',
            'nfts',
            'coin-definitions',
            'nft-definitions',
            'staking',
            'eip1559',
            'mev-protection',
            'graph',
        ],
        backendTypes: ['blockbook', 'evm-rpc'],
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
        tradeCryptoId: 'ethereum',
        caipId: 'eip155:1',
        yieldXyzId: 'ethereum',
    },
    pol: {
        symbol: 'pol',
        displaySymbol: 'POL',
        displaySymbolName: 'Polygon',
        name: 'Polygon PoS',
        networkType: 'ethereum',
        chainId: 137,
        bip43Path: "m/44'/60'/0'/0/i",
        decimals: 18,
        testnet: false,
        explorer: getExplorerUrls('https://polygonscan.com', 'ethereum'),
        features: [
            'rbf',
            'sign-verify',
            'tokens',
            'nfts',
            'coin-definitions',
            'nft-definitions',
            'eip1559',
            'graph',
        ],
        backendTypes: ['blockbook', 'evm-rpc'],
        accountTypes: {
            ledger: {
                // ledger (live), #1 acc is same as Trezor, so it is skipped
                accountType: 'ledger',
                bip43Path: "m/44'/60'/i'/0/0",
                isDebugOnlyAccountType: true,
            },
        },
        coingeckoId: 'polygon-pos',
        tradeCryptoId: 'polygon-ecosystem-token',
        caipId: 'eip155:137',
        yieldXyzId: 'polygon',
    },
    bsc: {
        symbol: 'bsc',
        displaySymbol: 'BNB',
        displaySymbolName: 'BNB',
        name: 'BNB Smart Chain',
        networkType: 'ethereum',
        chainId: 56,
        bip43Path: "m/44'/60'/0'/0/i",
        decimals: 18,
        testnet: false,
        explorer: getExplorerUrls('https://bscscan.com', 'ethereum'),
        features: [
            'rbf',
            'sign-verify',
            'tokens',
            'nfts',
            'coin-definitions',
            'nft-definitions',
            'mev-protection',
            'graph',
        ],
        backendTypes: ['blockbook', 'evm-rpc'],
        accountTypes: {
            ledger: {
                // ledger (live), #1 acc is same as Trezor, so it is skipped
                accountType: 'ledger',
                bip43Path: "m/44'/60'/i'/0/0",
                isDebugOnlyAccountType: true,
            },
        },
        coingeckoId: 'binance-smart-chain',
        tradeCryptoId: 'binancecoin',
        caipId: 'eip155:56',
        yieldXyzId: 'binance',
    },
    arb: {
        symbol: 'arb',
        settlementLayer: 'eth',
        displaySymbol: 'ETH',
        displaySymbolName: 'Arbitrum One Ethereum',
        name: 'Arbitrum One',
        networkType: 'ethereum',
        chainId: 42161,
        bip43Path: "m/44'/60'/0'/0/i",
        decimals: 18,
        testnet: false,
        explorer: getExplorerUrls('https://arbiscan.io', 'ethereum'),
        features: [
            'rbf',
            'sign-verify',
            'tokens',
            'nfts',
            'coin-definitions',
            'nft-definitions',
            'mev-protection',
            'eip1559',
            'graph',
        ],
        backendTypes: ['blockbook', 'evm-rpc'],
        accountTypes: {
            ledger: {
                // ledger (live), #1 acc is same as Trezor, so it is skipped
                accountType: 'ledger',
                bip43Path: "m/44'/60'/i'/0/0",
                isDebugOnlyAccountType: true,
            },
        },
        coingeckoId: 'arbitrum-one',
        tradeCryptoId: 'arbitrum-one--0x0000000000000000000000000000000000000000',
        caipId: 'eip155:42161',
        yieldXyzId: 'arbitrum',
    },
    base: {
        symbol: 'base',
        settlementLayer: 'eth',
        displaySymbol: 'ETH',
        displaySymbolName: 'Base Ethereum',
        name: 'Base',
        networkType: 'ethereum',
        chainId: 8453,
        bip43Path: "m/44'/60'/0'/0/i",
        decimals: 18,
        testnet: false,
        explorer: getExplorerUrls('https://basescan.org', 'ethereum'),
        features: [
            'rbf',
            'sign-verify',
            'tokens',
            'nfts',
            'coin-definitions',
            'nft-definitions',
            'eip1559',
            'mev-protection',
            'graph',
        ],
        backendTypes: ['blockbook', 'evm-rpc'],
        accountTypes: {
            ledger: {
                // ledger (live), #1 acc is same as Trezor, so it is skipped
                accountType: 'ledger',
                bip43Path: "m/44'/60'/i'/0/0",
                isDebugOnlyAccountType: true,
            },
        },
        coingeckoId: 'base',
        tradeCryptoId: 'base--0x0000000000000000000000000000000000000000',
        caipId: 'eip155:8453',
        nativeTokenReserve: '0.0002',
        yieldXyzId: 'base',
    },
    op: {
        symbol: 'op',
        settlementLayer: 'eth',
        displaySymbol: 'ETH',
        displaySymbolName: 'Optimism Ethereum',
        name: 'Optimism',
        networkType: 'ethereum',
        chainId: 10,
        bip43Path: "m/44'/60'/0'/0/i",
        decimals: 18,
        testnet: false,
        explorer: getExplorerUrls('https://optimistic.etherscan.io', 'ethereum'),
        features: [
            'rbf',
            'sign-verify',
            'tokens',
            'nfts',
            'coin-definitions',
            'nft-definitions',
            'eip1559',
            'graph',
        ],
        backendTypes: ['blockbook', 'evm-rpc'],
        accountTypes: {
            ledger: {
                // ledger (live), #1 acc is same as Trezor, so it is skipped
                accountType: 'ledger',
                bip43Path: "m/44'/60'/i'/0/0",
                isDebugOnlyAccountType: true,
            },
        },
        coingeckoId: 'optimistic-ethereum',
        tradeCryptoId: 'optimistic-ethereum--0x0000000000000000000000000000000000000000',
        caipId: 'eip155:10',
        nativeTokenReserve: '0.0002',
        yieldXyzId: 'optimism',
    },
    avax: {
        symbol: 'avax',
        displaySymbol: 'AVAX',
        displaySymbolName: 'Avalanche',
        name: 'Avalanche C-Chain',
        networkType: 'ethereum',
        chainId: 43114,
        bip43Path: "m/44'/60'/0'/0/i",
        decimals: 18,
        testnet: false,
        explorer: getExplorerUrls('https://snowscan.xyz/', 'ethereum'),
        features: [
            'rbf',
            'sign-verify',
            'tokens',
            'nfts',
            'coin-definitions',
            'nft-definitions',
            'eip1559',
            'graph',
        ],
        backendTypes: ['blockbook', 'evm-rpc'],
        accountTypes: {
            ledger: {
                // ledger (live), #1 acc is same as Trezor, so it is skipped
                accountType: 'ledger',
                bip43Path: "m/44'/60'/i'/0/0",
                isDebugOnlyAccountType: true,
            },
        },
        coingeckoId: 'avalanche',
        tradeCryptoId: 'avalanche-2',
        caipId: 'eip155:43114',
        yieldXyzId: 'avalanche-c',
    },
    sol: {
        symbol: 'sol',
        displaySymbol: 'SOL',
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
        tradeCryptoId: 'solana',
        caipId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
        nativeTokenReserve: '0.003',
        yieldXyzId: 'solana',
    },
    trx: {
        symbol: 'trx',
        displaySymbol: 'TRX',
        name: 'Tron',
        networkType: 'tron',
        bip43Path: "m/44'/195'/0'/0/i",
        decimals: 6,
        testnet: false,
        features: ['tokens', 'coin-definitions', 'graph', 'nfts'],
        explorer: getExplorerUrls('https://tronscan.org/#', 'tron'),
        support: {
            [DeviceModelInternal.T2T1]: '2.11.0',
            [DeviceModelInternal.T2B1]: '2.11.0',
            [DeviceModelInternal.T3B1]: '2.11.0',
            [DeviceModelInternal.T3T1]: '2.11.0',
            [DeviceModelInternal.T3W1]: '2.11.0',
        },
        backendTypes: ['blockbook'],
        accountTypes: {
            ledger: {
                // ledger (live), #1 acc is same as Trezor, so it is skipped
                accountType: 'ledger',
                bip43Path: "m/44'/195'/i'/0/0",
                isDebugOnlyAccountType: true,
            },
        },
        coingeckoId: 'tron',
        tradeCryptoId: 'tron',
        yieldXyzId: 'tron',
    },
    ada: {
        // icarus derivation
        symbol: 'ada',
        displaySymbol: 'ADA',
        name: 'Cardano',
        networkType: 'cardano',
        bip43Path: "m/1852'/1815'/i'",
        decimals: 6,
        testnet: false,
        features: ['tokens', 'staking', 'coin-definitions', 'sign-verify'],
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
        tradeCryptoId: 'cardano',
        yieldXyzId: 'cardano',
    },
    etc: {
        symbol: 'etc',
        displaySymbol: 'ETC',
        name: 'Ethereum Classic',
        networkType: 'ethereum',
        chainId: 61,
        bip43Path: "m/44'/61'/0'/0/i",
        decimals: 18,
        testnet: false,
        explorer: getExplorerUrls('https://etc.trezor.io', 'ethereum'),
        features: ['sign-verify', 'tokens', 'coin-definitions', 'graph'],
        backendTypes: ['blockbook', 'evm-rpc'],
        accountTypes: {},
        coingeckoId: 'ethereum-classic',
        tradeCryptoId: 'ethereum-classic',
        yieldXyzId: null,
    },
    xrp: {
        symbol: 'xrp',
        displaySymbol: 'XRP',
        name: 'XRP Ledger',
        networkType: 'ripple',
        bip43Path: "m/44'/144'/i'/0/0",
        decimals: 6,
        testnet: false,
        explorer: getExplorerUrls('https://xrpscan.com', 'ripple'),
        features: [],
        backendTypes: ['ripple'],
        accountTypes: {},
        coingeckoId: 'ripple',
        tradeCryptoId: 'ripple',
        yieldXyzId: null,
    },
    xlm: {
        symbol: 'xlm',
        displaySymbol: 'XLM',
        name: 'Stellar',
        networkType: 'stellar',
        bip43Path: "m/44'/148'/i'",
        decimals: 7,
        testnet: false,
        explorer: getExplorerUrls('https://stellar.expert/explorer/public', 'stellar'),
        features: ['tokens', 'coin-definitions'],
        backendTypes: ['stellar'],
        accountTypes: {},
        coingeckoId: 'stellar',
        tradeCryptoId: 'stellar',
        yieldXyzId: 'stellar',
        caipId: 'stellar:pubnet',
    },
    ltc: {
        symbol: 'ltc',
        displaySymbol: 'LTC',
        name: 'Litecoin',
        networkType: 'bitcoin',
        bip43Path: "m/84'/2'/i'",
        decimals: 8,
        testnet: false,
        explorer: getExplorerUrls('https://blockchair.com/litecoin', 'bitcoin'),
        features: ['sign-verify', 'graph'],
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
        tradeCryptoId: 'litecoin',
        caipId: 'bip122:12a765e31ffd4059bada1e25190f6e98',
        yieldXyzId: null,
    },
    bch: {
        symbol: 'bch',
        displaySymbol: 'BCH',
        name: 'Bitcoin Cash',
        networkType: 'bitcoin',
        bip43Path: "m/44'/145'/i'",
        decimals: 8,
        testnet: false,
        explorer: getExplorerUrls('https://blockchair.com/bitcoin-cash', 'bitcoin'),
        features: ['sign-verify', 'graph'],
        backendTypes: ['blockbook'],
        accountTypes: {},
        coingeckoId: 'bitcoin-cash',
        tradeCryptoId: 'bitcoin-cash',
        yieldXyzId: null,
    },
    doge: {
        symbol: 'doge',
        displaySymbol: 'DOGE',
        name: 'Dogecoin',
        networkType: 'bitcoin',
        bip43Path: "m/44'/3'/i'",
        decimals: 8,
        testnet: false,
        explorer: getExplorerUrls('https://blockchair.com/dogecoin', 'bitcoin'),
        features: ['sign-verify', 'graph'],
        backendTypes: ['blockbook'],
        accountTypes: {},
        coingeckoId: 'dogecoin',
        tradeCryptoId: 'dogecoin',
        caipId: 'bip122:1a91e3dace36e2be3bf030a65679fe82',
        yieldXyzId: null,
    },
    zec: {
        symbol: 'zec',
        displaySymbol: 'ZEC',
        name: 'Zcash',
        networkType: 'bitcoin',
        bip43Path: "m/44'/133'/i'",
        decimals: 8,
        testnet: false,
        explorer: getExplorerUrls('https://blockchair.com/zcash', 'bitcoin'),
        features: ['sign-verify', 'graph'],
        backendTypes: ['blockbook'],
        accountTypes: {},
        coingeckoId: 'zcash',
        tradeCryptoId: 'zcash',
        yieldXyzId: null,
    },
    // testnets
    test: {
        symbol: 'test',
        displaySymbol: 'TEST',
        name: 'Bitcoin Testnet',
        networkType: 'bitcoin',
        bip43Path: "m/84'/1'/i'",
        decimals: 8,
        testnet: true,
        explorer: getExplorerUrls('https://mempool.space/testnet4', 'bitcoin'),
        features: ['rbf', 'sign-verify', 'amount-unit', 'graph'],
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
        tradeCryptoId: 'test-bitcoin', // fake, coingecko does not have testnets
        caipId: 'bip122:000000000933ea01ad0ee984209779ba',
        yieldXyzId: null,
    },
    regtest: {
        symbol: 'regtest',
        displaySymbol: 'REGTEST',
        name: 'Bitcoin Regtest',
        networkType: 'bitcoin',
        bip43Path: "m/84'/1'/i'",
        decimals: 8,
        testnet: true,
        explorer: getExplorerUrls('http://localhost:19121', 'bitcoin'),
        features: ['rbf', 'sign-verify', 'amount-unit', 'graph'],
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
        tradeCryptoId: undefined,
        yieldXyzId: null,
    },
    tsep: {
        symbol: 'tsep',
        displaySymbol: 'tETH',
        name: 'Ethereum Sepolia',
        networkType: 'ethereum',
        bip43Path: "m/44'/1'/0'/0/i",
        chainId: 11155111,
        decimals: 18,
        testnet: true,
        explorer: getExplorerUrls('https://sepolia.etherscan.io', 'ethereum'),
        features: ['rbf', 'sign-verify', 'tokens', 'nfts', 'eip1559', 'graph'],
        backendTypes: ['blockbook', 'evm-rpc'],
        accountTypes: {},
        coingeckoId: 'sepolia-test-ethereum', // fake, coingecko does not have testnets
        tradeCryptoId: 'sepolia-test-ethereum', // fake, coingecko does not have testnets
        yieldXyzId: 'ethereum-sepolia',
    },
    thod: {
        symbol: 'thod',
        displaySymbol: 'tETH',
        name: 'Ethereum Hoodi',
        networkType: 'ethereum',
        bip43Path: "m/44'/1'/0'/0/i",
        chainId: 560048,
        decimals: 18,
        testnet: true,
        explorer: getExplorerUrls('https://hoodi.etherscan.io/', 'ethereum'),
        features: ['rbf', 'sign-verify', 'tokens', 'staking', 'nfts', 'eip1559', 'graph'],
        backendTypes: ['blockbook', 'evm-rpc'],
        accountTypes: {},
        coingeckoId: 'hoodi-test-ethereum', // fake, coingecko does not have testnets
        tradeCryptoId: 'hoodi-test-ethereum', // fake, coingecko does not have testnets
        yieldXyzId: 'ethereum-hoodi',
    },
    dsol: {
        symbol: 'dsol',
        displaySymbol: 'dSOL',
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
        tradeCryptoId: undefined,
        caipId: 'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1',
        yieldXyzId: 'solana-devnet',
    },
    txrp: {
        symbol: 'txrp',
        displaySymbol: 'tXRP',
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
        tradeCryptoId: 'test-ripple', // fake, coingecko does not have testnets
        yieldXyzId: null,
    },
    txlm: {
        symbol: 'txlm',
        displaySymbol: 'tXLM',
        name: 'Stellar Testnet',
        networkType: 'stellar',
        bip43Path: "m/44'/148'/i'",
        decimals: 7,
        testnet: true,
        explorer: getExplorerUrls('https://stellar.expert/explorer/testnet', 'stellar'),
        features: ['tokens'],
        backendTypes: ['stellar'],
        accountTypes: {},
        coingeckoId: undefined,
        tradeCryptoId: undefined,
        yieldXyzId: 'stellar-testnet',
        caipId: 'stellar:testnet',
    },
    ttrx: {
        symbol: 'ttrx',
        displaySymbol: 'tTRX',
        name: 'Tron Nile',
        networkType: 'tron',
        bip43Path: "m/44'/195'/0'/0/i",
        decimals: 6,
        testnet: true,
        features: ['tokens', 'graph', 'nfts'],
        explorer: getExplorerUrls('https://nile.tronscan.org/#', 'tron'),
        backendTypes: ['blockbook'],
        accountTypes: {},
        coingeckoId: undefined,
        tradeCryptoId: 'test-tron',
        yieldXyzId: null,
    },
} as const satisfies Networks;

type NetworksConfigs = typeof networks;

export type NetworkConfig = NetworksConfigs[keyof NetworksConfigs];

export type NetworkConfigWithoutTestnets = Exclude<NetworkConfig, { testnet: true }>;

export type NetworkDisplaySymbol = NetworkConfig['displaySymbol'];

export type NetworkWithFeature<TFeature extends NetworkFeature> = {
    [S in keyof NetworksConfigs]: TFeature extends NetworksConfigs[S]['features'][number]
        ? NetworksConfigs[S]
        : never;
}[keyof NetworksConfigs];

export type StakingNetworkSymbol = NetworkWithFeature<'staking'>['symbol'];

export type StakingNetworkType = NetworksConfigs[StakingNetworkSymbol]['networkType'];

export const [STAKING_SYMBOLS, STAKING_TYPES, PROD_STAKING_SYMBOLS] = typedObjectEntries(
    networks,
).reduce<[StakingNetworkSymbol[], StakingNetworkType[], StakingNetworkSymbol[]]>(
    (acc, [symbol, { features, networkType, testnet }]) => {
        if ((features as readonly string[]).includes('staking')) {
            acc[0].push(symbol as StakingNetworkSymbol);

            if (!testnet) {
                acc[2].push(symbol as StakingNetworkSymbol);
            }

            const t = networkType as StakingNetworkType;
            if (!acc[1].includes(t)) acc[1].push(t);
        }

        return acc;
    },
    [[], [], []],
) as readonly [
    readonly StakingNetworkSymbol[],
    readonly StakingNetworkType[],
    readonly StakingNetworkSymbol[],
];
