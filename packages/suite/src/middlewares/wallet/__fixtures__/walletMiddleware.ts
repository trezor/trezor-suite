import { PROTO } from '@trezor/connect';
import { Account } from '@suite-common/wallet-types';
import { FormState as SendFormState, Output } from 'src/types/wallet/sendForm';
import { WALLET_SETTINGS } from 'src/actions/settings/constants';
import { RouterState } from 'src/reducers/suite/routerReducer';
import { State as SelectedAccountState } from 'src/reducers/wallet/selectedAccountReducer';
import { accountsActions } from '@suite-common/wallet-core';
import { sendFormActions } from 'src/actions/wallet/sendFormActions';
import { convertSendFormDraftsThunk } from 'src/actions/wallet/send/sendFormThunks';

export const blockchainSubscription = [
    {
        description: 'create account, only one subscribed',
        initialAccounts: [{ descriptor: '1', symbol: 'ltc' }],
        actions: [
            {
                type: accountsActions.createAccount.type,
                payload: { descriptor: '1', symbol: 'btc' },
            },
        ],
        result: {
            subscribe: {
                called: 1,
                accounts: [{ descriptor: '1', symbol: 'btc' }],
                coin: 'btc',
            },
        },
    },
    {
        description: 'remove account, one subscription remain',
        initialAccounts: [{ descriptor: '1' }, { descriptor: '2' }],
        actions: [
            {
                type: accountsActions.removeAccount.type,
                payload: [{ descriptor: '1' }],
            },
        ],
        result: {
            subscribe: {
                called: 1,
                accounts: [{ descriptor: '2' }],
                coin: 'eth',
            },
            disconnect: {
                called: 0,
            },
        },
    },
    {
        description: 'remove account and disconnect backend',
        initialAccounts: [{ descriptor: '1' }, { descriptor: '2' }],
        actions: [
            {
                type: accountsActions.removeAccount.type,
                payload: [{ descriptor: '1' }, { descriptor: '2' }],
            },
        ],
        result: {
            subscribe: {
                called: 0,
            },
            disconnect: {
                called: 1,
                coin: 'eth',
            },
        },
    },
    {
        description: 'disconnect LTC backend, subscribe one account on BTC backend',
        initialAccounts: [
            { descriptor: '1btc', symbol: 'btc' },
            { descriptor: '2btc', symbol: 'btc' },
            { descriptor: '1ltc', symbol: 'ltc' },
            { descriptor: '2ltc', symbol: 'ltc' },
        ],
        actions: [
            {
                type: accountsActions.removeAccount.type,
                payload: [
                    { descriptor: '1btc', symbol: 'btc' },
                    { descriptor: '1ltc', symbol: 'ltc' },
                    { descriptor: '2ltc', symbol: 'ltc' },
                ],
            },
        ],
        result: {
            subscribe: {
                called: 1,
                accounts: [{ descriptor: '2btc', symbol: 'btc' }],
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
                    key: 'one',
                    networkType: 'bitcoin',
                    symbol: 'btc',
                    accountType: 'normal',
                } as Account,
                {
                    key: 'two',
                    networkType: 'bitcoin',
                    symbol: 'regtest',
                    accountType: 'normal',
                } as Account,
            ],
            selectedAccount: {
                status: 'loaded',
                account: {
                    key: 'one',
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
                type: convertSendFormDraftsThunk.pending.type,
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
