import { DeviceModelInternal } from '@trezor/connect';
import type { Without } from '@trezor/type-utils';

export type NetworkSymbol =
    | 'btc'
    | 'ltc'
    | 'eth'
    | 'etc'
    | 'xrp'
    | 'bch'
    | 'btg'
    | 'dash'
    | 'dgb'
    | 'doge'
    | 'nmc'
    | 'vtc'
    | 'zec'
    | 'ada'
    | 'sol'
    | 'matic'
    | 'bnb'
    | 'test'
    | 'regtest'
    | 'tsep'
    | 'thol'
    | 'txrp'
    | 'tada'
    | 'dsol';

export type NetworkType = 'bitcoin' | 'ethereum' | 'ripple' | 'cardano' | 'solana';

type UtilityAccountType = 'normal' | 'imported'; // reserved accountTypes to stand in for a real accountType
type RealAccountType = 'legacy' | 'segwit' | 'coinjoin' | 'taproot' | 'ledger';
export type AccountType = UtilityAccountType | RealAccountType;

export const TREZOR_CONNECT_BACKENDS = [
    'blockbook',
    'electrum',
    'ripple',
    'blockfrost',
    'solana',
] as const;
export const NON_STANDARD_BACKENDS = ['coinjoin'] as const;

type TrezorConnectBackendType = (typeof TREZOR_CONNECT_BACKENDS)[number];
type NonStandardBackendType = (typeof NON_STANDARD_BACKENDS)[number];
export type BackendType = TrezorConnectBackendType | NonStandardBackendType;

export type NetworkFeature =
    | 'rbf'
    | 'sign-verify'
    | 'amount-unit'
    | 'tokens'
    | 'staking'
    | 'coin-definitions'
    | 'nft-definitions';

export type Explorer = {
    tx: string;
    account: string;
    address: string;
    nft?: string;
    token?: string;
    queryString?: string;
};

export type Account = {
    bip43Path: string;
    backendType?: BackendType;
    features?: NetworkFeature[];
    isDebugOnlyAccountType?: boolean;
};

// template types serve only to check if `networks` satisfies it. Exact type is inferred below
export type NetworkAccountTypes = Partial<Record<AccountType, Account>>;

export type NetworkDeviceSupport = Partial<Record<DeviceModelInternal, string>>;

export type Network = {
    symbol: NetworkSymbol;
    name: string;
    networkType: NetworkType;
    bip43Path: string;
    decimals: number;
    testnet: boolean;
    explorer: Explorer;
    accountTypes: NetworkAccountTypes;
    isHidden?: boolean; // not used here, but supported elsewhere
    chainId?: number;
    features: NetworkFeature[];
    customBackends: BackendType[];
    support?: NetworkDeviceSupport;
    isDebugOnlyNetwork?: boolean;
    coingeckoId?: string;
};

export type Networks = {
    [key in NetworkSymbol]: Network;
};

