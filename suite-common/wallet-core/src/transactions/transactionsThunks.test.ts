import { createTestStore } from '@suite-common/test-utils';
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

const BLOCK_HEIGHT = 100;

const initStore = () =>
    createTestStore({
        extra: undefined,
        preloadedState: {
            wallet: {
                blockchain: { ada: { blockHeight: BLOCK_HEIGHT } },
            },
        },
    });

const dispatchFakePendingTx = async (store: ReturnType<typeof initStore>) => {
    await store.dispatch(
        addFakePendingCardanoTxThunk({
            precomposedTransaction: { totalSpent: '2170000', fee: '170000' },
            txid: 'test-txid',
            account,
        }),
    );

    return store.getActions().find(transactionsActions.addTransaction.match);
};

describe('addFakePendingCardanoTxThunk', () => {
    it('stores the pending tx with the fee excluded from the amount, matching the confirmed tx from blockfrost', async () => {
        const addTransactionAction = await dispatchFakePendingTx(initStore());

        expect(addTransactionAction?.payload.transactions).toEqual([
            expect.objectContaining({
                txid: 'test-txid',
                type: 'sent',
                amount: '2000000',
                fee: '170000',
                totalSpent: '2170000',
                blockHash: undefined,
                deadline: 145,
            }),
        ]);
    });

    it('keeps the pending tx alive for 15 minutes worth of Cardano blocks, as Blockfrost only reports the tx once it is confirmed and indexed', async () => {
        const addTransactionAction = await dispatchFakePendingTx(initStore());

        const [transaction] = addTransactionAction?.payload.transactions ?? [];
        const cardanoBlockTimeSeconds = 20;

        expect(transaction?.deadline).toBe(
            BLOCK_HEIGHT + Math.ceil((15 * 60) / cardanoBlockTimeSeconds),
        );
    });
});
