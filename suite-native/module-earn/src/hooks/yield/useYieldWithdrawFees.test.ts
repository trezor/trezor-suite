import { type ThunkDispatch, type UnknownAction, combineReducers } from '@reduxjs/toolkit';

import { asNetworkSymbol } from '@suite-common/wallet-config';
import { formDraftActions, formDraftReducer } from '@suite-common/wallet-core';
import { mockResolvedYieldFlowData } from '@suite-common/wallet-core/mocks';
import { type FeeInfo, isFinalPrecomposedTransaction } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import {
    act,
    createLightStore,
    createStaticReducer,
    renderHookWithStoreProvider,
} from '@suite-native/test-utils-store';
import {
    prepareSendFormReducer,
    transactionManagementActions,
} from '@suite-native/transaction-management';
import { mockActionType, mockReducer } from '@trezor/redux-utils/mocks';
import { createDeferred } from '@trezor/utils';

import { useYieldWithdrawFees } from './useYieldWithdrawFees';
import { getSelectedEvmFeeFromFormDraft } from '../../utils/yield/yieldSelectedFeeUtils';

const mockCompose = jest.fn();
jest.mock('@suite-common/wallet-core', () => ({
    ...jest.requireActual('@suite-common/wallet-core'),
    updateFeeInfoThunk: () => () => Promise.resolve(),
    composeYieldWithdrawTransactionThunk: () => () => ({ unwrap: () => mockCompose() }),
}));

const FLOW = mockResolvedYieldFlowData({
    account: mockWalletAccount({
        symbol: asNetworkSymbol('eth'),
        availableBalance: '1000000000000000000',
    }),
});
const UNSIGNED_TRANSACTION = JSON.stringify({
    from: '0x1111111111111111111111111111111111111111',
    to: '0x0000000000000000000000000000000000000001',
    data: '0x6e553f65',
    chainId: 1,
    gasLimit: '0x30d40',
    nonce: '0x1',
    value: '0x0',
    gasPrice: '0x3b9aca00',
});
const feeInfo: FeeInfo = {
    blockHeight: 100,
    blockTime: 12,
    minFee: 1,
    maxFee: 100,
    minPriorityFee: 0,
    levels: [
        { label: 'normal', feePerUnit: '10000000000', blocks: 1, feeLimit: '21000' },
        { label: 'low', feePerUnit: '8000000000', blocks: 2 },
    ],
};
const initialProps: Parameters<typeof useYieldWithdrawFees>[0] = {
    ...FLOW,
    amount: '1',
    flowType: 'withdraw',
    isEnabled: true,
};
const settle = () => act(() => jest.advanceTimersByTimeAsync(300));
const renderFees = async (overrides: Partial<typeof initialProps> = {}) => {
    const store = createLightStore({
        reducer: {
            discreetMode: createStaticReducer({ isActive: false }),
            locale: createStaticReducer({ systemLocaleCode: 'en', appLocaleCode: 'system' }),
            wallet: combineReducers({
                settings: createStaticReducer({ localCurrency: 'usd', bitcoinAmountUnit: 0 }),
                fees: createStaticReducer({ eth: { status: 'loaded', data: feeInfo } }),
                formDrafts: formDraftReducer,
                send: prepareSendFormReducer({
                    actionTypes: { storageLoad: mockActionType('storageLoad') },
                    reducers: { storageLoadFormDrafts: mockReducer() },
                }),
            }),
        },
    });

    const hook = await renderHookWithStoreProvider(useYieldWithdrawFees, {
        initialProps: { ...initialProps, ...overrides },
        services: { store, analytics: mockNativeAnalytics() },
    });

    return { ...hook, store };
};

