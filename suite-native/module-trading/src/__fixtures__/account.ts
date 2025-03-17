import { Account } from '@suite-common/wallet-types';

export const getBtcAccount = () =>
    ({
        symbol: 'btc',
        accountType: 'normal',
        accountLabel: 'BTC Account #1',
        addresses: {
            used: [
                {
                    address: '1BTC',
                    path: 'm/84/0/0',
                    transfers: 0,
                    balance: '0',
                    sent: '0',
                    received: '0',
                },
            ],
            change: [],
            unused: [],
        },
    }) as unknown as Account;
