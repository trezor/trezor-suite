import { combineReducers } from '@reduxjs/toolkit';

import { formDraftActions, formDraftReducer } from '@suite-common/wallet-core';
import { mockResolvedYieldFlowData } from '@suite-common/wallet-core/mocks';
import { type FeeInfo, isFinalPrecomposedTransaction } from '@suite-common/wallet-types';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import {
    act,
    createLightStore,
    createStaticReducer,
    renderHookWithStoreProvider,
} from '@suite-native/test-utils-store';
import { prepareSendFormReducer } from '@suite-native/transaction-management';
import { mockActionType, mockReducer } from '@trezor/redux-utils/mocks';
import { createDeferred } from '@trezor/utils';

import { useYieldWithdrawFees } from './useYieldWithdrawFees';

const mockCompose = jest.fn();
jest.mock('@suite-common/wallet-core', () => ({
    ...jest.requireActual('@suite-common/wallet-core'),
    updateFeeInfoThunk: () => () => Promise.resolve(),
    composeYieldWithdrawTransactionThunk: () => () => ({ unwrap: () => mockCompose() }),
}));

const FLOW = mockResolvedYieldFlowData();
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
const initialProps = {
    ...FLOW,
    amount: '1',
    flowType: 'withdraw' as const,
    isEnabled: true,
};
const settle = () => act(() => jest.advanceTimersByTimeAsync(300));
const renderFees = async () => {
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
        initialProps,
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
});
