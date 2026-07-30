import { asAccountDescriptor } from '@suite-common/wallet-types';
import { mockAccountKey } from '@suite-common/wallet-types/mocks';
import { asNetworkSymbol } from '@trezor/network-module';

import { type Account } from 'src/types/wallet';

const btcSymbol = asNetworkSymbol('btc');
const ethSymbol = asNetworkSymbol('eth');
const xrpSymbol = asNetworkSymbol('xrp');

export const BTC_ACCOUNT: Account = {
    networkType: 'bitcoin',
    symbol: btcSymbol,
    descriptor: asAccountDescriptor('btcDescriptor'),
    deviceState: '1stTestnetAddress@device_id:0',
    index: 0,
    path: "m/84'/0'/0'",
    key: mockAccountKey({
        descriptor: 'btcDescriptor',
        symbol: btcSymbol,
        deviceStaticSessionId: '1stTestnetAddress@device_id:0',
    }),
    accountType: 'normal',
    empty: true,
    visible: true,
    balance: '12340000',
    availableBalance: '12340000',
    formattedBalance: '0.12340000',
    tokens: [],
    addresses: {
        change: [],
        used: [],
        unused: [
            {
                address: 'bc1q5y487p64hfsjc5gdfeezv29zwcddz5kahve0kp',
                path: "m/84'/0'/0'/0/0",
                transfers: 0,
                balance: '0',
                sent: '0',
                received: '0',
            },
        ],
    },
    utxo: [],
    history: {
        total: 0,
        unconfirmed: 0,
    },
    metadata: {
        key: '1stTestnetAddress@device_id:0',
        1: {
            fileName: '',
            aesKey: '',
        },
    },
    page: undefined,
    misc: undefined,
    marker: undefined,
    stellarCursor: undefined,
};

export const ETH_ACCOUNT: Account = {
    symbol: ethSymbol,
    networkType: 'ethereum',
    descriptor: asAccountDescriptor('0xdB09b793984B862C430b64B9ed53AcF867cC041F'),
    deviceState: '1stTestnetAddress@device_id:0',
    key: mockAccountKey({
        descriptor: '0xdB09b793984B862C430b64B9ed53AcF867cC041F',
        symbol: ethSymbol,
        deviceStaticSessionId: '1stTestnetAddress@device_id:0',
    }),
    accountType: 'normal',
    index: 0,
    path: "m/44'/60'/0'/0/0",
    empty: true,
    visible: true,
    balance: '408873828678601000',
    availableBalance: '408873828678601000',
    formattedBalance: '0.408873828678601',
    tokens: [],
    addresses: {
        change: [],
        used: [],
        unused: [],
    },
    utxo: [],
    history: {
        total: 0,
        unconfirmed: 0,
    },
    metadata: {
        key: '1stTestnetAddress@device_id:0',
        1: {
            fileName: '',
            aesKey: '',
        },
    },
    page: undefined,
    misc: { nonce: '1' },
    marker: undefined,
    stellarCursor: undefined,
};

export const XRP_ACCOUNT: Account = {
    symbol: xrpSymbol,
    networkType: 'ripple',
    descriptor: asAccountDescriptor('rAPERVgXZavGgiGv6xBgtiZurirW2yAmY'),
    deviceState: '1stTestnetAddress@device_id:0',
    key: mockAccountKey({
        descriptor: 'rAPERVgXZavGgiGv6xBgtiZurirW2yAmY',
        symbol: xrpSymbol,
        deviceStaticSessionId: '1stTestnetAddress@device_id:0',
    }),
    availableBalance: '100000000000',
    accountType: 'normal',
    index: 0,
    path: "m/44'/60'/0'/0/0",
    empty: true,
    visible: true,
    balance: '0',
    formattedBalance: '0',
    tokens: [],
    addresses: {
        change: [],
        used: [],
        unused: [],
    },
    utxo: [],
    history: {
        total: 0,
        unconfirmed: 0,
    },
    metadata: {
        key: '1stTestnetAddress@device_id:0',
        1: {
            fileName: '',
            aesKey: '',
        },
    },
    page: undefined,
    misc: {
        sequence: 3,
        reserve: '20000000',
    },
    marker: undefined,
    stellarCursor: undefined,
};
