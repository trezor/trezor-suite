import { testMocks } from '@suite-common/test-utils';

import { ACCOUNTS } from './accounts';

const DISCOVERIES = [
    {
        deviceState: '7dcccffe70d8bb8bb28a2185daac8e05639490eee913b326097ae1d73abc8b4f',
        index: 0,
        status: 4,
        total: 35,
        bundleSize: 0,
        loaded: 39,
        failed: [],
        networks: ['btc', 'btc', 'btc', 'test', 'test', 'test', 'eth', 'txrp'],
    },
];

export const getDiscoveryProcess = [
    {
        testName:
            'Discovery for 7dcccffe70d8bb8bb28a2185daac8e05639490eee913b326097ae1d73abc8b4f device',
        discoveries: DISCOVERIES,
        device: testMocks.getSuiteDevice({
            state: '7dcccffe70d8bb8bb28a2185daac8e05639490eee913b326097ae1d73abc8b4f',
        }),
        result: {
            bundleSize: 0,
            deviceState: '7dcccffe70d8bb8bb28a2185daac8e05639490eee913b326097ae1d73abc8b4f',
            failed: [],
            index: 0,
            loaded: 39,
            networks: ['btc', 'btc', 'btc', 'test', 'test', 'test', 'eth', 'txrp'],
            status: 4,
            total: 35,
        },
    },
    {
        testName:
            'Discovery for 1dcccffe70d8bb8bb28a2185daac8e05639490eee913b326097ae1d73abc8b4f device',
        discoveries: DISCOVERIES,
        device: testMocks.getSuiteDevice({
            state: '1dcccffe70d8bb8bb28a2185daac8e05639490eee913b326097ae1d73abc8b4f',
        }),
        result: null,
    },
];

export const accountTitleFixture = [
    { symbol: 'btc', title: 'TR_NETWORK_BITCOIN' },
    { symbol: 'test', title: 'TR_NETWORK_BITCOIN_TESTNET' },
    { symbol: 'bch', title: 'TR_NETWORK_BITCOIN_CASH' },
    { symbol: 'btg', title: 'TR_NETWORK_BITCOIN_GOLD' },
    { symbol: 'dash', title: 'TR_NETWORK_DASH' },
    { symbol: 'xrp', title: 'TR_NETWORK_XRP' },
    { symbol: 'txrp', title: 'TR_NETWORK_XRP_TESTNET' },
    { symbol: 'tsep', title: 'TR_NETWORK_ETHEREUM_SEPOLIA' },
    { symbol: 'tgor', title: 'TR_NETWORK_ETHEREUM_GOERLI' },
    { symbol: 'dgb', title: 'TR_NETWORK_DIGIBYTE' },
    { symbol: 'doge', title: 'TR_NETWORK_DOGECOIN' },
    { symbol: 'ltc', title: 'TR_NETWORK_LITECOIN' },
    { symbol: 'nmc', title: 'TR_NETWORK_NAMECOIN' },
    { symbol: 'vtc', title: 'TR_NETWORK_VERTCOIN' },
    { symbol: 'zec', title: 'TR_NETWORK_ZCASH' },
    { symbol: 'eth', title: 'TR_NETWORK_ETHEREUM' },
    { symbol: 'etc', title: 'TR_NETWORK_ETHEREUM_CLASSIC' },
    { symbol: 'xem', title: 'TR_NETWORK_NEM' },
    { symbol: 'xlm', title: 'TR_NETWORK_STELLAR' },
    { symbol: 'ada', title: 'TR_NETWORK_CARDANO' },
    { symbol: 'xtz', title: 'TR_NETWORK_TEZOS' },
    { symbol: 'aaaaaa', title: 'TR_NETWORK_UNKNOWN' },
    { symbol: 'bbb', title: 'TR_NETWORK_UNKNOWN' },
    { symbol: 'c', title: 'TR_NETWORK_UNKNOWN' },
];

