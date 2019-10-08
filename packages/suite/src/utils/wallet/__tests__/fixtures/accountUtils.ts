export const accountTitleFixture = [
    { symbol: 'btc', title: 'Bitcoin' },
    { symbol: 'test', title: 'Bitcoin Testnet' },
    { symbol: 'bch', title: 'Bitcoin Cash' },
    { symbol: 'btg', title: 'Bitcoin Gold' },
    { symbol: 'dash', title: 'Dash' },
    { symbol: 'xrp', title: 'XRP' },
    { symbol: 'txrp', title: 'XRP Testnet' },
    { symbol: 'trop', title: 'Ethereum Testnet' },
    { symbol: 'dgb', title: 'Digibyte' },
    { symbol: 'doge', title: 'Dogecoin' },
    { symbol: 'ltc', title: 'Litecoin' },
    { symbol: 'nmc', title: 'Namecoin' },
    { symbol: 'vtc', title: 'Vertcoin' },
    { symbol: 'zec', title: 'Zcash' },
    { symbol: 'eth', title: 'Ethereum' },
    { symbol: 'etc', title: 'Ethereum Classic' },
    { symbol: 'xem', title: 'NEM' },
    { symbol: 'xlm', title: 'Stellar' },
    { symbol: 'ada', title: 'Cardano' },
    { symbol: 'xtz', title: 'Tezos' },
    { symbol: 'aaaaaa', title: 'unknown' },
    { symbol: 'bbb', title: 'unknown' },
    { symbol: 'c', title: 'unknown' },
];

export const accountTypeFixture = [
    { networkType: 'normal', title: null },
    { networkType: 'segwit', title: 'segwit' },
    { networkType: 'legacy', title: 'legacy' },
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

export const formatNetworkAmount = [
    {
        amount: '1',
        symbol: 'btc',
        result: '0.00000001',
    },
    {
        amount: '1',
        symbol: 'eth',
        result: '0.000000000000000001',
    },
    {
        amount: '1',
        symbol: 'xrp',
        result: '0.000001',
    },
    {
        amount: '1',
        symbol: 'dummy-symbol',
        result: '1',
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
