import { DeviceModelInternal } from '@trezor/connect';
import type { Keys, Without } from '@trezor/type-utils';

export const networks = {
    btc: {
        name: 'Bitcoin',
        networkType: 'bitcoin',
        bip43Path: "m/84'/0'/i'",
        decimals: 8,
        testnet: false,
        explorer: {
            tx: 'https://btc1.trezor.io/tx/',
            account: 'https://btc1.trezor.io/xpub/',
            address: 'https://btc1.trezor.io/address/',
            queryString: '',
        },
        features: ['rbf', 'sign-verify', 'amount-unit'],
        customBackends: ['blockbook', 'electrum'],
        accountTypes: {
            coinjoin: {
                bip43Path: "m/10025'/0'/i'/1'", // https://github.com/satoshilabs/slips/blob/master/slip-0025.md#public-key-derivation
                backendType: 'coinjoin', // use non-standard backend
                features: ['rbf', 'amount-unit'], // no sign-verify
            },
            taproot: {
                bip43Path: "m/86'/0'/i'",
                features: ['rbf', 'amount-unit'], // no sign-verify
            },
            segwit: {
                bip43Path: "m/49'/0'/i'",
            },
            legacy: {
                bip43Path: "m/44'/0'/i'",
            },
        },
        coingeckoId: 'bitcoin',
    },
    ltc: {
        name: 'Litecoin',
        networkType: 'bitcoin',
        bip43Path: "m/84'/2'/i'",
        decimals: 8,
        testnet: false,
        explorer: {
            tx: 'https://ltc1.trezor.io/tx/',
            account: 'https://ltc1.trezor.io/xpub/',
            address: 'https://ltc1.trezor.io/address/',
            queryString: '',
        },
        features: ['sign-verify'],
        customBackends: ['blockbook'],
        accountTypes: {
            segwit: {
                bip43Path: "m/49'/2'/i'",
            },
            legacy: {
                bip43Path: "m/44'/2'/i'",
            },
        },
        coingeckoId: 'litecoin',
    },
    eth: {
        name: 'Ethereum',
        networkType: 'ethereum',
        chainId: 1,
        bip43Path: "m/44'/60'/0'/0/i",
        decimals: 18,
        testnet: false,
        explorer: {
            tx: 'https://eth1.trezor.io/tx/',
            account: 'https://eth1.trezor.io/address/',
            nft: 'https://eth1.trezor.io/nft/',
            address: 'https://eth1.trezor.io/address/',
            queryString: '',
        },
        features: [
            'rbf',
            'sign-verify',
            'tokens',
            'coin-definitions',
            'nft-definitions',
            'staking',
        ],
        label: 'TR_INCLUDING_TOKENS',
        customBackends: ['blockbook'],
        accountTypes: {},
        coingeckoId: 'ethereum',
    },
    etc: {
        name: 'Ethereum Classic',
        networkType: 'ethereum',
        chainId: 61,
        bip43Path: "m/44'/61'/0'/0/i",
        decimals: 18,
        testnet: false,
        explorer: {
            tx: 'https://etc1.trezor.io/tx/',
            account: 'https://etc1.trezor.io/address/',
            nft: 'https://etc1.trezor.io/nft/',
            address: 'https://etc1.trezor.io/address/',
            queryString: '',
        },
        features: ['sign-verify', 'tokens', 'coin-definitions'],
        label: 'TR_INCLUDING_TOKENS',
        customBackends: ['blockbook'],
        accountTypes: {},
        coingeckoId: 'ethereum-classic',
    },
    // Ripple
    xrp: {
        name: 'XRP',
        networkType: 'ripple',
        bip43Path: "m/44'/144'/i'/0/0",
        decimals: 6,
        testnet: false,
        explorer: {
            tx: 'https://xrpscan.com/tx/',
            account: 'https://xrpscan.com/account/',
            address: 'https://xrpscan.com/account/',
            queryString: '',
        },
        features: [],
        customBackends: [],
        accountTypes: {},
        coingeckoId: 'ripple',
    },
    bch: {
        name: 'Bitcoin Cash',
        networkType: 'bitcoin',
        bip43Path: "m/44'/145'/i'",
        decimals: 8,
        testnet: false,
        explorer: {
            tx: 'https://bch1.trezor.io/tx/',
            account: 'https://bch1.trezor.io/xpub/',
            address: 'https://bch1.trezor.io/address/',
            queryString: '',
        },
        features: ['sign-verify'],
        customBackends: ['blockbook'],
        accountTypes: {},
        coingeckoId: 'bitcoin-cash',
    },
    btg: {
        name: 'Bitcoin Gold',
        networkType: 'bitcoin',
        bip43Path: "m/49'/156'/i'",
        decimals: 8,
        testnet: false,
        explorer: {
            tx: 'https://btg1.trezor.io/tx/',
            account: 'https://btg1.trezor.io/xpub/',
            address: 'https://btg1.trezor.io/address/',
            queryString: '',
        },
        features: ['sign-verify'],
        customBackends: ['blockbook'],
        accountTypes: {
            legacy: {
                bip43Path: "m/44'/156'/i'",
            },
        },
        coingeckoId: 'bitcoin-gold',
    },
    dash: {
        name: 'Dash',
        networkType: 'bitcoin',
        bip43Path: "m/44'/5'/i'",
        decimals: 8,
        testnet: false,
        explorer: {
            tx: 'https://dash1.trezor.io/tx/',
            account: 'https://dash1.trezor.io/xpub/',
            address: 'https://dash1.trezor.io/address/',
            queryString: '',
        },
        features: ['sign-verify'],
        customBackends: ['blockbook'],
        accountTypes: {},
        coingeckoId: 'dash',
    },
    dgb: {
        name: 'DigiByte',
        networkType: 'bitcoin',
        bip43Path: "m/49'/20'/i'",
        decimals: 8,
        testnet: false,
        explorer: {
            tx: 'https://dgb1.trezor.io/tx/',
            account: 'https://dgb1.trezor.io/xpub/',
            address: 'https://dgb1.trezor.io/address/',
            queryString: '',
        },
        features: ['sign-verify'],
        customBackends: ['blockbook'],
        accountTypes: {
            legacy: {
                bip43Path: "m/44'/20'/i'",
            },
        },
        coingeckoId: 'digibyte',
    },
    doge: {
        name: 'Dogecoin',
        networkType: 'bitcoin',
        bip43Path: "m/44'/3'/i'",
        decimals: 8,
        testnet: false,
        explorer: {
            tx: 'https://doge1.trezor.io/tx/',
            account: 'https://doge1.trezor.io/xpub/',
            address: 'https://doge1.trezor.io/address/',
            queryString: '',
        },
        features: ['sign-verify'],
        customBackends: ['blockbook'],
        accountTypes: {},
        coingeckoId: 'dogecoin',
    },
    nmc: {
        name: 'Namecoin',
        networkType: 'bitcoin',
        bip43Path: "m/44'/7'/i'",
        decimals: 8,
        testnet: false,
        explorer: {
            tx: 'https://nmc1.trezor.io/tx/',
            account: 'https://nmc1.trezor.io/xpub/',
            address: 'https://nmc1.trezor.io/address/',
            queryString: '',
        },
        features: ['sign-verify'],
        customBackends: ['blockbook'],
        accountTypes: {},
        coingeckoId: 'namecoin',
    },
    vtc: {
        name: 'Vertcoin',
        networkType: 'bitcoin',
        bip43Path: "m/84'/28'/i'",
        decimals: 8,
        testnet: false,
        explorer: {
            tx: 'https://vtc1.trezor.io/tx/',
            account: 'https://vtc1.trezor.io/xpub/',
            address: 'https://vtc1.trezor.io/address/',
            queryString: '',
        },
        features: ['sign-verify'],
        customBackends: ['blockbook'],
        accountTypes: {
            segwit: {
                bip43Path: "m/49'/28'/i'",
            },
            legacy: {
                bip43Path: "m/44'/28'/i'",
            },
        },
        coingeckoId: 'vertcoin',
    },
    zec: {
        name: 'Zcash',
        networkType: 'bitcoin',
        bip43Path: "m/44'/133'/i'",
        decimals: 8,
        testnet: false,
        explorer: {
            tx: 'https://zec1.trezor.io/tx/',
            account: 'https://zec1.trezor.io/xpub/',
            address: 'https://zec1.trezor.io/address/',
            queryString: '',
        },
        features: ['sign-verify'],
        customBackends: ['blockbook'],
        accountTypes: {},
        coingeckoId: 'zcash',
    },
    ada: {
        // icarus derivation
        name: 'Cardano',
        networkType: 'cardano',
        bip43Path: "m/1852'/1815'/i'",
        decimals: 6,
        testnet: false,
        features: ['tokens', 'staking', 'coin-definitions'],
        explorer: {
            tx: 'https://cexplorer.io/tx/',
            address: 'https://cexplorer.io/address/',
            account: 'https://cexplorer.io/address/',
            token: 'https://cexplorer.io/asset/',
            queryString: '',
        },
        support: {
            [DeviceModelInternal.T2T1]: '2.4.3',
            [DeviceModelInternal.T2B1]: '2.6.1',
            [DeviceModelInternal.T3T1]: '2.7.1',
        },
        label: 'TR_INCLUDING_TOKENS',
        customBackends: ['blockfrost'],
        accountTypes: {
            legacy: {
                // icarus-trezor derivation
                bip43Path: "m/1852'/1815'/i'",
            },
            ledger: {
                // ledger derivation
                bip43Path: "m/1852'/1815'/i'",
            },
        },
        coingeckoId: 'cardano',
    },
    sol: {
        name: 'Solana',
        networkType: 'solana',
        bip43Path: "m/44'/501'/i'/0'",
        decimals: 9,
        testnet: false,
        features: ['tokens', 'coin-definitions' /*, 'staking' */],
        explorer: {
            tx: 'https://explorer.solana.com/tx/',
            account: 'https://explorer.solana.com/address/',
            address: 'https://explorer.solana.com/address/',
            queryString: '',
        },
        support: {
            [DeviceModelInternal.T2T1]: '2.6.4',
            [DeviceModelInternal.T2B1]: '2.6.4',
            [DeviceModelInternal.T3T1]: '2.7.1',
        },
        label: 'TR_INCLUDING_TOKENS',
        customBackends: ['solana'],
        accountTypes: {},
        coingeckoId: 'solana',
    },
    matic: {
        name: 'Polygon PoS',
        networkType: 'ethereum',
        chainId: 137,
        bip43Path: "m/44'/60'/0'/0/i",
        decimals: 18,
        testnet: false,
        label: 'TR_INCLUDING_TOKENS',
        explorer: {
            tx: 'https://matic2.trezor.io/tx/',
            account: 'https://matic2.trezor.io/address/',
            nft: 'https://matic2.trezor.io/nft/',
            address: 'https://matic2.trezor.io/address/',
            queryString: '',
        },
        features: ['rbf', 'sign-verify', 'tokens', 'coin-definitions', 'nft-definitions'],
        customBackends: ['blockbook'],
        accountTypes: {},
        coingeckoId: 'polygon-pos',
    },
    bsc: {
        name: 'BNB Smart Chain',
        networkType: 'ethereum',
        chainId: 56,
        bip43Path: "m/44'/60'/0'/0/i",
        decimals: 18,
        testnet: false,
        explorer: {
            tx: 'https://bsc1.trezor.io/tx/',
            account: 'https://bsc1.trezor.io/address/',
            nft: 'https://bsc1.trezor.io/nft/',
            address: 'https://bsc1.trezor.io/address/',
            queryString: '',
        },
        features: ['rbf', 'sign-verify', 'tokens', 'coin-definitions', 'nft-definitions'],
        label: 'TR_INCLUDING_TOKENS',
        customBackends: ['blockbook'],
        accountTypes: {},
        coingeckoId: 'binance-smart-chain',
        isDebugOnly: true,
    },
    // testnets
    test: {
        name: 'Bitcoin Testnet',
        networkType: 'bitcoin',
        bip43Path: "m/84'/1'/i'",
        decimals: 8,
        testnet: true,
        label: 'TR_TESTNET_COINS_LABEL',
        explorer: {
            tx: 'https://tbtc1.trezor.io/tx/',
            account: 'https://tbtc1.trezor.io/xpub/',
            address: 'https://tbtc1.trezor.io/address/',
            queryString: '',
        },
        features: ['rbf', 'sign-verify', 'amount-unit'],
        customBackends: ['blockbook', 'electrum'],
        accountTypes: {
            coinjoin: {
                bip43Path: "m/10025'/1'/i'/1'", // https://github.com/satoshilabs/slips/blob/master/slip-0025.md#public-key-derivation
                backendType: 'coinjoin', // use non-standard backend
                features: ['rbf', 'amount-unit'], // no sign-verify
            },
            taproot: {
                bip43Path: "m/86'/1'/i'",
                features: ['rbf', 'amount-unit'], // no sign-verify
            },
            segwit: {
                bip43Path: "m/49'/1'/i'",
            },
            legacy: {
                bip43Path: "m/44'/1'/i'",
            },
        },
        coingeckoId: undefined,
    },
    regtest: {
        name: 'Bitcoin Regtest',
        networkType: 'bitcoin',
        bip43Path: "m/84'/1'/i'",
        decimals: 8,
        testnet: true,
        label: 'TR_TESTNET_COINS_LABEL',
        explorer: {
            tx: 'http://localhost:19121/tx/',
            account: 'http://localhost:19121/xpub/',
            address: 'http://localhost:19121/address/',
            queryString: '',
        },
        features: ['rbf', 'sign-verify', 'amount-unit'],
        customBackends: ['blockbook', 'electrum'],
        accountTypes: {
            coinjoin: {
                bip43Path: "m/10025'/1'/i'/1'", // https://github.com/satoshilabs/slips/blob/master/slip-0025.md#public-key-derivation
                backendType: 'coinjoin', // use non-standard backend
                features: ['rbf', 'amount-unit'], // no sign-verify
            },
            taproot: {
                bip43Path: "m/86'/1'/i'",
                features: ['rbf', 'amount-unit'], // no sign-verify
            },
            segwit: {
                bip43Path: "m/49'/1'/i'",
            },
            legacy: {
                bip43Path: "m/44'/1'/i'",
            },
        },
        isDebugOnly: true,
        coingeckoId: undefined,
    },
    tsep: {
        name: 'Ethereum Sepolia',
        networkType: 'ethereum',
        bip43Path: "m/44'/1'/0'/0/i",
        chainId: 11155111,
        decimals: 18,
        testnet: true,
        label: 'TR_TESTNET_COINS_LABEL',
        explorer: {
            tx: 'https://sepolia1.trezor.io/tx/',
            account: 'https://sepolia1.trezor.io/address/',
            nft: 'https://sepolia1.trezor.io/nft/',
            address: 'https://sepolia1.trezor.io/address/',
            queryString: '',
        },
        features: ['rbf', 'sign-verify', 'tokens'],
        customBackends: ['blockbook'],
        accountTypes: {},
        coingeckoId: undefined,
    },
    thol: {
        name: 'Ethereum Holesky',
        networkType: 'ethereum',
        bip43Path: "m/44'/1'/0'/0/i",
        chainId: 17000,
        decimals: 18,
        testnet: true,
        label: 'TR_TESTNET_COINS_LABEL',
        explorer: {
            tx: 'https://holesky1.trezor.io/tx/',
            account: 'https://holesky1.trezor.io/address/',
            nft: 'https://holesky1.trezor.io/nft/',
            address: 'https://holesky1.trezor.io/address/',
            queryString: '',
        },
        features: ['rbf', 'sign-verify', 'tokens', 'staking'],
        customBackends: ['blockbook'],
        accountTypes: {},
        coingeckoId: undefined,
    },
    txrp: {
        name: 'XRP Testnet',
        networkType: 'ripple',
        bip43Path: "m/44'/144'/i'/0/0",
        decimals: 6,
        testnet: true,
        label: 'TR_TESTNET_COINS_LABEL',
        explorer: {
            tx: 'https://test.bithomp.com/explorer/',
            account: 'https://test.bithomp.com/explorer/',
            address: 'https://test.bithomp.com/explorer/',
            queryString: '',
        },
        features: ['tokens'],
        customBackends: [],
        accountTypes: {},
        coingeckoId: undefined,
    },
    tada: {
        // icarus derivation
        name: 'Cardano Testnet',
        networkType: 'cardano',
        bip43Path: "m/1852'/1815'/i'",
        label: 'TR_TESTNET_COINS_LABEL',
        decimals: 6,
        testnet: true,
        features: ['tokens', 'staking'],
        explorer: {
            tx: 'https://preview.cexplorer.io/tx/',
            address: 'https://preview.cexplorer.io/address/',
            account: 'https://preview.cexplorer.io/address/',
            token: 'https://preview.cexplorer.io/asset/',
            queryString: '',
        },
        support: {
            [DeviceModelInternal.T2T1]: '2.4.3',
            [DeviceModelInternal.T2B1]: '2.6.1',
            [DeviceModelInternal.T3T1]: '2.7.1',
        },
        customBackends: ['blockfrost'],
        accountTypes: {
            legacy: {
                // icarus-trezor derivation
                bip43Path: "m/1852'/1815'/i'",
            },
            ledger: {
                // ledger derivation
                bip43Path: "m/1852'/1815'/i'",
            },
        },
        coingeckoId: undefined,
    },
    dsol: {
        name: 'Solana Devnet',
        networkType: 'solana',
        bip43Path: "m/44'/501'/i'/0'",
        label: 'TR_TESTNET_COINS_LABEL',
        decimals: 9,
        testnet: true,
        features: ['tokens' /* , 'staking' */],
        explorer: {
            tx: 'https://explorer.solana.com/tx/',
            account: 'https://explorer.solana.com/address/',
            address: 'https://explorer.solana.com/address/',
            queryString: '?cluster=devnet',
        },
        support: {
            [DeviceModelInternal.T2T1]: '2.6.4',
            [DeviceModelInternal.T2B1]: '2.6.4',
            [DeviceModelInternal.T3T1]: '2.7.1',
        },
        customBackends: ['solana'],
        accountTypes: {},
        coingeckoId: undefined,
    },
} as const;