export const accountTitleCoinjoinFixture = [
    { symbol: 'btc', title: 'TR_NETWORK_COINJOIN_BITCOIN' },
    { symbol: 'test', title: 'TR_NETWORK_COINJOIN_BITCOIN_TESTNET' },
    { symbol: 'regtest', title: 'TR_NETWORK_COINJOIN_BITCOIN_REGTEST' },
    { symbol: 'btg', title: 'TR_NETWORK_UNKNOWN' },
    { symbol: 'aaaaaa', title: 'TR_NETWORK_UNKNOWN' },
];

export const parseBIP44Path = [
    {
        path: `m/84'/0'/0'/1/0`,
        result: {
            purpose: "84'",
            coinType: "0'",
            account: "0'",
            change: '1',
            addrIndex: '0',
        },
    },
    {
        path: `m/44'/0'/0'/0/2`,
        result: {
            purpose: "44'",
            coinType: "0'",
            account: "0'",
            change: '0',
            addrIndex: '2',
        },
    },
    {
        path: `m/44'/0'/0'/0/48`,
        result: {
            purpose: "44'",
            coinType: "0'",
            account: "0'",
            change: '0',
            addrIndex: '48',
        },
    },
    {
        path: `m/44'/133'/0'/0/0`,
        result: {
            purpose: "44'",
            coinType: "133'",
            account: "0'",
            change: '0',
            addrIndex: '0',
        },
    },
    {
        path: `m/84'/0'/0'/1/`,
        result: null,
    },
];

export const sortByCoin = [
    {
        accounts: [
            { symbol: 'btc', index: 0, accountType: 'legacy' },
            { symbol: 'test', index: 1, accountType: 'normal' },
            { symbol: 'test', index: 0, accountType: 'normal' },
            { symbol: 'btc', index: 0, accountType: 'segwit' },
            { symbol: 'test', index: 0, accountType: 'segwit' },
            { symbol: 'test', index: 1, accountType: 'legacy' },
            { symbol: 'test', index: 0, accountType: 'legacy' },
            { symbol: 'btc', index: 1, accountType: 'normal' },
            { symbol: 'btc', index: 0, accountType: 'normal' },
        ],
        result: [
            { symbol: 'btc', index: 0, accountType: 'normal' },
            { symbol: 'btc', index: 1, accountType: 'normal' },
            { symbol: 'btc', index: 0, accountType: 'segwit' },
            { symbol: 'btc', index: 0, accountType: 'legacy' },
            { symbol: 'test', index: 0, accountType: 'normal' },
            { symbol: 'test', index: 1, accountType: 'normal' },
            { symbol: 'test', index: 0, accountType: 'segwit' },
            { symbol: 'test', index: 0, accountType: 'legacy' },
            { symbol: 'test', index: 1, accountType: 'legacy' },
        ],
    },
];

export const getBip43Type = [
    {
        description: 'bitcoin taproot',
        path: "m/86'/0'/0'",
        result: 'bip86',
    },
    {
        description: 'bitcoin segwit',
        path: "m/84'/0'/0'",
        result: 'bip84',
    },
    {
        description: 'bitcoin legacy segwit',
        path: "m/49'/0'/0'",
        result: 'bip49',
    },
    {
        description: 'bitcoin legacy',
        path: "m/44'/0'/0'",
        result: 'bip44',
    },
    {
        description: 'bitcoin coinjoin',
        path: "m/10025'/0'/0'",
        result: 'slip25',
    },
    {
        description: 'litecoin segwit',
        path: "m/84'/2'/0'",
        result: 'bip84',
    },
    {
        description: 'litecoin legacy segwit',
        path: "m/49'/2'/0'",
        result: 'bip49',
    },
    {
        description: 'litecoin legacy',
        path: "m/44'/2'/0'",
        result: 'bip44',
    },
    {
        description: 'vertcoin segwit',
        path: "m/84'/28'/0'",
        result: 'bip84',
    },
    {
        description: 'vertcoin legacy segwit',
        path: "m/49'/28'/0'",
        result: 'bip49',
    },
    {
        description: 'vertcoin legacy',
        path: "m/44'/28'/0'",
        result: 'bip44',
    },
    {
        description: 'unknown',
        path: 'm/',
        result: 'unknown',
    },
    {
        description: 'invalid path',
        path: 'invalid-string',
        result: 'unknown',
    },
    {
        description: 'invalid path type',
        path: undefined,
        result: 'unknown',
    },
];

