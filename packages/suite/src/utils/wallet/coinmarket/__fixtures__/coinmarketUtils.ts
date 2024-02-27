import { TokenDefinitions } from '@suite-common/wallet-types';

export const accountBtc = {
    index: 1,
    accountType: 'segwit',
    networkType: 'bitcoin',
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
    descriptor: '0x2e0DC981d301cdd443C3987cf19Eb9671CB99ddC',
    path: "m/44'/60'/0'/0/1",
    tokens: [
        {
            type: 'ERC20',
            contract: '0x1234123412341234123412341234123412341234',
            symbol: 'usdt',
            decimals: 18,
        },
        {
            type: 'ERC20',
            contract: '0x1234123412341234123412341234123412341235',
            symbol: 'usdc',
            decimals: 18,
        },
        {
            type: 'ERC20',
            contract: '0x1234123412341234123412341234123412341236',
            symbol: 'other',
            decimals: 18,
        },
    ],
};

export const tokenDefinitions: TokenDefinitions = {
    '0x1234123412341234123412341234123412341234': { isTokenKnown: false, error: false },
    '0x1234123412341234123412341234123412341235': { isTokenKnown: true, error: false },
};
