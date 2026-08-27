import { type AnalyticsSharedEvents } from '@suite-common/analytics';
import { asGetter } from '@suite-common/dependency-injection';
import { configureMockStore } from '@suite-common/test-utils';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { mockAnalytics } from '@trezor/analytics-uploader/mocks';
import TrezorConnect from '@trezor/connect';

import {
    type SynchronizeSentTransactionThunkDeps,
    synchronizeSentTransactionThunk,
} from './sendFormThunks';
import { syncAccountsWithBlockchainThunk } from '../blockchain/blockchainThunks';
import { transactionsActions } from '../transactions/transactionsActions';

const ethAccount = mockWalletAccount({ symbol: asNetworkSymbol('eth') });
const extra: SynchronizeSentTransactionThunkDeps = {
    services: {
        analytics: mockAnalytics<AnalyticsSharedEvents>(),
        getIsWindowVisible: asGetter(() => true),
        getTradedAccountKeys: asGetter(() => []),
    },
};

const precomposed = (overrides?: Record<string, unknown>) =>
    ({ type: 'final', totalSpent: '0', fee: '0', outputs: [], inputs: [], ...overrides }) as any;

describe('synchronizeSentTransactionThunk – RBF eviction (#28147)', () => {
    let getTransactions: jest.SpyInstance;

    beforeEach(() => {
        getTransactions = jest
            .spyOn(TrezorConnect, 'blockchainGetTransactions')
            .mockResolvedValue({ success: true, payload: [] } as any);
    });

    afterEach(() => jest.restoreAllMocks());

    it('evicts the replaced pending tx when the precomposed tx has prevTxid', () => {
        const store = configureMockStore({ extra });

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
        const store = configureMockStore({ extra });

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
        const added = store.getActions().filter(transactionsActions.addTransaction.match);

        return added[0]?.payload.transactions[0];
    };

    it('stamps the fake pending tx with the signed nonce passed in, not the re-derived one', () => {
        const store = configureMockStore({ extra, preloadedState });

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

describe('synchronizeSentTransactionThunk – periodic sync kick', () => {
    // External-backend EVM networks get no block-driven syncs and the confirmation
    // notification can be missed, so a send must (re)start the self-re-arming per-symbol
    // sync — otherwise the freshly added pending tx may never flip to confirmed.
    it('dispatches syncAccountsWithBlockchainThunk for the sent EVM account', () => {
        const store = configureMockStore({ extra });

        store.dispatch(
            synchronizeSentTransactionThunk({
                selectedAccount: ethAccount,
                precomposedTransaction: precomposed(),
                txid: 'NEW',
            }),
        );

        const syncActions = store
            .getActions()
            .filter(syncAccountsWithBlockchainThunk.pending.match);
        expect(syncActions).toHaveLength(1);
        expect(syncActions[0]!.meta.arg).toBe(ethAccount.symbol);
    });
});
