import { configureMockStore } from '@suite-common/test-utils';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import TrezorConnect from '@trezor/connect';

import { synchronizeSentTransactionThunk } from './sendFormThunks';
import { transactionsActions } from '../transactions/transactionsActions';

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

describe('synchronizeSentTransactionThunk – EVM fake pending tx nonce', () => {
    // account.misc.nonce is deliberately pending-inflated here: if the thunk re-derived the nonce
    // (the old behaviour) the fake tx would read 9, not the true signed nonce 7.
    const inflatedEthAccount = {
        ...ethAccount,
        misc: { ...(ethAccount as any).misc, nonce: '9' },
    } as typeof ethAccount;

    const preloadedState = {
        wallet: {
            fees: { eth: { data: { blockTime: 600 } } },
            blockchain: { eth: { blockHeight: 100 } },
            transactions: { transactions: {} },
        },
    };

    const evmPrecomposed = () =>
        precomposed({
            outputs: [{ address: '0x1111111111111111111111111111111111111111', amount: '1000' }],
            feeLimit: '21000',
            maxFeePerGas: '20',
            maxPriorityFeePerGas: '1',
        });

    const getAddedFakeTx = (store: ReturnType<typeof configureMockStore>) => {
        const added = store
            .getActions()
            .filter(action => action.type === transactionsActions.addTransaction.type);

        return added[0]?.payload.transactions[0];
    };

    it('stamps the fake pending tx with the signed nonce passed in, not the re-derived one', () => {
        const store = configureMockStore({ preloadedState });

        store.dispatch(
            synchronizeSentTransactionThunk({
                selectedAccount: inflatedEthAccount,
                precomposedTransaction: evmPrecomposed(),
                precomposedForm: { transactionData: '0x' } as any,
                txid: 'NEW',
                ethereumNonce: '7',
            }),
        );

        expect(getAddedFakeTx(store)?.ethereumSpecific?.nonce).toBe(7);
    });
});
