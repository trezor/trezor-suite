/**
 * @jest-environment jsdom
 */
import { act } from 'react';

import { QueryClient } from '@suite-common/react-query';
import { renderHookWithQueryClient, waitFor } from '@suite-common/test-utils';
import type { Transaction } from '@trezor/blockchain-link-types';
import { asNetworkSymbol } from '@trezor/network-module-types';

import { useChainAccountTransactions } from './useChainAccountTransactions';
import { createFakeChainNetwork } from '../mocks/createFakeChainNetwork';

const tx = (txid: string, blockHeight = 100) => ({ txid, blockHeight }) as Transaction;

const ref = { symbol: asNetworkSymbol('btc'), descriptor: 'zpub', accountType: 'normal' } as const;

const createNetwork = () =>
    createFakeChainNetwork({
        symbol: asNetworkSymbol('btc'),
        balances: { zpub: '1' },
        rate: null,
        history: {
            zpub: [
                { transactions: [tx('a'), tx('b')], nextCursor: { page: 2 }, total: 3 },
                { transactions: [tx('c')], nextCursor: null, total: 3 },
            ],
        },
    });

describe('useChainAccountTransactions', () => {
    it('loads the history page by page until its end', async () => {
        const btc = createNetwork();
        const { result } = renderHookWithQueryClient(() =>
            useChainAccountTransactions({ network: btc.network, ref, enabled: true }),
        );

        await waitFor(() => expect(result.current.isPending).toBe(false));
        expect(result.current).toMatchObject({ total: 3, hasNextPage: true });
        expect(result.current.transactions.map(({ txid }) => txid)).toEqual(['a', 'b']);

        await act(() => result.current.fetchNextPage());

        await waitFor(() => expect(result.current.hasNextPage).toBe(false));
        expect(result.current.transactions.map(({ txid }) => txid)).toEqual(['a', 'b', 'c']);
        expect(btc.getTransactions.mock.calls.map(([params]) => params.cursor)).toEqual([
            { page: 1 },
            { page: 2 },
        ]);
    });

    it('loads pages in order until enough transactions are loaded', async () => {
        const btc = createNetwork();
        const { result } = renderHookWithQueryClient(() =>
            useChainAccountTransactions({ network: btc.network, ref, enabled: true }),
        );
        await waitFor(() => expect(result.current.isPending).toBe(false));

        await act(() => result.current.loadUntil('all'));

        await waitFor(() => expect(result.current.transactions).toHaveLength(3));
        expect(result.current.hasNextPage).toBe(false);
    });

    it('reads nothing while disabled or without a history', () => {
        const btc = createNetwork();
        const withoutHistory = createFakeChainNetwork({
            symbol: asNetworkSymbol('eth'),
            balances: {},
            rate: null,
        });

        const { result } = renderHookWithQueryClient(() =>
            useChainAccountTransactions({ network: btc.network, ref, enabled: false }),
        );
        renderHookWithQueryClient(() =>
            useChainAccountTransactions({ network: withoutHistory.network, ref, enabled: true }),
        );

        expect(result.current).toMatchObject({ transactions: [], isPending: true });
        expect(btc.getTransactions).not.toHaveBeenCalled();
    });

    it('reads the history again when the balance changes', async () => {
        const btc = createNetwork();
        const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
        const { result } = renderHookWithQueryClient(
            () => useChainAccountTransactions({ network: btc.network, ref, enabled: true }),
            { queryClient },
        );
        await waitFor(() => expect(result.current.isPending).toBe(false));
        await waitFor(() => expect(btc.getAccountBalance).toHaveBeenCalled());
        const callsBefore = btc.getTransactions.mock.calls.length;

        btc.getAccountBalance.mockResolvedValueOnce({
            balance: '2',
            availableBalance: '2',
            displayBalance: '2',
            empty: false,
        });
        await act(() =>
            queryClient.refetchQueries({
                queryKey: ['chain', 'btc', 'blockbook', 'account', 'zpub', 'balance'],
            }),
        );

        await waitFor(() =>
            expect(btc.getTransactions.mock.calls.length).toBeGreaterThan(callsBefore),
        );
    });
});
