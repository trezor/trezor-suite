import { type PropsWithChildren } from 'react';
import { Provider } from 'react-redux';

import { type Middleware, type UnknownAction, configureStore } from '@reduxjs/toolkit';
import { act, renderHook, waitFor } from '@testing-library/react';

import { mockDesktopAnalytics } from '@suite/analytics/mocks';
import { flagsInitialState } from '@suite/flags';
import { openDeferredModal } from '@suite/modal';
import { getChainPendingSendsQueryOptions } from '@suite-common/chain-data';
import { createFakeChainNetwork } from '@suite-common/chain-data/mocks/createFakeChainNetwork';
import { createStaticChainNetworksStore } from '@suite-common/chain-data/mocks/createStaticChainNetworksStore';
import { ServicesProvider } from '@suite-common/dependency-injection';
import { QueryClient, QueryClientProvider, useQuery } from '@suite-common/react-query';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { synchronizeSentTransactionThunk } from '@suite-common/wallet-core';
import {
    type FormState,
    type PrecomposedTransactionFinal,
    asAccountDescriptor,
} from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import type { RuntimeEvmNetworkDefinition } from '@trezor/network-ethereum-suite-common';
import { type ChainSendAccount, ChainSendError } from '@trezor/network-module-suite-common-types';

import { signAndPushSendFormTransactionThunk } from 'src/actions/wallet/send/sendFormThunks';
import { useSendSession } from 'src/support/chainSend/SendSessionContext';
import { SendSessionProvider } from 'src/support/chainSend/SendSessionProvider';

import {
    useSignAndPushThroughNetwork,
    useSignAndPushTransaction,
} from './useSignAndPushTransaction';

const device = { path: 'device-path', instance: 1, state: undefined };

jest.mock('@suite-common/device', () => ({
    ...jest.requireActual('@suite-common/device'),
    selectSelectedDevice: () => device,
}));

jest.mock('@suite-common/mev', () => ({
    ...jest.requireActual('@suite-common/mev'),
    selectIsMevProtectionFeatureEnabled: () => false,
}));

jest.mock('@suite/modal', () => ({
    ...jest.requireActual('@suite/modal'),
    openDeferredModal: jest.fn(),
}));

jest.mock('@suite-common/wallet-core', () => ({
    ...jest.requireActual('@suite-common/wallet-core'),
    selectIsMevProtectionEnabled: () => false,
    selectWalletChainSignOptions: () => ({ device: { path: 'device-path' } }),
    showSentTransactionToastThunk: (payload: unknown) => ({ type: 'sentToast', payload }),
    synchronizeSentTransactionThunk: jest.fn((payload: unknown) => ({
        type: 'synchronizeSent',
        payload,
    })),
}));

jest.mock('src/actions/labels/moveLabelsForRbfThunk', () => ({
    asStateBeforePush: () => ({}),
}));

jest.mock('src/actions/wallet/send/sendFormThunks', () => ({
    applySendFormMetadataLabelsThunk: (payload: unknown) => ({ type: 'metadataLabels', payload }),
    updateRbfLabelsThunk: (payload: unknown) => ({ type: 'rbfLabels', payload }),
    signAndPushSendFormTransactionThunk: jest.fn(() => () => ({
        unwrap: () => Promise.resolve({ success: true, payload: { txid: 'legacy' } }),
    })),
}));

const account = mockWalletAccount({
    symbol: asNetworkSymbol('btc'),
    descriptor: asAccountDescriptor('zpub'),
});

const formState = { outputs: [{ address: 'bc1recipient', amount: '0.00001' }] } as FormState;

const precomposedTransaction = {
    type: 'final',
    fee: '100',
    totalSpent: '1100',
    outputs: [{ address: 'bc1recipient', amount: '1000' }],
    outputsPermutation: [0],
} as unknown as PrecomposedTransactionFinal;

const signed = { serializedTx: 'signed-hex' };

