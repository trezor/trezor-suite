export const accountBtc = {
    index: 1,
    accountType: 'segwit',
    networkType: 'bitcoin',
    descriptor: 'btc-descriptor',
    symbol: 'btc',
    addresses: {
        unused: [
            {
                address: '177BUDVZqTTzK1Fogqcrfbb5ketHEUDGSJ',
                transfers: 0,
                path: "m/44'/0'/3'/0/0",
            },
        ],
    },
};

export const accountEth = {
    index: 1,
    accountType: 'normal',
    networkType: 'ethereum',
    symbol: 'eth',
    descriptor: 'eth-descriptor',
    path: "m/44'/60'/0'/0/1",
    tokens: [
        {
            type: 'ERC20',
            standard: 'ERC20',
            contract: '0x1234123412341234123412341234123412341234',
            symbol: 'usdt',
            decimals: 18,
        },
        {
            type: 'ERC20',
            standard: 'ERC20',
            contract: '0x1234123412341234123412341234123412341235',
            symbol: 'usdc',
            decimals: 18,
        },
        {
            type: 'ERC20',
            standard: 'ERC20',
            contract: '0x1234123412341234123412341234123412341236',
            symbol: 'other',
            decimals: 18,
        },
    ],
};
