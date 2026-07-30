import { asNetworkSymbol } from '@suite-common/wallet-config';
import { mockAccountKey } from '@suite-common/wallet-types/mocks';

const btcSymbol = asNetworkSymbol('btc');
const ethSymbol = asNetworkSymbol('eth');

export const accountBtc = {
    index: 1,
    accountType: 'segwit',
    networkType: 'bitcoin',
    descriptor: 'btcDescriptor',
    key: mockAccountKey({ descriptor: 'btcDescriptor', symbol: btcSymbol }),
    symbol: btcSymbol,
    addresses: {
        unused: [
            {
                address: '177BUDVZqTTzK1Fogqcrfbb5ketHEUDGSJ',
                transfers: 0,
                path: "m/44'/0'/3'/0/0",
            },
        ],
    },
    deviceState: 'mvbu1Gdy8SUjTenqerxUaZyYjmveZvt33q@448CCE89D32A733A1632F345:0',
};

export const accountEth = {
    index: 1,
    accountType: 'normal',
    networkType: 'ethereum',
    symbol: ethSymbol,
    descriptor: 'ethDescriptor',
    key: mockAccountKey({ descriptor: 'ethDescriptor', symbol: ethSymbol }),
    path: "m/44'/60'/0'/0/1",
    deviceState: 'mvbu1Gdy8SUjTenqerxUaZyYjmveZvt33q@448CCE89D32A733A1632F345:0',
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
