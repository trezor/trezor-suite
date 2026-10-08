/**
 * @jest-environment jsdom
 */
import { act } from 'react';

import { QueryClient } from '@suite-common/react-query';
import { renderHookWithQueryClient, waitFor } from '@suite-common/test-utils';
import type { Transaction } from '@trezor/blockchain-link-types';
import type {
    ChainComposeContext,
    ChainSendAccount,
    ChainSendDraft,
    PrecomposedTransactionFinal,
} from '@trezor/network-module-suite-common-types';
import { asNetworkSymbol } from '@trezor/network-module-types';

import { useChainAccountTransactions } from './useChainAccountTransactions';
import { useChainComposeFeeLevels } from './useChainComposeFeeLevels';
import { useChainFeeInfo } from './useChainFeeInfo';
import { useChainPushTransaction, useChainSignTransaction } from './useChainSendMutations';
import { createFakeChainNetwork } from '../mocks/createFakeChainNetwork';

const tx = (txid: string, blockHeight = 100) => ({ txid, blockHeight }) as Transaction;

const account: ChainSendAccount = {
    symbol: asNetworkSymbol('btc'),
    descriptor: 'zpub',
    index: 0,
    path: "m/84'/0'/0'",
    accountType: 'normal',
    deviceState: 'wallet-identity',
    balance: '1000',
    availableBalance: '1000',
    formattedBalance: '0.00001',
};
const ref = { symbol: account.symbol, descriptor: 'zpub', accountType: 'normal' } as const;

const draft = (amount: string): ChainSendDraft => ({
    outputs: [
        {
            type: 'payment',
            address: 'bc1recipient',
            amount,
            fiat: '',
            currency: { value: 'usd', label: 'USD' },
            token: null,
        },
    ],
    feePerUnit: '',
    feeLimit: '',
    options: [],
    isCoinControlEnabled: false,
    selectedUtxos: [],
});

const context: ChainComposeContext = {
    feeInfo: { blockHeight: 1, blockTime: 10, minFee: 1, maxFee: 2, minPriorityFee: 0, levels: [] },
};

const precomposed = {
    type: 'final',
    fee: '100',
    feePerByte: '1',
    totalSpent: '600',
    bytes: 100,
    inputs: [],
    outputsPermutation: [0],
    outputs: [{ address: 'bc1recipient', amount: '500', script_type: 'PAYTOADDRESS' }],
} as unknown as PrecomposedTransactionFinal;

const createNetwork = (history: readonly Transaction[] = [tx('old')]) =>
    createFakeChainNetwork({
        symbol: account.symbol,
        balances: { zpub: '1000' },
        rate: null,
        history: { zpub: [{ transactions: history, nextCursor: null, total: history.length }] },
        canSend: true,
    });

// Mutations are retried by default in production; sending must opt out.
const retryingQueryClient = () =>
    new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: 3 } } });

type DraftProps = { amount: string };

describe('useChainComposeFeeLevels', () => {
    it('composes each draft once, and again only for a changed draft', async () => {
        const btc = createNetwork();
        btc.send.composeFeeLevels.mockImplementation(({ draft: { outputs } }) =>
            Promise.resolve({ normal: { ...precomposed, totalSpent: outputs[0]!.amount } }),
        );

        const { result, rerender } = renderHookWithQueryClient(
            ({ amount }: DraftProps) =>
                useChainComposeFeeLevels({
                    network: btc.network,
                    account,
                    draft: draft(amount),
                    context,
                    enabled: true,
                }),
            { initialProps: { amount: '1' } },
        );

        await waitFor(() => expect(result.current.data?.normal).toMatchObject({ totalSpent: '1' }));
        rerender({ amount: '1' });
        rerender({ amount: '2' });
        await waitFor(() => expect(result.current.data?.normal).toMatchObject({ totalSpent: '2' }));

        expect(btc.send.composeFeeLevels).toHaveBeenCalledTimes(2);
        expect(btc.send.composeFeeLevels.mock.calls[1]![0].signal).toBeInstanceOf(AbortSignal);
    });

    it('composes nothing without a draft', () => {
        const btc = createNetwork();

        renderHookWithQueryClient(() =>
            useChainComposeFeeLevels({
                network: btc.network,
                account,
                draft: undefined,
                context,
                enabled: true,
            }),
        );

        expect(btc.send.composeFeeLevels).not.toHaveBeenCalled();
    });
});

