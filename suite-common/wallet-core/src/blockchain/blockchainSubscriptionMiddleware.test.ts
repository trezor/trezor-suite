import { combineReducers } from '@reduxjs/toolkit';

import { mockActionType, mockReducer } from '@suite-common/redux-utils/mocks';
import { createTestStore } from '@suite-common/test-utils';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type Account, asAccountDescriptor } from '@suite-common/wallet-types';
import { mockWalletAccount, networkSpecificDefaultCardano } from '@suite-common/wallet-types/mocks';
import TrezorConnect from '@trezor/connect';

import { prepareBlockchainSubscriptionMiddleware } from './blockchainSubscriptionMiddleware';
import { mockSetAccountAddMetadata } from '../../mocks';
import { accountsActions } from '../accounts/accountsActions';
import { prepareAccountsReducer } from '../accounts/accountsReducer';

const accountsReducer = prepareAccountsReducer({
    actionTypes: { storageLoad: mockActionType('storageLoad') },
    actions: { setAccountAddMetadata: mockSetAccountAddMetadata() },
    reducers: { storageLoadAccounts: mockReducer() },
});

const adaSymbol = asNetworkSymbol('ada');

const createAddress = (address: string) => ({
    address,
    path: '',
    transfers: 0,
    balance: '0',
    sent: '0',
    received: '0',
});

const account = mockWalletAccount(
    {
        symbol: adaSymbol,
        descriptor: asAccountDescriptor('descriptor'),
        addresses: {
            change: [createAddress('change-0')],
            used: [createAddress('used-0')],
            unused: [],
        },
    },
    networkSpecificDefaultCardano,
);

const initStore = (accounts: Account[] = []) =>
    createTestStore({
        extra: undefined,
        middleware: [prepareBlockchainSubscriptionMiddleware(() => ({}))],
        reducer: { wallet: combineReducers({ accounts: accountsReducer }) },
        preloadedState: { wallet: { accounts } },
    });

const waitForThunks = () => new Promise(resolve => setTimeout(resolve, 0));

const mockSubscribe = () =>
    jest
        .spyOn(TrezorConnect, 'blockchainSubscribe')
        .mockResolvedValue({ success: true, payload: { subscribed: true } });

describe('prepareBlockchainSubscriptionMiddleware', () => {
    afterEach(() => jest.restoreAllMocks());

    it('subscribes the network with its accounts and blocks once an account is created', async () => {
        const subscribe = mockSubscribe();
        const store = initStore();

        store.dispatch(
            accountsActions.createAccount(
                {
                    ...account,
                    accountInfo: {
                        descriptor: account.descriptor,
                        balance: '0',
                        availableBalance: '0',
                        empty: false,
                        history: { total: 0, unconfirmed: 0 },
                    },
                },
                [adaSymbol],
            ),
        );
        await waitForThunks();

        expect(subscribe).toHaveBeenCalledWith({
            accounts: [expect.objectContaining({ descriptor: account.descriptor })],
            coin: 'ada',
            blocks: true,
        });
    });

    it('re-subscribes when an update brings new addresses', async () => {
        const subscribe = mockSubscribe();
        const store = initStore([account]);

        store.dispatch(
            accountsActions.updateAccount({
                ...account,
                addresses: {
                    ...account.addresses!,
                    unused: [createAddress('unused-0')],
                },
            }),
        );
        await waitForThunks();

        expect(subscribe).toHaveBeenCalledWith(
            expect.objectContaining({ coin: 'ada', blocks: true }),
        );
    });

    it('re-subscribes when an update recovers a failed account', async () => {
        const subscribe = mockSubscribe();
        const store = initStore([{ ...account, failed: true, error: 'backend offline' }]);

        store.dispatch(accountsActions.updateAccount(account));
        await waitForThunks();

        expect(subscribe).toHaveBeenCalledWith(
            expect.objectContaining({ coin: 'ada', blocks: true }),
        );
    });

    it('does not re-subscribe when an update leaves the addresses unchanged', async () => {
        const subscribe = mockSubscribe();
        const store = initStore([account]);

        store.dispatch(accountsActions.updateAccount({ ...account, balance: '1' }));
        await waitForThunks();

        expect(subscribe).not.toHaveBeenCalled();
    });

    it('disconnects the backend when its last account is removed', async () => {
        const disconnect = jest
            .spyOn(TrezorConnect, 'blockchainDisconnect')
            .mockResolvedValue({ success: true, payload: { disconnected: true } });
        const store = initStore([account]);

        store.dispatch(accountsActions.removeAccount([account]));
        await waitForThunks();

        expect(disconnect).toHaveBeenCalledWith(expect.objectContaining({ coin: 'ada' }));
    });
});