const mockDecision = (decision: Promise<boolean>) =>
    jest.mocked(openDeferredModal).mockReturnValue((() => decision) as never);

const createDecision = () => {
    let decide: (isConfirmed: boolean) => void = () => {};
    const decision = new Promise<boolean>(resolve => {
        decide = resolve;
    });

    return { decision, decide };
};

const runtimeDefinition: RuntimeEvmNetworkDefinition = {
    symbol: asNetworkSymbol('abc'),
    chainId: 777,
    name: 'Example Chain',
    nativeSymbol: 'EXC',
    decimals: 18,
    rpcUrls: ['https://rpc.example.com'],
    source: 'user',
};

const runtimeAccount: ChainSendAccount = {
    symbol: runtimeDefinition.symbol,
    descriptor: '0xabc',
    index: 0,
    path: "m/44'/60'/0'/0/0",
    accountType: 'normal',
    deviceState: 'state',
    balance: '1000000000000000000',
    availableBalance: '1000000000000000000',
    formattedBalance: '1',
};

const runtimeFormState = {
    outputs: [{ address: '0xrecipient', amount: '0.5' }],
} as FormState;

const renderSend = (queryChainData: boolean, symbol = account.symbol) => {
    const report = jest.fn();
    const btc = createFakeChainNetwork({
        symbol,
        balances: {},
        rate: null,
        canSend: true,
    });
    const actions: UnknownAction[] = [];
    const recordActions: Middleware = () => next => action => {
        actions.push(action as UnknownAction);

        return next(action);
    };
    const store = configureStore({
        reducer: {
            flags: () => ({ ...flagsInitialState, queryChainData }),
            wallet: () => ({ transactions: { transactions: {} } }),
        },
        middleware: getDefaultMiddleware =>
            getDefaultMiddleware({ serializableCheck: false }).concat(recordActions),
    });
    const services = {
        store,
        analytics: mockDesktopAnalytics(report),
        chainNetworksStore: createStaticChainNetworksStore([btc.network]),
    };
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: 3 } },
    });
    const wrapper = ({ children }: PropsWithChildren) => (
        <Provider store={store}>
            <ServicesProvider services={services}>
                <QueryClientProvider client={queryClient}>
                    <SendSessionProvider>{children}</SendSessionProvider>
                </QueryClientProvider>
            </ServicesProvider>
        </Provider>
    );
    const { result } = renderHook(
        () => ({
            signAndPush: useSignAndPushTransaction(),
            signAndPushThroughNetwork: useSignAndPushThroughNetwork(),
            session: useSendSession(),
            pendingSends: useQuery(getChainPendingSendsQueryOptions(btc.network, 'zpub')).data,
            runtimePendingSends: useQuery(getChainPendingSendsQueryOptions(btc.network, '0xabc'))
                .data,
        }),
        { wrapper },
    );
    const send = () =>
        act(() =>
            result.current.signAndPush({
                formState,
                precomposedTransaction,
                selectedAccount: account,
            }),
        );
    const runtimeSendParams = {
        network: btc.network,
        target: {
            kind: 'runtime',
            runtime: {
                network: runtimeDefinition,
                account: runtimeAccount,
                walletAccountKey: account.key,
            },
        },
        formState: runtimeFormState,
        precomposedTransaction,
    } as const;
    const sendOnRuntime = () =>
        act(() => result.current.signAndPushThroughNetwork(runtimeSendParams));
    const actionTypes = () => actions.map(({ type }) => type);

    return { btc, result, send, sendOnRuntime, runtimeSendParams, actions, actionTypes, report };
};