export const getUtxoFromSignedTransaction = [
    {
        description: 'regular tx, 1 new utxo',
        params: {
            account: {
                addresses: {
                    used: [],
                    unused: [],
                    change: [
                        { path: '/1/0', address: 'A-change' },
                        { path: '/1/1', address: 'B-change' },
                    ],
                },
                utxo: [
                    { txid: '0000', vout: 0, amount: '4' },
                    { txid: '0000', vout: 1, amount: '5' },
                ],
            },
            tx: {
                type: 'final',
                inputs: [{ prev_hash: '0000', prev_index: 1 }],
                outputs: [
                    { address: 'external', amount: '2' },
                    { address_n: [0, 0, 0, 1, 1], amount: '1' },
                ],
            },
            txid: 'ABCD',
        },
        result: [
            { txid: 'ABCD', vout: 1, amount: '1', address: 'B-change', path: '/1/1' },
            { txid: '0000', vout: 0, amount: '4' },
        ],
    },
    {
        description: 'regular tx, multiple outputs, multiple new utxos',
        params: {
            account: {
                addresses: {
                    used: [
                        { path: '/0/0', address: 'A' },
                        { path: '/0/1', address: 'B' },
                    ],
                    unused: [
                        { path: '/0/2', address: 'C' },
                        { path: '/0/3', address: 'D' },
                    ],
                    change: [
                        { path: '/1/0', address: 'A-change' },
                        { path: '/1/1', address: 'B-change' },
                    ],
                },
                utxo: [
                    { txid: '0000', vout: 0, amount: '20' },
                    { txid: '0000', vout: 1, amount: '10' },
                ],
            },
            tx: {
                type: 'final',
                inputs: [{ prev_hash: '0000', prev_index: 1 }],
                outputs: [
                    { address: 'external', amount: '0.1' },
                    { address: 'B', amount: '2' },
                    { address: 'external', amount: '0.1' },
                    { address: 'D', amount: '3' },
                    { address: 'external', amount: '0.1' },
                    { address: 'A-change', amount: '4' },
                    { address: 'external', amount: '0.1' },
                    { address_n: [0, 0, 0, 1, 1], amount: '5' },
                ],
            },
            txid: 'ABCD',
        },
        result: [
            { txid: 'ABCD', vout: 7, amount: '5', address: 'B-change', path: '/1/1' },
            { txid: 'ABCD', vout: 5, amount: '4', address: 'A-change', path: '/1/0' },
            { txid: 'ABCD', vout: 3, amount: '3', address: 'D', path: '/0/3' },
            { txid: 'ABCD', vout: 1, amount: '2', address: 'B', path: '/0/1' },
            { txid: '0000', vout: 0, amount: '20' },
        ],
    },
    {
        description: 'rbf tx, 1 utxo changed',
        params: {
            account: {
                addresses: {
                    used: [],
                    unused: [],
                    change: [
                        { path: '/1/0', address: 'A-change' },
                        { path: '/1/1', address: 'B-change' },
                    ],
                },
                utxo: [
                    { txid: '0000', vout: 0, amount: '10', address: 'B-change' },
                    { txid: 'ABCD', vout: 1, amount: '5', address: 'B-change' },
                ],
            },
            tx: {
                type: 'final',
                inputs: [{ prev_hash: '9876', prev_index: 2 }],
                outputs: [
                    { address: 'external', amount: '2' },
                    { address_n: [0, 0, 0, 1, 1], amount: '4' },
                ],
            },
            txid: 'DBCA',
            prevTxid: 'ABCD',
        },
        result: [
            { txid: 'DBCA', vout: 1, amount: '4', address: 'B-change', path: '/1/1' },
            { txid: '0000', vout: 0, amount: '10' },
        ],
    },
    {
        description: 'rbf tx, multiple utxos changed, 1 utxo ignored',
        params: {
            account: {
                addresses: {
                    used: [
                        { path: '/0/0', address: 'A' },
                        { path: '/0/1', address: 'B' },
                    ],
                    unused: [],
                    change: [
                        { path: '/1/0', address: 'A-change' },
                        { path: '/1/1', address: 'B-change' },
                    ],
                },
                utxo: [
                    { txid: '0000', vout: 0, amount: '10', address: 'B-change' },
                    { txid: 'ABCD', vout: 3, amount: '5', address: 'B-change' },
                    { txid: 'ABCD', vout: 1, amount: '5', address: 'B' },
                ],
            },
            tx: {
                type: 'final',
                inputs: [{ prev_hash: '9876', prev_index: 2 }],
                outputs: [
                    { address: 'external', amount: '2' },
                    { address: 'B', amount: '5' },
                    { address: 'A', amount: '5' },
                    { address_n: [0, 0, 0, 1, 1], amount: '4' },
                ],
            },
            txid: 'DBCA',
            prevTxid: 'ABCD',
        },
        result: [
            // A should be ignored since it's not present in Account.utxo (its spent)
            { txid: 'DBCA', vout: 3, amount: '4', address: 'B-change', path: '/1/1' },
            { txid: 'DBCA', vout: 1, amount: '5', address: 'B', path: '/0/1' },
            { txid: '0000', vout: 0, amount: '10' },
        ],
    },
    {
        description: 'rbf tx, all utxos ignored',
        params: {
            account: {
                addresses: {
                    used: [
                        { path: '/0/0', address: 'A' },
                        { path: '/0/1', address: 'B' },
                    ],
                    unused: [],
                    change: [
                        { path: '/1/0', address: 'A-change' },
                        { path: '/1/1', address: 'B-change' },
                    ],
                },
                utxo: [{ txid: '0000', vout: 0, amount: '10', address: 'B-change' }],
            },
            tx: {
                type: 'final',
                inputs: [{ prev_hash: '9876', prev_index: 2 }],
                outputs: [
                    { address: 'external', amount: '2' },
                    { address: 'B', amount: '5' },
                    { address: 'A', amount: '5' },
                    { address_n: [0, 0, 0, 1, 1], amount: '4' },
                ],
            },
            txid: 'DBCA',
            prevTxid: 'ABCD',
        },
        result: [{ txid: '0000', vout: 0, amount: '10' }],
    },
    {
        description: 'account without addresses/utxos',
        params: {
            account: {},
            tx: {
                type: 'final',
                inputs: [{ prev_hash: '0000', prev_index: 1 }],
                outputs: [
                    { address: 'external', amount: '2' },
                    { address_n: [0, 0, 0, 1, 1], amount: '1' },
                ],
            },
            txid: 'ABCD',
        },
        result: [],
    },
    {
        description: 'tx not final',
        params: { account: {}, tx: { type: 'nonfinal' }, txid: 'ABCD' },
        result: [],
    },
];

