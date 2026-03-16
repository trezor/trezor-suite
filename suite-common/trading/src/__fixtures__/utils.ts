import { type AccountKey } from '@suite-common/wallet-types';

export const accountBtc = {
    index: 1,
    accountType: 'segwit',
    networkType: 'bitcoin',
    descriptor: 'btc-descriptor',
    key: 'btc-descriptor-btc' as AccountKey, // Todo: create properly via `createAccountKey()`,
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
    deviceState: 'staticSessionId',
};

export const accountEth = {
    index: 1,
    accountType: 'normal',
    networkType: 'ethereum',
    symbol: 'eth',
    descriptor: 'eth-descriptor',
    key: 'eth-descriptor-eth' as AccountKey, // Todo: create properly via `createAccountKey()`,
    path: "m/44'/60'/0'/0/1",
    deviceState: 'staticSessionId',
    tokens: [
        {
            standard: 'ERC20',
            contract: '0x1234123412341234123412341234123412341234',
            symbol: 'usdt',
            decimals: 18,
        },
        {
            standard: 'ERC20',
            contract: '0x1234123412341234123412341234123412341235',
            symbol: 'usdc',
            decimals: 18,
        },
        {
            standard: 'ERC20',
            contract: '0x1234123412341234123412341234123412341236',
            symbol: 'other',
            decimals: 18,
        },
    ],
};