describe(useSignAndPushTransaction.name, () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('leaves the whole flow to the wallet while the flag is off', async () => {
        const { btc, send } = renderSend(false);

        expect(await send()).toEqual({ success: true, payload: { txid: 'legacy' } });

        expect(signAndPushSendFormTransactionThunk).toHaveBeenCalledWith(
            expect.objectContaining({ formState, precomposedTransaction }),
        );
        expect(btc.send.sign).not.toHaveBeenCalled();
    });

    it('signs, waits for the user, broadcasts and shows the transaction as pending', async () => {
        const { btc, result, actionTypes } = renderSend(true);
        const { decision, decide } = createDecision();
        mockDecision(decision);
        btc.send.sign.mockResolvedValue(signed);
        btc.send.push.mockResolvedValue({ txid: 'sent' });

        let outcome: Promise<unknown> = Promise.resolve();
        act(() => {
            outcome = result.current.signAndPush({
                formState,
                precomposedTransaction,
                selectedAccount: account,
            });
        });

        // The review shows the signed transaction while the user decides.
        await waitFor(() =>
            expect(result.current.session?.serializedTx).toEqual({
                tx: 'signed-hex',
                symbol: account.symbol,
            }),
        );
        expect(result.current.session).toMatchObject({
            accountKey: account.key,
            precomposedForm: formState,
        });
        expect(btc.send.push).not.toHaveBeenCalled();

        await act(async () => {
            decide(true);
            await outcome;
        });

        await expect(outcome).resolves.toEqual({ success: true, payload: { txid: 'sent' } });
        expect(btc.send.sign).toHaveBeenCalledWith(
            expect.objectContaining({ account, draft: formState }),
        );
        expect(btc.send.push).toHaveBeenCalledWith({
            account,
            serializedTx: 'signed-hex',
            isMevProtectionEnabled: false,
        });
        expect(result.current.pendingSends?.map(send => send.transaction.txid)).toEqual(['sent']);
        expect(result.current.session).toBeUndefined();
        expect(synchronizeSentTransactionThunk).toHaveBeenCalledWith(
            expect.objectContaining({ txid: 'sent', selectedAccount: account }),
        );
        expect(actionTypes()).toEqual(
            expect.arrayContaining(['@modal/preserve', '@modal/close', 'sentToast']),
        );
    });

    it('broadcasts nothing when the user declines', async () => {
        const { btc, result, send } = renderSend(true);
        mockDecision(Promise.resolve(false));
        btc.send.sign.mockResolvedValue(signed);

        expect(await send()).toBeUndefined();

        expect(btc.send.push).not.toHaveBeenCalled();
        expect(result.current.pendingSends).toBeUndefined();
    });

    it('keeps the review open to sign again after a timeout', async () => {
        const { btc, result, send, actionTypes } = renderSend(true);
        btc.send.sign.mockRejectedValue(
            new ChainSendError('sign-failed', account.symbol, 'tx-timeout'),
        );

        expect(await send()).toMatchObject({
            success: false,
            error: { code: 'sign-transaction-timeout' },
        });

        expect(btc.send.sign).toHaveBeenCalledTimes(1);
        expect(result.current.session?.precomposedTx).toMatchObject({ fee: '100' });
        expect(actionTypes()).not.toContain('@modal/close');
    });

    it('closes the review quietly when the user cancels signing', async () => {
        const { btc, result, send, actionTypes } = renderSend(true);
        btc.send.sign.mockRejectedValue(
            new ChainSendError('sign-failed', account.symbol, 'tx-cancelled'),
        );

        expect(await send()).toBeUndefined();

        expect(result.current.session).toBeUndefined();
        expect(actionTypes()).toContain('@modal/close');
        expect(actionTypes()).not.toContain('@common/in-app-notifications/addToast');
    });

    it('tells the user when the backend refuses the transaction, once', async () => {
        const { btc, result, send, actionTypes } = renderSend(true);
        mockDecision(Promise.resolve(true));
        btc.send.sign.mockResolvedValue(signed);
        btc.send.push.mockRejectedValue(
            new ChainSendError('push-failed', account.symbol, 'bad-txns', 'Backend_Error'),
        );

        expect(await send()).toEqual({
            success: false,
            error: { code: 'Backend_Error', message: 'bad-txns' },
        });

        expect(btc.send.push).toHaveBeenCalledTimes(1);
        expect(result.current.session?.serializedTx).toBeUndefined();
        expect(result.current.pendingSends).toBeUndefined();
        expect(actionTypes()).toContain('@common/in-app-notifications/addToast');
    });

    describe('on a runtime network', () => {
        it('signs at the wallet address, broadcasts, and leaves the wallet out of it', async () => {
            const { btc, result, sendOnRuntime, actions, actionTypes, report } = renderSend(
                true,
                runtimeDefinition.symbol,
            );
            mockDecision(Promise.resolve(true));
            btc.send.sign.mockResolvedValue(signed);
            btc.send.push.mockResolvedValue({ txid: 'runtime-txid' });

            expect(await sendOnRuntime()).toEqual({
                success: true,
                payload: { txid: 'runtime-txid' },
            });

            expect(btc.send.sign).toHaveBeenCalledWith(
                expect.objectContaining({ account: runtimeAccount, draft: runtimeFormState }),
            );
            expect(btc.send.push).toHaveBeenCalledWith({
                account: runtimeAccount,
                serializedTx: 'signed-hex',
                isMevProtectionEnabled: false,
            });
            expect(result.current.runtimePendingSends?.map(send => send.transaction.txid)).toEqual([
                'runtime-txid',
            ]);
            expect(synchronizeSentTransactionThunk).not.toHaveBeenCalled();
            expect(actionTypes()).not.toEqual(
                expect.arrayContaining(['sentToast', 'metadataLabels', 'rbfLabels']),
            );
            expect(actions).toContainEqual(
                expect.objectContaining({
                    payload: expect.objectContaining({
                        type: 'runtime-chain-tx-sent',
                        amount: '0.5',
                        displaySymbol: 'EXC',
                        txid: 'runtime-txid',
                    }),
                }),
            );
            // Which runtime network was used stays on the device.
            expect(report.mock.calls.map(([event]) => event.payload)).toEqual([
                { assetSymbol: 'runtime-evm' },
                { assetSymbol: 'runtime-evm' },
            ]);
        });

        it('holds a runtime session while reviewing, in React state only', async () => {
            const { btc, result, runtimeSendParams, actionTypes } = renderSend(
                true,
                runtimeDefinition.symbol,
            );
            const { decision, decide } = createDecision();
            mockDecision(decision);
            btc.send.sign.mockResolvedValue(signed);
            btc.send.push.mockResolvedValue({ txid: 'runtime-txid' });

            let outcome: Promise<unknown> = Promise.resolve();
            act(() => {
                outcome = result.current.signAndPushThroughNetwork(runtimeSendParams);
            });

            await waitFor(() => expect(result.current.session?.serializedTx).toBeDefined());
            expect(result.current.session).toMatchObject({
                kind: 'runtime',
                runtime: { network: runtimeDefinition, walletAccountKey: account.key },
            });
            // Nothing about the runtime send goes to the store but the modal it opens.
            expect(actionTypes()).toEqual(['@modal/preserve']);

            await act(async () => {
                decide(false);
                await outcome;
            });
            expect(btc.send.push).not.toHaveBeenCalled();
        });

        it('closes the review when the device fails', async () => {
            const { btc, result, sendOnRuntime, actionTypes } = renderSend(
                true,
                runtimeDefinition.symbol,
            );
            btc.send.sign.mockRejectedValue(
                new ChainSendError('sign-failed', runtimeDefinition.symbol, 'device-disconnected'),
            );

            expect(await sendOnRuntime()).toBeUndefined();

            expect(result.current.session).toBeUndefined();
            expect(actionTypes()).toContain('@modal/close');
            expect(btc.send.push).not.toHaveBeenCalled();
        });
    });
});
