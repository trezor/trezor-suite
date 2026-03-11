import { RouterState } from '@suite/router';
import { NetworkSymbol } from '@suite-common/wallet-config';
import {
    WALLET_SETTINGS,
    accountsActions,
    convertSendFormDraftsBtcAmountUnitsThunk,
    sendFormActions,
} from '@suite-common/wallet-core';
import {
    Account,
    AccountBase,
    AccountKey,
    Output,
    FormState as SendFormState,
    asAccountDescriptor,
} from '@suite-common/wallet-types';
import { PROTO } from '@trezor/connect';

import { State as SelectedAccountState } from 'src/reducers/wallet/selectedAccountReducer';

export const blockchainSubscription: Array<{
    description: string;
    initialAccounts: Pick<AccountBase, 'descriptor' | 'symbol'>[];
    actions: Array<any>;
    result: {
        subscribe: {
            called: number;
            accounts?: Pick<AccountBase, 'descriptor' | 'symbol'>[];
            coin?: NetworkSymbol;
        };
        disconnect?: {
            called: number;
            coin?: NetworkSymbol;
        };
    };
}> = [
    {
        description: 'create account, only one subscribed',
        initialAccounts: [{ descriptor: asAccountDescriptor('1'), symbol: 'ltc' }],
        actions: [
            {
                type: accountsActions.createAccount.type,
                payload: { descriptor: '1', symbol: 'btc' },
            },
        ],
        result: {
            subscribe: {
                called: 1,
                accounts: [{ descriptor: asAccountDescriptor('1'), symbol: 'btc' }],
                coin: 'btc',
            },
        },
    },
    {
        description: 'remove account, one subscription remain',
        initialAccounts: [
            { descriptor: asAccountDescriptor('1'), symbol: 'eth' },
            { descriptor: asAccountDescriptor('2'), symbol: 'eth' },
        ],
        actions: [
            {
                type: accountsActions.removeAccount.type,
                payload: [{ descriptor: asAccountDescriptor('1'), symbol: 'eth' }],
            },
        ],
        result: {
            subscribe: {
                called: 1,
                accounts: [{ descriptor: asAccountDescriptor('2'), symbol: 'eth' }],
                coin: 'eth',
            },
            disconnect: {
                called: 1,
            },
        },
    },
    {
        description: 'remove account and disconnect backend',
        initialAccounts: [
            { descriptor: asAccountDescriptor('1'), symbol: 'btc' },
            { descriptor: asAccountDescriptor('2'), symbol: 'btc' },
        ],
        actions: [
            {
                type: accountsActions.removeAccount.type,
                payload: [
                    { descriptor: asAccountDescriptor('1'), symbol: 'eth' },
                    { descriptor: asAccountDescriptor('2'), symbol: 'eth' },
                ],
            },
        ],
        result: {
            subscribe: {
                called: 0,
            },
            disconnect: {
                called: 2,
                coin: 'eth',
            },
        },
    },
    {
        description: 'disconnect LTC backend, subscribe one account on BTC backend',
        initialAccounts: [
            { descriptor: asAccountDescriptor('1btc'), symbol: 'btc' },
            { descriptor: asAccountDescriptor('2btc'), symbol: 'btc' },
            { descriptor: asAccountDescriptor('1ltc'), symbol: 'ltc' },
            { descriptor: asAccountDescriptor('2ltc'), symbol: 'ltc' },
        ],
        actions: [
            {
                type: accountsActions.removeAccount.type,
                payload: [
                    { descriptor: asAccountDescriptor('1btc'), symbol: 'btc' },
                    { descriptor: asAccountDescriptor('1ltc'), symbol: 'ltc' },
                    { descriptor: asAccountDescriptor('2ltc'), symbol: 'ltc' },
                ],
            },
        ],
        result: {
            subscribe: {
                called: 1,
                accounts: [{ descriptor: asAccountDescriptor('2btc'), symbol: 'btc' }],
                coin: 'btc',
            },
            disconnect: {
                called: 1,
                coin: 'ltc',
            },
        },
    },
];

export const draftsFixtures = [
    {
        initialState: {
            router: {
                route: {
                    name: 'wallet-send',
                },
            } as RouterState,
            settings: { bitcoinAmountUnit: PROTO.AmountUnit.BITCOIN },
            accounts: [
                {
                    key: 'one' as AccountKey, // Todo: create properly via `createAccountKey()`
                    networkType: 'bitcoin',
                    symbol: 'btc',
                    accountType: 'normal',
                } as Account,
                {
                    key: 'two' as AccountKey, // Todo: create properly via `createAccountKey()`
                    networkType: 'bitcoin',
                    symbol: 'regtest',
                    accountType: 'normal',
                } as Account,
            ],
            selectedAccount: {
                status: 'loaded',
                account: {
                    key: 'one' as AccountKey, // Todo: create properly via `createAccountKey()`
                    networkType: 'bitcoin',
                    symbol: 'btc',
                    accountType: 'normal',
                },
            } as SelectedAccountState,
            send: {
                drafts: {
                    one: {
                        outputs: [
                            {
                                amount: '0.00001',
                            } as Output,
                            {
                                amount: '0.00002',
                            } as Output,
                        ],
                    } as SendFormState,
                    two: {
                        outputs: [
                            {
                                amount: '0.00003',
                            } as Output,
                            {
                                amount: '0.00004',
                            } as Output,
                        ],
                    } as SendFormState,
                },
            },
        },
        action: {
            type: WALLET_SETTINGS.SET_BITCOIN_AMOUNT_UNITS,
            payload: PROTO.AmountUnit.SATOSHI,
        },
        expectedActions: [
            {
                type: WALLET_SETTINGS.SET_BITCOIN_AMOUNT_UNITS,
                payload: PROTO.AmountUnit.SATOSHI,
            },
            {
                type: convertSendFormDraftsBtcAmountUnitsThunk.pending.type,
            },
            {
                type: sendFormActions.storeDraft.type,
                payload: {
                    accountKey: 'two',
                    formState: {
                        outputs: [
                            {
                                amount: '3000',
                            },
                            {
                                amount: '4000',
                            },
                        ],
                    },
                },
            },
        ],
        expectedDrafts: {
            one: {
                outputs: [
                    {
                        amount: '0.00001',
                    },
                    {
                        amount: '0.00002',
                    },
                ],
            },
            two: {
                outputs: [
                    {
                        amount: '3000',
                    },
                    {
                        amount: '4000',
                    },
                ],
            },
        },
    },
];
