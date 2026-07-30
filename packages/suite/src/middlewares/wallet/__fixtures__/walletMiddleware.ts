import { type SelectedAccountState } from '@suite/account';
import { type RouterState } from '@suite/router';
import { type NetworkSymbol, asNetworkSymbol } from '@suite-common/wallet-config';
import {
    WALLET_SETTINGS,
    accountsActions,
    convertSendFormDraftsBtcAmountUnitsThunk,
    sendFormActions,
} from '@suite-common/wallet-core';
import {
    type Account,
    type AccountBase,
    type Output,
    type FormState as SendFormState,
    asAccountDescriptor,
} from '@suite-common/wallet-types';
import { mockAccountKey } from '@suite-common/wallet-types/mocks';
import { PROTO } from '@trezor/connect';

const btcSymbol = asNetworkSymbol('btc');
const ethSymbol = asNetworkSymbol('eth');
const ltcSymbol = asNetworkSymbol('ltc');
const regtestSymbol = asNetworkSymbol('regtest');

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
        initialAccounts: [{ descriptor: asAccountDescriptor('1'), symbol: ltcSymbol }],
        actions: [
            {
                type: accountsActions.createAccount.type,
                payload: { descriptor: '1', symbol: btcSymbol },
            },
        ],
        result: {
            subscribe: {
                called: 1,
                accounts: [{ descriptor: asAccountDescriptor('1'), symbol: btcSymbol }],
                coin: btcSymbol,
            },
        },
    },
    {
        description: 'remove account, one subscription remain',
        initialAccounts: [
            { descriptor: asAccountDescriptor('1'), symbol: ethSymbol },
            { descriptor: asAccountDescriptor('2'), symbol: ethSymbol },
        ],
        actions: [
            {
                type: accountsActions.removeAccount.type,
                payload: [{ descriptor: asAccountDescriptor('1'), symbol: ethSymbol }],
            },
        ],
        result: {
            subscribe: {
                called: 1,
                accounts: [{ descriptor: asAccountDescriptor('2'), symbol: ethSymbol }],
                coin: ethSymbol,
            },
            disconnect: {
                called: 1,
            },
        },
    },
    {
        description: 'remove account and disconnect backend',
        initialAccounts: [
            { descriptor: asAccountDescriptor('1'), symbol: btcSymbol },
            { descriptor: asAccountDescriptor('2'), symbol: btcSymbol },
        ],
        actions: [
            {
                type: accountsActions.removeAccount.type,
                payload: [
                    { descriptor: asAccountDescriptor('1'), symbol: ethSymbol },
                    { descriptor: asAccountDescriptor('2'), symbol: ethSymbol },
                ],
            },
        ],
        result: {
            subscribe: {
                called: 0,
            },
            disconnect: {
                called: 2,
                coin: ethSymbol,
            },
        },
    },
    {
        description: 'disconnect LTC backend, subscribe one account on BTC backend',
        initialAccounts: [
            { descriptor: asAccountDescriptor('1btc'), symbol: btcSymbol },
            { descriptor: asAccountDescriptor('2btc'), symbol: btcSymbol },
            { descriptor: asAccountDescriptor('1ltc'), symbol: ltcSymbol },
            { descriptor: asAccountDescriptor('2ltc'), symbol: ltcSymbol },
        ],
        actions: [
            {
                type: accountsActions.removeAccount.type,
                payload: [
                    { descriptor: asAccountDescriptor('1btc'), symbol: btcSymbol },
                    { descriptor: asAccountDescriptor('1ltc'), symbol: ltcSymbol },
                    { descriptor: asAccountDescriptor('2ltc'), symbol: ltcSymbol },
                ],
            },
        ],
        result: {
            subscribe: {
                called: 1,
                accounts: [{ descriptor: asAccountDescriptor('2btc'), symbol: btcSymbol }],
                coin: btcSymbol,
            },
            disconnect: {
                called: 1,
                coin: ltcSymbol,
            },
        },
    },
];

const accountOneKey = mockAccountKey({ descriptor: 'one' });
const accountTwoKey = mockAccountKey({ descriptor: 'two', symbol: regtestSymbol });

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
                    key: accountOneKey,
                    networkType: 'bitcoin',
                    symbol: btcSymbol,
                    accountType: 'normal',
                } as Account,
                {
                    key: accountTwoKey,
                    networkType: 'bitcoin',
                    symbol: regtestSymbol,
                    accountType: 'normal',
                } as Account,
            ],
            selectedAccount: {
                status: 'loaded',
                account: {
                    key: accountOneKey,
                    networkType: 'bitcoin',
                    symbol: btcSymbol,
                    accountType: 'normal',
                },
            } as SelectedAccountState,
            send: {
                drafts: {
                    [accountOneKey]: {
                        outputs: [
                            {
                                amount: '0.00001',
                            } as Output,
                            {
                                amount: '0.00002',
                            } as Output,
                        ],
                    } as SendFormState,
                    [accountTwoKey]: {
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
                    accountKey: accountTwoKey,
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
            [accountOneKey]: {
                outputs: [
                    {
                        amount: '0.00001',
                    },
                    {
                        amount: '0.00002',
                    },
                ],
            },
            [accountTwoKey]: {
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
