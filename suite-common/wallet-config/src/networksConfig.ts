import type { ExtendedMessageDescriptor } from '@suite-common/intl-types';
import type { Keys, Without } from '@trezor/type-utils';

export const networks = {
    // Bitcoin
    btc: {
        name: 'Bitcoin',
        networkType: 'bitcoin',
        bip43Path: "m/84'/0'/i'",
        decimals: 8,
        explorer: {
            tx: 'https://btc1.trezor.io/tx/',
            account: 'https://btc1.trezor.io/xpub/',
        },
        features: ['rbf', 'sign-verify', 'amount-unit'],
        customBackends: ['blockbook', 'electrum'],
        accountTypes: {
            taproot: {
                name: 'Bitcoin (Taproot)',
                bip43Path: "m/86'/0'/i'",
                features: ['rbf', 'amount-unit'],
            },
            segwit: {
                name: 'Bitcoin (Legacy Segwit)',
                bip43Path: "m/49'/0'/i'",
            },
            legacy: {
                name: 'Bitcoin (Legacy)',
                bip43Path: "m/44'/0'/i'",
            },
        },
    },
    // Litecoin
    ltc: {
        name: 'Litecoin',
        networkType: 'bitcoin',
        bip43Path: "m/84'/2'/i'",
        decimals: 8,
        explorer: {
            tx: 'https://ltc1.trezor.io/tx/',
            account: 'https://ltc1.trezor.io/xpub/',
        },
        features: ['sign-verify'],
        customBackends: ['blockbook'],
        accountTypes: {
            segwit: {
                name: 'Litecoin (segwit)',
                bip43Path: "m/49'/2'/i'",
            },
            legacy: {
                name: 'Litecoin (legacy)',
                bip43Path: "m/44'/2'/i'",
            },
        },
    },
    // Ethereum
    eth: {
        name: 'Ethereum',
        networkType: 'ethereum',
        chainId: 1,
        bip43Path: "m/44'/60'/0'/0/i",
        decimals: 18,
        explorer: {
            tx: 'https://eth1.trezor.io/tx/',
            account: 'https://eth1.trezor.io/address/',
        },
        features: ['sign-verify', 'tokens'],
        label: 'TR_NETWORK_ETHEREUM_LABEL',
        tooltip: 'TR_NETWORK_ETHEREUM_TOOLTIP',
        customBackends: ['blockbook'],
        accountTypes: {},
    },
    etc: {
        name: 'Ethereum Classic',
        networkType: 'ethereum',
        chainId: 61,
        bip43Path: "m/44'/61'/0'/0/i",
        decimals: 18,
        explorer: {
            tx: 'https://etc1.trezor.io/tx/',
            account: 'https://etc1.trezor.io/address/',
        },
        features: ['sign-verify', 'tokens'],
        customBackends: ['blockbook'],
        accountTypes: {},
    },
    // Ripple
    xrp: {
        name: 'XRP',
        networkType: 'ripple',
        bip43Path: "m/44'/144'/i'/0/0",
        decimals: 6,
        explorer: {
            tx: 'https://xrpscan.com/tx/',
            account: 'https://xrpscan.com/account/',
        },
        customBackends: [],
        accountTypes: {},
    },
    bch: {
        name: 'Bitcoin Cash',
        networkType: 'bitcoin',
        bip43Path: "m/44'/145'/i'",
        decimals: 8,
        explorer: {
            tx: 'https://bch1.trezor.io/tx/',
            account: 'https://bch1.trezor.io/xpub/',
        },
        features: ['sign-verify'],
        customBackends: ['blockbook'],
        accountTypes: {},
    },
    btg: {
        name: 'Bitcoin Gold',
        networkType: 'bitcoin',
        bip43Path: "m/49'/156'/i'",
        decimals: 8,
        explorer: {
            tx: 'https://btg1.trezor.io/tx/',
            account: 'https://btg1.trezor.io/xpub/',
        },
        features: ['sign-verify'],
        customBackends: ['blockbook'],
        accountTypes: {
            legacy: {
                name: 'Bitcoin Gold (legacy)',
                bip43Path: "m/44'/156'/i'",
            },
        },
    },
    dash: {
        name: 'Dash',
        networkType: 'bitcoin',
        bip43Path: "m/44'/5'/i'",
        decimals: 8,
        explorer: {
            tx: 'https://dash1.trezor.io/tx/',
            account: 'https://dash1.trezor.io/xpub/',
        },
        features: ['sign-verify'],
        customBackends: ['blockbook'],
        accountTypes: {},
    },
    dgb: {
        name: 'DigiByte',
        networkType: 'bitcoin',
        bip43Path: "m/49'/20'/i'",
        decimals: 8,
        explorer: {
            tx: 'https://dgb1.trezor.io/tx/',
            account: 'https://dgb1.trezor.io/xpub/',
        },
        features: ['sign-verify'],
        customBackends: ['blockbook'],
        accountTypes: {
            legacy: {
                name: 'DigiByte (legacy)',
                bip43Path: "m/44'/20'/i'",
            },
        },
    },
    doge: {
        name: 'Dogecoin',
        networkType: 'bitcoin',
        bip43Path: "m/44'/3'/i'",
        decimals: 8,
        explorer: {
            tx: 'https://doge1.trezor.io/tx/',
            account: 'https://doge1.trezor.io/xpub/',
        },
        features: ['sign-verify'],
        customBackends: ['blockbook'],
        accountTypes: {},
    },
    nmc: {
        name: 'Namecoin',
        networkType: 'bitcoin',
        bip43Path: "m/44'/7'/i'",
        decimals: 8,
        explorer: {
            tx: 'https://nmc1.trezor.io/tx/',
            account: 'https://nmc1.trezor.io/xpub/',
        },
        features: ['sign-verify'],
        customBackends: ['blockbook'],
        accountTypes: {},
    },
    vtc: {
        name: 'Vertcoin',
        networkType: 'bitcoin',
        bip43Path: "m/84'/28'/i'",
        decimals: 8,
        explorer: {
            tx: 'https://vtc1.trezor.io/tx/',
            account: 'https://vtc1.trezor.io/xpub/',
        },
        features: ['sign-verify'],
        customBackends: ['blockbook'],
        accountTypes: {
            segwit: {
                name: 'Vertcoin (segwit)',
                bip43Path: "m/49'/28'/i'",
            },
            legacy: {
                name: 'Vertcoin (legacy)',
                bip43Path: "m/44'/28'/i'",
            },
        },
    },
    zec: {
        name: 'Zcash',
        networkType: 'bitcoin',
        bip43Path: "m/44'/133'/i'",
        decimals: 8,
        explorer: {
            tx: 'https://zec1.trezor.io/tx/',
            account: 'https://zec1.trezor.io/xpub/',
        },
        features: ['sign-verify'],
        customBackends: ['blockbook'],
        accountTypes: {},
    },
    // Bitcoin testnet
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
        },
        features: ['rbf', 'sign-verify', 'amount-unit'],
        customBackends: ['blockbook', 'electrum'],
        accountTypes: {
            taproot: {
                name: 'Bitcoin Testnet (taproot)',
                bip43Path: "m/86'/1'/i'",
                features: ['rbf', 'amount-unit'],
            },
            segwit: {
                name: 'Bitcoin Testnet (segwit)',
                bip43Path: "m/49'/1'/i'",
            },
            legacy: {
                name: 'Bitcoin Testnet (legacy)',
                bip43Path: "m/44'/1'/i'",
            },
        },
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
        },
        features: ['rbf', 'sign-verify', 'amount-unit'],
        customBackends: ['blockbook', 'electrum'],
        accountTypes: {
            coinjoin: {
                name: 'Bitcoin Regtest (PEA)',
                bip43Path: "m/10025'/1'/i'/1'", // https://github.com/satoshilabs/slips/blob/master/slip-0025.md#public-key-derivation
                backendType: 'coinjoin', // use non-standard backend
                features: ['amount-unit'], // no rbf, no sign-verify
            },
            taproot: {
                name: 'Bitcoin Regtest (taproot)',
                bip43Path: "m/86'/1'/i'",
                features: ['rbf', 'amount-unit'],
            },
            segwit: {
                name: 'Bitcoin Regtest (segwit)',
                bip43Path: "m/49'/1'/i'",
            },
            legacy: {
                name: 'Bitcoin Regtest (legacy)',
                bip43Path: "m/44'/1'/i'",
            },
        },
    },
    trop: {
        name: 'Ethereum Ropsten',
        networkType: 'ethereum',
        bip43Path: "m/44'/1'/0'/0/i",
        chainId: 3,
        decimals: 18,
        testnet: true,
        label: 'TR_TESTNET_COINS_LABEL',
        explorer: {
            tx: 'https://ropsten1.trezor.io/tx/',
            account: 'https://ropsten1.trezor.io/address/',
        },
        features: ['sign-verify', 'tokens'],
        customBackends: ['blockbook'],
        accountTypes: {},
    },
    tgor: {
        name: 'Ethereum Goerli',
        networkType: 'ethereum',
        bip43Path: "m/44'/1'/0'/0/i",
        chainId: 5,
        decimals: 18,
        testnet: true,
        label: 'TR_TESTNET_COINS_LABEL',
        explorer: {
            tx: 'https://goerli1.trezor.io/tx/',
            account: 'https://goerli1.trezor.io/address/',
        },
        features: ['sign-verify', 'tokens'],
        customBackends: ['blockbook'],
        accountTypes: {},
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
        },
        features: ['tokens'],
        customBackends: [],
        accountTypes: {},
    },
    ada: {
        // icarus derivation
        name: 'Cardano',
        networkType: 'cardano',
        bip43Path: "m/1852'/1815'/i'",
        decimals: 6,
        testnet: false,
        features: ['tokens'],
        explorer: {
            tx: 'https://explorer.blockfrost.dev/transaction/',
            account: 'https://explorer.blockfrost.dev/account/',
            token: 'https://explorer.blockfrost.dev/token/',
        },
        support: {
            2: '2.4.3',
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
    },
    tada: {
        // icarus derivation
        name: 'Cardano Testnet',
        networkType: 'cardano',
        bip43Path: "m/1852'/1815'/i'",
        label: 'TR_TESTNET_COINS_LABEL',
        decimals: 6,
        testnet: true,
        features: ['tokens'],
        explorer: {
            tx: 'https://testnet-explorer.blockfrost.dev/transaction/',
            account: 'https://testnet-explorer.blockfrost.dev/account/',
            token: 'https://testnet-explorer.blockfrost.dev/token/',
        },
        support: {
            2: '2.4.3',
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
    },
} as const;

export const TREZOR_CONNECT_BACKENDS = ['blockbook', 'electrum', 'ripple', 'blockfrost'] as const;
export const NON_STANDARD_BACKENDS = ['coinjoin'] as const;

export type BackendType =
    | typeof TREZOR_CONNECT_BACKENDS[number]
    | typeof NON_STANDARD_BACKENDS[number];

type Networks = typeof networks;
export type NetworkSymbol = keyof Networks;
type NetworkValue = Networks[NetworkSymbol];
export type AccountType = Keys<NetworkValue['accountTypes']> | 'imported';
export type NetworkFeature = 'rbf' | 'sign-verify' | 'amount-unit' | 'tokens';
export type Network = Without<NetworkValue, 'accountTypes'> & {
    symbol: NetworkSymbol;
    accountType?: 'normal' | AccountType;
    backendType?: BackendType;
    testnet?: boolean;
    isHidden?: boolean;
    chainId?: number;
    features?: NetworkFeature[];
    label?: ExtendedMessageDescriptor['id'];
    tooltip?: ExtendedMessageDescriptor['id'];
    support?: {
        [key: number]: string;
    };
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