export const TREZOR_CONNECT_BACKENDS = [
    'blockbook',
    'electrum',
    'ripple',
    'blockfrost',
    'solana',
] as const;
export const NON_STANDARD_BACKENDS = ['coinjoin'] as const;

export type BackendType =
    | (typeof TREZOR_CONNECT_BACKENDS)[number]
    | (typeof NON_STANDARD_BACKENDS)[number];

type Networks = typeof networks;
export type NetworkSymbol = keyof Networks;
export type NetworkType = Network['networkType'];
type NetworkValue = Networks[NetworkSymbol];
export type AccountType = Keys<NetworkValue['accountTypes']> | 'imported' | 'taproot' | 'normal';
export type NetworkFeature =
    | 'rbf'
    | 'sign-verify'
    | 'amount-unit'
    | 'tokens'
    | 'staking'
    | 'coin-definitions'
    | 'nft-definitions';
export type Network = Without<NetworkValue, 'accountTypes'> & {
    symbol: NetworkSymbol;
    accountType?: AccountType;
    backendType?: BackendType;
    testnet?: boolean;
    isHidden?: boolean;
    chainId?: number;
    features?: NetworkFeature[];
    label?: string[]; // Originally ExtendedMessageDescriptor['id'] but inferred type exceeds the maximum length for serialization
    support?: {
        [key in DeviceModelInternal]: string;
    };
    isDebugOnly?: boolean;
    coingeckoId?: string;
};