export const networks = {
    btc: {
        symbol: 'btc',
        name: 'Bitcoin',
        networkType: 'bitcoin',
        bip43Path: "m/84'/0'/i'",
        decimals: 8,
        testnet: false,
        explorer: {
            tx: 'https://btc1.trezor.io/tx/',
            account: 'https://btc1.trezor.io/xpub/',
            address: 'https://btc1.trezor.io/address/',
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
        symbol: 'ltc',
        name: 'Litecoin',
        networkType: 'bitcoin',
        bip43Path: "m/84'/2'/i'",
        decimals: 8,
        testnet: false,
        explorer: {
            tx: 'https://ltc1.trezor.io/tx/',
            account: 'https://ltc1.trezor.io/xpub/',
            address: 'https://ltc1.trezor.io/address/',
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
        symbol: 'eth',
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
        },
        features: [
            'rbf',
            'sign-verify',
            'tokens',
            'coin-definitions',
            'nft-definitions',
            'staking',
        ],
        customBackends: ['blockbook'],
        accountTypes: {
            ledger: {
                // ledger (live), #1 acc is same as Trezor, so it is skipped
                bip43Path: "m/44'/60'/i'/0/0",
                isDebugOnlyAccountType: true,
            },
            legacy: {
                // ledger (legacy)
                bip43Path: "m/44'/60'/0'/i",
                isDebugOnlyAccountType: true,
            },
        },
        coingeckoId: 'ethereum',
    },
    etc: {
        symbol: 'etc',
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
        },
        features: ['sign-verify', 'tokens', 'coin-definitions'],
        customBackends: ['blockbook'],
        accountTypes: {},
        coingeckoId: 'ethereum-classic',
    },
    // Ripple
    xrp: {
        symbol: 'xrp',
        name: 'XRP',
        networkType: 'ripple',
        bip43Path: "m/44'/144'/i'/0/0",
        decimals: 6,
        testnet: false,
        explorer: {
            tx: 'https://xrpscan.com/tx/',
            account: 'https://xrpscan.com/account/',
            address: 'https://xrpscan.com/account/',
        },
        features: [],
        customBackends: [],
        accountTypes: {},
        coingeckoId: 'ripple',
    },
    bch: {
        symbol: 'bch',
        name: 'Bitcoin Cash',
        networkType: 'bitcoin',
        bip43Path: "m/44'/145'/i'",
        decimals: 8,
        testnet: false,
        explorer: {
            tx: 'https://bch1.trezor.io/tx/',
            account: 'https://bch1.trezor.io/xpub/',
            address: 'https://bch1.trezor.io/address/',
        },
        features: ['sign-verify'],
        customBackends: ['blockbook'],
        accountTypes: {},
        coingeckoId: 'bitcoin-cash',
    },
    btg: {
        symbol: 'btg',
        name: 'Bitcoin Gold',
        networkType: 'bitcoin',
        bip43Path: "m/49'/156'/i'",
        decimals: 8,
        testnet: false,
        explorer: {
            tx: 'https://btg1.trezor.io/tx/',
            account: 'https://btg1.trezor.io/xpub/',
            address: 'https://btg1.trezor.io/address/',
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
        symbol: 'dash',
        name: 'Dash',
        networkType: 'bitcoin',
        bip43Path: "m/44'/5'/i'",
        decimals: 8,
        testnet: false,
        explorer: {
            tx: 'https://dash1.trezor.io/tx/',
            account: 'https://dash1.trezor.io/xpub/',
            address: 'https://dash1.trezor.io/address/',
        },
        features: ['sign-verify'],
        customBackends: ['blockbook'],
        accountTypes: {},
        coingeckoId: 'dash',
    },
    dgb: {
        symbol: 'dgb',
        name: 'DigiByte',
        networkType: 'bitcoin',
        bip43Path: "m/49'/20'/i'",
        decimals: 8,
        testnet: false,
        explorer: {
            tx: 'https://dgb1.trezor.io/tx/',
            account: 'https://dgb1.trezor.io/xpub/',
            address: 'https://dgb1.trezor.io/address/',
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
        symbol: 'doge',
        name: 'Dogecoin',
        networkType: 'bitcoin',
        bip43Path: "m/44'/3'/i'",
        decimals: 8,
        testnet: false,
        explorer: {
            tx: 'https://doge1.trezor.io/tx/',
            account: 'https://doge1.trezor.io/xpub/',
            address: 'https://doge1.trezor.io/address/',
        },
        features: ['sign-verify'],
        customBackends: ['blockbook'],
        accountTypes: {},
        coingeckoId: 'dogecoin',
    },
    nmc: {
        symbol: 'nmc',
        name: 'Namecoin',
        networkType: 'bitcoin',
        bip43Path: "m/44'/7'/i'",
        decimals: 8,
        testnet: false,
        explorer: {
            tx: 'https://nmc1.trezor.io/tx/',
            account: 'https://nmc1.trezor.io/xpub/',
            address: 'https://nmc1.trezor.io/address/',
        },
        features: ['sign-verify'],
        customBackends: ['blockbook'],
        accountTypes: {},
        coingeckoId: 'namecoin',
    },
    vtc: {
        symbol: 'vtc',
        name: 'Vertcoin',
        networkType: 'bitcoin',
        bip43Path: "m/84'/28'/i'",
        decimals: 8,
        testnet: false,
        explorer: {
            tx: 'https://vtc1.trezor.io/tx/',
            account: 'https://vtc1.trezor.io/xpub/',
            address: 'https://vtc1.trezor.io/address/',
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
        symbol: 'zec',
        name: 'Zcash',
        networkType: 'bitcoin',
        bip43Path: "m/44'/133'/i'",
        decimals: 8,
        testnet: false,
        explorer: {
            tx: 'https://zec1.trezor.io/tx/',
            account: 'https://zec1.trezor.io/xpub/',
            address: 'https://zec1.trezor.io/address/',
        },
        features: ['sign-verify'],
        customBackends: ['blockbook'],
        accountTypes: {},
        coingeckoId: 'zcash',
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
        explorer: {
            tx: 'https://cexplorer.io/tx/',
            address: 'https://cexplorer.io/address/',
            account: 'https://cexplorer.io/address/',
            token: 'https://cexplorer.io/asset/',
        },
        support: {
            [DeviceModelInternal.T2T1]: '2.4.3',
            [DeviceModelInternal.T2B1]: '2.6.1',
            [DeviceModelInternal.T3T1]: '2.7.1',
        },
        customBackends: ['blockfrost'],
        accountTypes: {
            legacy: {
                // icarus-trezor derivation, differs from default just for 24 words seed
                bip43Path: "m/1852'/1815'/i'",
                isDebugOnlyAccountType: true,
            },
            ledger: {
                // ledger derivation
                bip43Path: "m/1852'/1815'/i'",
                isDebugOnlyAccountType: true,
            },
        },
        coingeckoId: 'cardano',
    },
    sol: {
        symbol: 'sol',
        name: 'Solana',
        networkType: 'solana',
        bip43Path: "m/44'/501'/i'/0'", // phantom - bip44Change
        decimals: 9,
        testnet: false,
        features: ['tokens', 'coin-definitions' /*, 'staking' */],
        explorer: {
            tx: 'https://explorer.solana.com/tx/',
            account: 'https://explorer.solana.com/address/',
            address: 'https://explorer.solana.com/address/',
        },
        support: {
            [DeviceModelInternal.T2T1]: '2.6.4',
            [DeviceModelInternal.T2B1]: '2.6.4',
            [DeviceModelInternal.T3T1]: '2.7.1',
        },
        customBackends: ['solana'],
        accountTypes: {
            ledger: {
                // bip44Change - Ledger Live
                bip43Path: "m/44'/501'/i'",
                isDebugOnlyAccountType: true,
            },
        },
        coingeckoId: 'solana',
    },
    matic: {
        symbol: 'matic',
        name: 'Polygon PoS',
        networkType: 'ethereum',
        chainId: 137,
        bip43Path: "m/44'/60'/0'/0/i",
        decimals: 18,
        testnet: false,
        explorer: {
            tx: 'https://matic2.trezor.io/tx/',
            account: 'https://matic2.trezor.io/address/',
            nft: 'https://matic2.trezor.io/nft/',
            address: 'https://matic2.trezor.io/address/',
        },
        features: ['rbf', 'sign-verify', 'tokens', 'coin-definitions', 'nft-definitions'],
        customBackends: ['blockbook'],
        accountTypes: {
            ledger: {
                // ledger (live), #1 acc is same as Trezor, so it is skipped
                bip43Path: "m/44'/60'/i'/0/0",
                isDebugOnlyAccountType: true,
            },
        },
        coingeckoId: 'polygon-pos',
    },
    bnb: {
        symbol: 'bnb',
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
        },
        features: ['rbf', 'sign-verify', 'tokens', 'coin-definitions', 'nft-definitions'],
        customBackends: ['blockbook'],
        accountTypes: {
            ledger: {
                // ledger (live), #1 acc is same as Trezor, so it is skipped
                bip43Path: "m/44'/60'/i'/0/0",
                isDebugOnlyAccountType: true,
            },
        },
        coingeckoId: 'binance-smart-chain',
    },
    // testnets
    test: {
        symbol: 'test',
        name: 'Bitcoin Testnet',
        networkType: 'bitcoin',
        bip43Path: "m/84'/1'/i'",
        decimals: 8,
        testnet: true,
        explorer: {
            tx: 'https://tbtc1.trezor.io/tx/',
            account: 'https://tbtc1.trezor.io/xpub/',
            address: 'https://tbtc1.trezor.io/address/',
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
        symbol: 'regtest',
        name: 'Bitcoin Regtest',
        networkType: 'bitcoin',
        bip43Path: "m/84'/1'/i'",
        decimals: 8,
        testnet: true,
        explorer: {
            tx: 'http://localhost:19121/tx/',
            account: 'http://localhost:19121/xpub/',
            address: 'http://localhost:19121/address/',
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
        isDebugOnlyNetwork: true,
        coingeckoId: undefined,
    },
    tsep: {
        symbol: 'tsep',
        name: 'Ethereum Sepolia',
        networkType: 'ethereum',
        bip43Path: "m/44'/1'/0'/0/i",
        chainId: 11155111,
        decimals: 18,
        testnet: true,
        explorer: {
            tx: 'https://sepolia1.trezor.io/tx/',
            account: 'https://sepolia1.trezor.io/address/',
            nft: 'https://sepolia1.trezor.io/nft/',
            address: 'https://sepolia1.trezor.io/address/',
        },
        features: ['rbf', 'sign-verify', 'tokens'],
        customBackends: ['blockbook'],
        accountTypes: {},
        coingeckoId: undefined,
    },
    thol: {
        symbol: 'thol',
        name: 'Ethereum Holesky',
        networkType: 'ethereum',
        bip43Path: "m/44'/1'/0'/0/i",
        chainId: 17000,
        decimals: 18,
        testnet: true,
        explorer: {
            tx: 'https://holesky1.trezor.io/tx/',
            account: 'https://holesky1.trezor.io/address/',
            nft: 'https://holesky1.trezor.io/nft/',
            address: 'https://holesky1.trezor.io/address/',
        },
        features: ['rbf', 'sign-verify', 'tokens', 'staking'],
        customBackends: ['blockbook'],
        accountTypes: {},
        coingeckoId: undefined,
    },
    txrp: {
        symbol: 'txrp',
        name: 'XRP Testnet',
        networkType: 'ripple',
        bip43Path: "m/44'/144'/i'/0/0",
        decimals: 6,
        testnet: true,
        explorer: {
            tx: 'https://test.bithomp.com/explorer/',
            account: 'https://test.bithomp.com/explorer/',
            address: 'https://test.bithomp.com/explorer/',
        },
        features: ['tokens'],
        customBackends: [],
        accountTypes: {},
        coingeckoId: undefined,
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
        explorer: {
            tx: 'https://preview.cexplorer.io/tx/',
            address: 'https://preview.cexplorer.io/address/',
            account: 'https://preview.cexplorer.io/address/',
            token: 'https://preview.cexplorer.io/asset/',
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
        symbol: 'dsol',
        name: 'Solana Devnet',
        networkType: 'solana',
        bip43Path: "m/44'/501'/i'/0'",
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
} as const satisfies Networks;

type InferredNetworks = typeof networks;
type InferredNetwork = InferredNetworks[NetworkSymbol];

/**
 * @deprecated Old network object interface for backwards copatibility.
 */
export type NetworkCompatible = Without<InferredNetwork, 'accountTypes'> & {
    symbol: NetworkSymbol;
    accountType?: AccountType;
    backendType?: BackendType;
    testnet?: boolean;
    isHidden?: boolean;
    chainId?: number;
    features?: NetworkFeature[];
    support?: {
        [key in DeviceModelInternal]: string;
    };
    isDebugOnlyNetwork?: boolean;
    isDebugOnlyAccountType?: boolean;
    explorer: Explorer;
    coingeckoId?: string;
};

/**
 * @deprecated Please use `networks` instead.
 * Transforms the network object into the previously used format so we don't have to change
 * every occurence. We could gradually start to use the network object directly and in the end
 * this could be removed.
 */
export const networksCompatibility: NetworkCompatible[] = Object.values(networks).flatMap(
    ({ symbol, accountTypes, ...network }) => [
        { symbol, ...network },
        ...Object.entries(accountTypes).map(([accountType, networkOverride]) => ({
            symbol,
            accountType,
            ...network,
            ...networkOverride,
        })),
    ],
);