describe('useChainFeeInfo', () => {
    it('reads the fee levels a network quotes itself', async () => {
        const feeInfo = { ...context.feeInfo, blockHeight: 42 };
        const runtime = createFakeChainNetwork({
            symbol: asNetworkSymbol('abc'),
            balances: {},
            rate: null,
            canSend: true,
            feeInfo,
        });

        const { result } = renderHookWithQueryClient(() =>
            useChainFeeInfo({ network: runtime.network, enabled: true }),
        );

        await waitFor(() => expect(result.current.data).toEqual(feeInfo));
        expect(runtime.send.getFeeInfo).toHaveBeenCalledTimes(1);
    });

    it('asks nothing of a network that quotes no fees', () => {
        const btc = createNetwork();

        const { result } = renderHookWithQueryClient(() =>
            useChainFeeInfo({ network: btc.network, enabled: true }),
        );

        expect(result.current.fetchStatus).toBe('idle');
        expect(result.current.data).toBeUndefined();
    });
});

describe('useChainSignTransaction', () => {
    it('asks the device once, whatever the answer', async () => {
        const btc = createNetwork();
        btc.send.sign.mockRejectedValue(new Error('tx-cancelled'));

        const { result } = renderHookWithQueryClient(() => useChainSignTransaction(), {
            queryClient: retryingQueryClient(),
        });

        await act(() =>
            expect(
                result.current.mutateAsync({
                    network: btc.network,
                    account,
                    draft: draft('1'),
                    precomposed,
                    options: { device: {} },
                }),
            ).rejects.toThrow('tx-cancelled'),
        );

        expect(btc.send.sign).toHaveBeenCalledTimes(1);
    });
});

describe('useChainPushTransaction', () => {
    const renderSendAndHistory = (btc: ReturnType<typeof createNetwork>) =>
        renderHookWithQueryClient(
            () => ({
                push: useChainPushTransaction(),
                history: useChainAccountTransactions({ network: btc.network, ref, enabled: true }),
            }),
            { queryClient: retryingQueryClient() },
        );

    const push = (
        result: { current: ReturnType<typeof renderSendAndHistory>['result']['current'] },
        btc: ReturnType<typeof createNetwork>,
        replacedTxid?: string,
    ) =>
        act(() =>
            result.current.push.mutateAsync({
                network: btc.network,
                account,
                serializedTx: 'signed',
                isMevProtectionEnabled: false,
                origin: { precomposed, signed: { serializedTx: 'signed' }, replacedTxid },
            }),
        );

    it('shows the broadcast transaction on top of the history and reads the account again', async () => {
        const btc = createNetwork();
        btc.send.push.mockResolvedValue({ txid: 'new' });
        const { result } = renderSendAndHistory(btc);
        await waitFor(() => expect(result.current.history.isPending).toBe(false));

        await push(result, btc);

        await waitFor(() =>
            expect(result.current.history.transactions.map(({ txid }) => txid)).toEqual([
                'new',
                'old',
            ]),
        );
        expect(result.current.history.transactions[0]).toMatchObject({
            type: 'sent',
            amount: '500',
            fee: '100',
        });
        expect(btc.getTransactions).toHaveBeenCalledTimes(2);
    });

    it('hides the replaced transaction and leaves it to the backend once listed', async () => {
        const btc = createNetwork([tx('replaced')]);
        btc.send.push.mockResolvedValue({ txid: 'replacement' });
        const { result } = renderSendAndHistory(btc);
        await waitFor(() => expect(result.current.history.isPending).toBe(false));

        btc.getTransactions.mockResolvedValue({
            transactions: [tx('replacement', -1), tx('replaced')],
            nextCursor: null,
            total: 2,
        });
        await push(result, btc, 'replaced');

        await waitFor(() =>
            expect(result.current.history.transactions).toEqual([
                tx('replacement', -1),
                tx('replaced'),
            ]),
        );
    });

    it('reads the account again after a raw transaction, showing nothing it cannot know', async () => {
        const btc = createNetwork();
        btc.send.push.mockResolvedValue({ txid: 'raw' });
        const { result } = renderSendAndHistory(btc);
        await waitFor(() => expect(result.current.history.isPending).toBe(false));

        await act(() =>
            result.current.push.mutateAsync({
                network: btc.network,
                account,
                serializedTx: 'raw-hex',
                isMevProtectionEnabled: false,
            }),
        );

        await waitFor(() => expect(btc.getTransactions).toHaveBeenCalledTimes(2));
        expect(btc.send.createPendingTransaction).not.toHaveBeenCalled();
        expect(result.current.history.transactions.map(({ txid }) => txid)).toEqual(['old']);
    });

    it('broadcasts once, even when the backend refuses', async () => {
        const btc = createNetwork();
        btc.send.push.mockRejectedValue(new Error('push-failed'));
        const { result } = renderSendAndHistory(btc);

        await act(() =>
            expect(
                result.current.push.mutateAsync({
                    network: btc.network,
                    account,
                    serializedTx: 'signed',
                    isMevProtectionEnabled: false,
                    origin: { precomposed, signed: { serializedTx: 'signed' } },
                }),
            ).rejects.toThrow('push-failed'),
        );

        expect(btc.send.push).toHaveBeenCalledTimes(1);
    });
});