describe('Yield withdraw fee selection', () => {
    beforeEach(() => {
        jest.useFakeTimers();
        mockCompose.mockResolvedValue({
            type: 'success',
            unsignedTransaction: UNSIGNED_TRANSACTION,
        });
    });
    afterEach(() => {
        jest.clearAllMocks();
        jest.useRealTimers();
    });

    it('retains a newer Standard choice when an earlier amount composition completes', async () => {
        const { result, rerender, store } = await renderFees();
        await settle();
        const pending = createDeferred<{ type: string; unsignedTransaction: string }>();
        mockCompose.mockReturnValueOnce(pending.promise);
        await rerender({ ...initialProps, amount: '2' });
        await settle();
        await act(() =>
            store.dispatch(
                formDraftActions.storeDraft({
                    key: result.current.formDraftKey,
                    formDraft: { ...result.current.formDraft!, selectedFee: 'low' },
                }),
            ),
        );
        await act(() =>
            pending.resolve({ type: 'success', unsignedTransaction: UNSIGNED_TRANSACTION }),
        );
        expect(result.current.formDraft?.selectedFee).toBe('low');
        expect(result.current.formDraft?.feePerUnit).toBe('8');
        expect(result.current.preparedAction?.amount).toBe('2');
        await settle();
        expect(mockCompose).toHaveBeenCalledTimes(2);
    });

    it('rebuilds the confirmed Custom level when the withdrawal amount changes', async () => {
        const { result, rerender, store } = await renderFees();
        await settle();
        await act(() =>
            store.dispatch(
                formDraftActions.storeDraft({
                    key: result.current.formDraftKey,
                    formDraft: {
                        ...result.current.formDraft!,
                        selectedFee: 'custom',
                        feePerUnit: '3',
                        feeLimit: '450000',
                        maxFeePerGas: '3',
                        maxPriorityFeePerGas: '1',
                    },
                }),
            ),
        );
        await rerender({ ...initialProps, amount: '2' });
        await settle();
        expect(result.current.formDraft).toMatchObject({
            selectedFee: 'custom',
            feeLimit: '450000',
            maxFeePerGas: '3',
        });
        const { custom, normal } = store.getState().wallet.send.feeLevels;
        expect(isFinalPrecomposedTransaction(custom)).toBe(true);
        expect(custom).toMatchObject({
            feeLimit: '450000',
            estimatedFeeLimit: '200000',
            fee: '1350000000000000',
        });
        expect(normal).toMatchObject({ feeLimit: '200000' });
        expect(result.current.fee).toBe('1350000000000000');
        await settle();
        expect(mockCompose).toHaveBeenCalledTimes(2);
    });
    it('replaces a Custom limit that no longer covers the composed gas with a usable Standard level', async () => {
        const { result, rerender, store } = await renderFees();
        await settle();
        await act(() =>
            store.dispatch(
                formDraftActions.storeDraft({
                    key: result.current.formDraftKey,
                    formDraft: {
                        ...result.current.formDraft!,
                        selectedFee: 'custom',
                        feePerUnit: '3',
                        feeLimit: '45000',
                    },
                }),
            ),
        );
        await rerender({ ...initialProps, amount: '2' });
        await settle();
        expect(result.current.formDraft).toMatchObject({ selectedFee: 'low', feeLimit: '200000' });
        expect(store.getState().wallet.send.feeLevels.custom).toBeUndefined();
        expect(result.current.preparedAction?.amount).toBe('2');
    });
    it.each(['0', '1600000000000000', '2000000000000000'])(
        'keeps an explanatory fee picker at ETH balance %s and allows exact coverage',
        async availableBalance => {
            const { result, store } = await renderFees({
                flowData: {
                    ...FLOW.flowData,
                    account: { ...FLOW.account, availableBalance },
                },
            });
            await settle();
            const levels = store.getState().wallet.send.feeLevels;
            expect(levels.normal?.type).toBe(
                availableBalance === '2000000000000000' ? 'final' : 'error',
            );
            expect(levels.low?.type).toBe(availableBalance === '0' ? 'error' : 'final');
            expect(result.current.hasFeeEstimationError).toBe(false);
            expect(result.current.formDraft?.selectedFee).toBe('normal');
            expect(result.current.isFeeUnavailable).toBe(availableBalance !== '2000000000000000');
            expect(result.current.preparedAction).not.toBeNull();
            if (availableBalance === '1600000000000000') {
                await act(() =>
                    (
                        store.dispatch as ThunkDispatch<
                            ReturnType<typeof store.getState>,
                            Record<never, never>,
                            UnknownAction
                        >
                    )(
                        result.current.updateFeeLevelThunk({
                            accountKey: FLOW.account.key,
                            formDraftKey: result.current.formDraftKey,
                            feeLevelLabel: 'low',
                        }),
                    ),
                );
                expect(result.current.isFeeUnavailable).toBe(false);
                expect(result.current.fee).toBe('1600000000000000');
            }
        },
    );
    it('recovers after an ETH top-up without requiring an amount edit', async () => {
        const { result, rerender } = await renderFees({
            flowData: {
                ...FLOW.flowData,
                account: { ...FLOW.account, availableBalance: '0' },
            },
        });
        await settle();
        expect(result.current.isFeeUnavailable).toBe(true);
        await rerender(initialProps);
        await settle();
        expect(result.current.isFeeUnavailable).toBe(false);
        expect(result.current.formDraft?.selectedFee).toBe('normal');
        await settle();
        expect(mockCompose).toHaveBeenCalledTimes(2);
    });
    it('confirms the committed legacy preview and clears hidden EIP-1559 form values', async () => {
        const { result, store } = await renderFees();
        await settle();
        const custom = result.current.getCustomFeeLevel?.({
            label: 'custom',
            blocks: -1,
            feePerUnit: '15',
            feeLimit: '450000',
        });
        if (!isFinalPrecomposedTransaction(custom)) throw new Error('Missing Custom preview');
        await act(() => {
            store.dispatch(transactionManagementActions.storeCustomFeeLevel({ feeLevel: custom }));

            return (
                store.dispatch as ThunkDispatch<
                    ReturnType<typeof store.getState>,
                    Record<never, never>,
                    UnknownAction
                >
            )(
                result.current.updateFeeLevelThunk({
                    accountKey: FLOW.account.key,
                    formDraftKey: result.current.formDraftKey,
                    feeLevelLabel: 'custom',
                    feePerUnit: '15',
                    feeLimit: '450000',
                    maxFeePerGas: '20',
                    maxPriorityFeePerGas: '2',
                }),
            );
        });
        expect(result.current.formDraft).toMatchObject({
            selectedFee: 'custom',
            feePerUnit: '15',
            feeLimit: '450000',
        });
        expect(result.current.formDraft?.maxFeePerGas).toBeUndefined();
        expect(result.current.formDraft?.maxPriorityFeePerGas).toBeUndefined();
        expect(getSelectedEvmFeeFromFormDraft(result.current.formDraft)).toEqual({
            type: 'legacy',
            gasLimit: '0x6ddd0',
            gasPrice: '0x37e11d600',
        });
    });

    it.each([
        { amount: '2', flowType: 'withdraw' as const },
        { amount: '1', flowType: 'redeem' as const },
    ])('invalidates the Custom builder while preparing $amount/$flowType', async next => {
        const { result, rerender } = await renderFees();
        await settle();
        const originalBuilder = result.current.getCustomFeeLevel;
        const level = { label: 'custom' as const, blocks: -1, feePerUnit: '3' };
        expect(originalBuilder?.(level)?.type).toBe('final');
        const pending = createDeferred<{ type: string; unsignedTransaction: string }>();
        mockCompose.mockReturnValueOnce(pending.promise);
        await rerender({ ...initialProps, ...next });
        expect(result.current.getCustomFeeLevel).not.toBe(originalBuilder);
        expect(result.current.getCustomFeeLevel?.(level)).toBeUndefined();
        await settle();
        expect(result.current.getCustomFeeLevel?.(level)).toBeUndefined();
        await act(() =>
            pending.resolve({ type: 'success', unsignedTransaction: UNSIGNED_TRANSACTION }),
        );
        expect(result.current.getCustomFeeLevel?.(level)?.type).toBe('final');
    });

    it('does not publish a completed withdrawal after unmounting into another fee flow', async () => {
        const pending = createDeferred<{ type: string; unsignedTransaction: string }>();
        mockCompose.mockReturnValueOnce(pending.promise);
        const { result, store, unmount } = await renderFees();
        await settle();
        expect(mockCompose).toHaveBeenCalledTimes(1);
        const key = result.current.formDraftKey;
        await unmount();
        store.dispatch(transactionManagementActions.storeFeeLevels({ feeLevels: {} }));
        const nextFlowState = store.getState().wallet;
        await act(() =>
            pending.resolve({ type: 'success', unsignedTransaction: UNSIGNED_TRANSACTION }),
        );
        expect(store.getState().wallet.send.feeLevels).toEqual({});
        expect(store.getState().wallet.formDrafts).toEqual(nextFlowState.formDrafts);
        expect(store.getState().wallet.formDrafts[key]).toBeUndefined();
    });

    it('previews the withdrawal transaction without requiring its received tokens in the wallet', async () => {
        const { result } = await renderFees();
        await settle();
        expect(FLOW.account.tokens).toEqual([]);
        expect(
            result.current.getCustomFeeLevel?.({
                label: 'custom',
                blocks: -1,
                feePerUnit: '3',
                feeLimit: '450000',
                maxFeePerGas: '3',
                maxPriorityFeePerGas: '1',
            }),
        ).toMatchObject({
            type: 'final',
            fee: '1350000000000000',
            feeLimit: '450000',
            estimatedFeeLimit: '200000',
        });
    });
});
