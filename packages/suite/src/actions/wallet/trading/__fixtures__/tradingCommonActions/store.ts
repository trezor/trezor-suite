import { asAccountDescriptor } from '@suite-common/wallet-types';
import { mockAccountKey } from '@suite-common/wallet-types/mocks';
import { asNetworkSymbol } from '@trezor/network-module';

import { type Account } from 'src/types/wallet';

const btcSymbol = asNetworkSymbol('btc');

export const ACCOUNT: Account = {
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