export const getFirstFreshAddress = [
    {
        description: 'Account without verification',
        params: {
            account: ACCOUNTS.test,
            receive: [],
            pendingAddresses: [],
            utxoBasedAccount: true,
        },
        result: {
            address: 'tb1qk0qgmxtaw3kc9366eccjjgklef0g8lxv3l8nvk',
            path: "m/84\\'/1\\'/0\\'/0/1",
            transfers: 0,
        },
    },
    {
        description: 'Account with verification and receive requested',
        params: {
            account: ACCOUNTS.test,
            receive: [
                {
                    path: "m/84'/1'/0'/0/1",
                    address: 'tb1qk0qgmxtaw3kc9366eccjjgklef0g8lxv3l8nvk',
                    isVerified: true,
                },
            ],
            pendingAddresses: ['tb1qk0qgmxtaw3kc9366eccjjgklef0g8lxv3l8nvk'],
            utxoBasedAccount: true,
        },
        result: {
            address: 'tb1q99ml7urce6m77c2hmxeppm3ylvx7lqk6avhgh7',
            path: "m/84\\'/1\\'/0\\'/0/2",
            transfers: 0,
        },
    },
    {
        description: 'Account not utxo based - xrp',
        params: {
            account: ACCOUNTS.txrp,
            receive: [],
            pendingAddresses: [],
            utxoBasedAccount: false,
        },
        result: {
            path: ACCOUNTS.txrp.path,
            address: ACCOUNTS.txrp.descriptor,
            transfers: ACCOUNTS.txrp.history.total,
        },
    },
];