// Transforms the network object into the previously used format so we don't have to change
// every occurence. We could gradually start to use the network object directly and in the end
// this could be removed.
export const networksCompatibility: Network[] = Object.entries(networks).flatMap(
    ([symbol, { accountTypes, ...network }]) => [
        { symbol, ...network },
        ...Object.entries(accountTypes).map(([accountType, networkOverride]) => ({
            symbol,
            accountType,
            ...network,
            ...networkOverride,
        })),
    ],
);

export const getMainnets = (debug = false) =>
    networksCompatibility.filter(n => !n.accountType && !n.testnet && (!n.isDebugOnly || debug));

export const getTestnets = (debug = false) =>
    networksCompatibility.filter(
        n => !n.accountType && n.testnet === true && (!n.isDebugOnly || debug),
    );

export const getAllNetworkSymbols = () => networksCompatibility.map(n => n.symbol);

export const getEthereumTypeNetworkSymbols = () =>
    networksCompatibility.filter(n => n.networkType === 'ethereum').map(n => n.symbol);

export const getTestnetSymbols = () => getTestnets().map(n => n.symbol);

export const isBlockbookBasedNetwork = (symbol: NetworkSymbol) =>
    networks[symbol]?.customBackends.some(backend => backend === 'blockbook');

export const getNetworkType = (symbol: NetworkSymbol) => networks[symbol]?.networkType;

// takes into account just network features, not features for specific accountTypes
export const getNetworkFeatures = (symbol: NetworkSymbol) =>
    networks[symbol]?.features as unknown as NetworkFeature;

export const getCoingeckoId = (symbol: NetworkSymbol) => networks[symbol]?.coingeckoId;
