import { configureMockStore } from '@suite-common/test-utils';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import TrezorConnect from '@trezor/connect';

import { synchronizeSentTransactionThunk } from '../../src/send/sendFormThunks';
import { transactionsActions } from '../../src/transactions/transactionsActions';

const ethAccount = mockWalletAccount({ symbol: 'eth' });

const precomposed = (extra?: Record<string, unknown>) =>
    ({ type: 'final', totalSpent: '0', fee: '0', outputs: [], inputs: [], ...extra }) as any;

describe('synchronizeSentTransactionThunk – RBF eviction (#28147)', () => {
    let getTransactions: jest.SpyInstance;

    beforeEach(() => {
        getTransactions = jest
            .spyOn(TrezorConnect, 'blockchainGetTransactions')
            .mockResolvedValue({ success: true, payload: [] } as any);
    });

    afterEach(() => jest.restoreAllMocks());

    it('evicts the replaced pending tx when the precomposed tx has prevTxid', () => {
        const store = configureMockStore({});

        store.dispatch(
            synchronizeSentTransactionThunk({
                selectedAccount: ethAccount,
                precomposedTransaction: precomposed({ prevTxid: 'OLD' }),
                txid: 'NEW',
            }),
        );

        expect(getTransactions).toHaveBeenCalledWith(expect.objectContaining({ txs: ['OLD'] }));

        const removed = store
            .getActions()
            .filter(action => action.type === transactionsActions.removeTransaction.type);
        expect(removed).toHaveLength(1);
        expect(removed[0]!.payload).toMatchObject({ txs: [{ txid: 'OLD' }] });
    });

    it('does not evict for a normal (non-RBF) transaction', () => {
        const store = configureMockStore({});

        store.dispatch(
            synchronizeSentTransactionThunk({
                selectedAccount: ethAccount,
                precomposedTransaction: precomposed(),
                txid: 'NEW',
            }),
        );

        expect(getTransactions).not.toHaveBeenCalled();
        const removed = store
            .getActions()
            .filter(action => action.type === transactionsActions.removeTransaction.type);
        expect(removed).toHaveLength(0);
    });
});
