import { configureMockStore } from '@suite-common/test-utils';
import { type Account } from '@suite-common/wallet-types';

import { transactionsActions } from './transactionsActions';
import { addFakePendingCardanoTxThunk } from './transactionsThunks';

const account = {
    key: 'descriptor-ada-device',
    descriptor: 'descriptor',
    deviceState: 'device-state',
    symbol: 'ada',
    networkType: 'cardano',
} as unknown as Account;

const initStore = () =>
    configureMockStore({
        preloadedState: {
            wallet: {
                blockchain: { ada: { blockHeight: 100 } },
            },
        },
    });

describe('addFakePendingCardanoTxThunk', () => {
    it('stores the pending tx with the fee excluded from the amount, matching the confirmed tx from blockfrost', async () => {
        const store = initStore();

        await store.dispatch(
            addFakePendingCardanoTxThunk({
                precomposedTransaction: { totalSpent: '2170000', fee: '170000' },
                txid: 'test-txid',
                account,
            }),
        );

        const addTransactionAction = store
            .getActions()
            .find(action => action.type === transactionsActions.addTransaction.type);

        expect(addTransactionAction?.payload.transactions).toEqual([
            expect.objectContaining({
                txid: 'test-txid',
                type: 'sent',
                amount: '2000000',
                fee: '170000',
                totalSpent: '2170000',
                blockHash: undefined,
                deadline: 110,
            }),
        ]);
    });
});
