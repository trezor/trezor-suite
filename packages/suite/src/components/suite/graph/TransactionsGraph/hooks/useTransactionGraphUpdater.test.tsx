import { type PropsWithChildren } from 'react';

import { type UnknownAction } from '@reduxjs/toolkit';

import { QueryClient, QueryClientProvider } from '@suite-common/react-query';
import {
    act,
    createTestStore,
    renderHookWithStoreProvider,
    testMocks,
    waitFor,
} from '@suite-common/test-utils';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import {
    type WalletAccountTransaction,
    asAccountDescriptor,
    createAccountKey,
} from '@suite-common/wallet-types';

import { useTransactionGraphUpdater } from './useTransactionGraphUpdater';

const ACCOUNT_KEY = createAccountKey({
    accountDescriptor: asAccountDescriptor('descriptor'),
    networkSymbol: asNetworkSymbol('btc'),
    deviceStaticSessionId: 'wallet@device:0',
});

const SET_TRANSACTIONS = 'test/set-transactions';

type WalletState = { transactions: { transactions: Record<string, WalletAccountTransaction[]> } };

const initialWalletState: WalletState = { transactions: { transactions: {} } };

const setTransactions = (transactions: WalletAccountTransaction[]) => ({
    type: SET_TRANSACTIONS,
    payload: transactions,
});

const walletReducer = (
    state: WalletState = initialWalletState,
    action: UnknownAction,
): WalletState =>
    action.type === SET_TRANSACTIONS
        ? {
              transactions: {
                  transactions: {
                      [ACCOUNT_KEY]: (action as ReturnType<typeof setTransactions>).payload,
                  },
              },
          }
        : state;

const confirmedTransaction = (txid: string) =>
    testMocks.getWalletTransaction({ txid, blockHeight: 590093 });

const pendingTransaction = (txid: string) =>
    testMocks.getWalletTransaction({ txid, blockHeight: undefined });

const renderTransactionGraphUpdater = ({
    transactions = [],
    hasAccount = true,
}: {
    transactions?: WalletAccountTransaction[];
    hasAccount?: boolean;
} = {}) => {
    const store = createTestStore({ extra: undefined, reducer: { wallet: walletReducer } });
    store.dispatch(setTransactions(transactions));

    const abortSignals: AbortSignal[] = [];
    const onRequestGraphUpdate = jest.fn((abortSignal: AbortSignal) => {
        abortSignals.push(abortSignal);

        return new Promise<never>(() => {
            // The requested update never settles, so it can be observed while still in flight.
        });
    });

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    const { unmount } = renderHookWithStoreProvider(
        () =>
            useTransactionGraphUpdater({
                accountKey: hasAccount ? ACCOUNT_KEY : undefined,
                onRequestGraphUpdate,
            }),
        {
            store,
            wrapper: ({ children }: PropsWithChildren) => (
                <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
            ),
        },
    );

    return { store, onRequestGraphUpdate, abortSignals, unmount };
};

describe('useTransactionGraphUpdater', () => {
    it('requests a graph update for the account', async () => {
        const { onRequestGraphUpdate, abortSignals } = renderTransactionGraphUpdater({
            transactions: [confirmedTransaction('txid1')],
        });

        await waitFor(() => expect(onRequestGraphUpdate).toHaveBeenCalledTimes(1));
        expect(abortSignals[0]?.aborted).toBe(false);
    });

    it('requests no graph update when there is no account (graph of all assets)', async () => {
        const { onRequestGraphUpdate } = renderTransactionGraphUpdater({
            hasAccount: false,
            transactions: [confirmedTransaction('txid1')],
        });

        await act(async () => {});

        expect(onRequestGraphUpdate).not.toHaveBeenCalled();
    });

    it('requests another update once a transaction is confirmed and aborts the outdated one', async () => {
        const { store, onRequestGraphUpdate, abortSignals } = renderTransactionGraphUpdater({
            transactions: [pendingTransaction('txid2'), confirmedTransaction('txid1')],
        });

        await waitFor(() => expect(onRequestGraphUpdate).toHaveBeenCalledTimes(1));

        act(() => {
            store.dispatch(
                setTransactions([confirmedTransaction('txid2'), confirmedTransaction('txid1')]),
            );
        });

        await waitFor(() => expect(onRequestGraphUpdate).toHaveBeenCalledTimes(2));
        expect(abortSignals[0]?.aborted).toBe(true);
        expect(abortSignals[1]?.aborted).toBe(false);
    });

    it('requests no update for an incoming pending transaction', async () => {
        const { store, onRequestGraphUpdate, abortSignals } = renderTransactionGraphUpdater({
            transactions: [confirmedTransaction('txid1')],
        });

        await waitFor(() => expect(onRequestGraphUpdate).toHaveBeenCalledTimes(1));

        act(() => {
            store.dispatch(
                setTransactions([pendingTransaction('txid2'), confirmedTransaction('txid1')]),
            );
        });
        // Give an update, would there be any requested, a chance to start.
        await act(async () => {});

        expect(onRequestGraphUpdate).toHaveBeenCalledTimes(1);
        expect(abortSignals[0]?.aborted).toBe(false);
    });

    it('aborts the update in flight when the graph is unmounted', async () => {
        const { onRequestGraphUpdate, abortSignals, unmount } = renderTransactionGraphUpdater({
            transactions: [confirmedTransaction('txid1')],
        });

        await waitFor(() => expect(onRequestGraphUpdate).toHaveBeenCalledTimes(1));

        unmount();

        expect(abortSignals[0]?.aborted).toBe(true);
    });
});
