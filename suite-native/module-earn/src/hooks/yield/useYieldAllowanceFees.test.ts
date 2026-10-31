import { type ThunkDispatch, type UnknownAction, combineReducers } from '@reduxjs/toolkit';

import { formDraftActions, formDraftReducer } from '@suite-common/wallet-core';
import { mockResolvedYieldFlowData } from '@suite-common/wallet-core/mocks';
import { type FeesState, type FormState, type PrecomposedLevels } from '@suite-common/wallet-types';
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

import { useYieldAllowanceFees } from './useYieldAllowanceFees';
import { getYieldAllowanceFormDraftKey } from '../../thunks/yield/yieldApprovalThunks';
import { buildEarnComposeFormState } from '../../utils/earn/utils';

type ComposeResult = {
    type: string;
    meta: { requestStatus: 'fulfilled' | 'rejected'; requestId: string };
    payload?: PrecomposedLevels;
};
const mockCompose = jest.fn<Promise<ComposeResult>, []>();
const FEE_LEVELS = {
    normal: { type: 'final', fee: '21000000', feeLimit: '21000', feePerByte: '10' },
} as unknown as PrecomposedLevels;
const fulfilled = (payload = FEE_LEVELS): ComposeResult => ({
    type: 'test/compose/fulfilled',
    meta: { requestStatus: 'fulfilled', requestId: 'test-compose' },
    payload,
});
const rejected = (): ComposeResult => ({
    type: 'test/compose/rejected',
    meta: { requestStatus: 'rejected', requestId: 'test-compose' },
});
const settleDebounce = () => act(() => jest.advanceTimersByTimeAsync(300));

jest.mock('@suite-common/wallet-core', () => ({
    ...jest.requireActual('@suite-common/wallet-core'),
    composeAllowanceTransactionThunk: () => () => mockCompose(),
}));
const FLOW = mockResolvedYieldFlowData();
const TRANSACTION = {
    allowanceAmount: '100',
    modalState: {
        amount: '1',
        contractAddress: '0x0000000000000000000000000000000000000001',
        spender: '0x0000000000000000000000000000000000000002',
        txType: 'approve' as const,
    },
};
const FEES_STATE = {
    eth: {
        status: 'loaded',
        data: {
            blockHeight: 100,
            blockTime: 12,
            minFee: 1,
            maxFee: 100,
            minPriorityFee: 1,
            levels: [{ label: 'normal', feePerUnit: '10', blocks: 1 }],
        },
    },
} as unknown as FeesState;

const createTestStore = () =>
    createLightStore({
        reducer: {
            // Static slices required by the test store provider (formatters config).
            discreetMode: createStaticReducer({ isActive: false }),
            locale: createStaticReducer({ systemLocaleCode: 'en', appLocaleCode: 'system' }),
            wallet: combineReducers({
                settings: createStaticReducer({
                    localCurrency: 'usd',
                    bitcoinAmountUnit: 0,
                    addressDisplayType: 'chunked',
                }),
                fees: createStaticReducer(FEES_STATE),
                formDrafts: formDraftReducer,
                send: prepareSendFormReducer({
                    actionTypes: { storageLoad: mockActionType('storageLoad') },
                    reducers: { storageLoadFormDrafts: mockReducer() },
                }),
            }),
        },
    });

const renderFees = async (draft?: FormState, transaction = TRANSACTION) => {
    const store = createTestStore();
    if (draft)
        store.dispatch(
            formDraftActions.storeDraft({
                key: getYieldAllowanceFormDraftKey(FLOW.flowKey, 'approve'),
                formDraft: draft,
            }),
        );

    const hook = await renderHookWithStoreProvider(useYieldAllowanceFees, {
        services: { store, analytics: mockNativeAnalytics() },
        initialProps: {
            flowData: FLOW.flowData,
            flowKey: FLOW.flowKey,
            draftTransactionType: 'approve',
            isEnabled: true,
            transaction,
        },
    });

    return { ...hook, store };
};

describe('useYieldAllowanceFees recovery', () => {
    beforeEach(() => {
        jest.useFakeTimers();
        mockCompose.mockResolvedValue(fulfilled());
    });
    afterEach(() => {
        jest.resetAllMocks();
        jest.useRealTimers();
    });

    it('does not recompose when storing the prepared allowance draft', async () => {
        const { result } = await renderFees();

        await settleDebounce();
        expect(result.current.isAllowanceFeeReady).toBe(true);
        expect(mockCompose).toHaveBeenCalledTimes(1);

        await act(() => jest.advanceTimersByTimeAsync(3000));

        expect(mockCompose).toHaveBeenCalledTimes(1);
        expect(result.current.isComposingAllowanceFee).toBe(false);
        expect(result.current.isAllowanceFeeReady).toBe(true);
    });

    it.each(['rejected', 'throws', 'empty', 'generic-error'] as const)(
        'offers retry after %s composition and recovers in place',
        async failure => {
            if (failure === 'throws')
                mockCompose.mockRejectedValueOnce(new Error('Backend unavailable'));
            else if (failure === 'generic-error')
                mockCompose.mockResolvedValueOnce(
                    fulfilled({ normal: { type: 'error', error: 'TR_GENERIC_ERROR_TITLE' } }),
                );
            else
                mockCompose.mockResolvedValueOnce(failure === 'empty' ? fulfilled({}) : rejected());
            const { result } = await renderFees();
            expect(result.current.isAllowanceFeeReady).toBe(false);
            await settleDebounce();
            expect(result.current.hasFeeEstimationError).toBe(true);
            expect(result.current.isAllowanceFeeReady).toBe(false);
            await act(() => result.current.retryFeeEstimation());
            await settleDebounce();
            expect(result.current.hasFeeEstimationError).toBe(false);
            expect(result.current.isAllowanceFeeReady).toBe(true);
        },
    );

    it('settles a custom allowance fee instead of composing continuously after saving its draft', async () => {
        const custom = {
            ...FEE_LEVELS.normal,
            feePerByte: '15',
            feeLimit: '30000',
            maxFeePerGas: '30',
            maxPriorityFeePerGas: '3',
        };
        mockCompose.mockResolvedValue(fulfilled({ ...FEE_LEVELS, custom } as PrecomposedLevels));
        const draft: FormState = {
            ...buildEarnComposeFormState(TRANSACTION.modalState.contractAddress, '0', '0x'),
            selectedFee: 'custom',
            feePerUnit: '15',
            feeLimit: '30000',
            maxFeePerGas: '30',
            maxPriorityFeePerGas: '3',
        };
        const { result } = await renderFees(draft);
        await act(() => jest.advanceTimersByTimeAsync(1800));
        expect(mockCompose).toHaveBeenCalledTimes(1);
        expect(result.current.isAllowanceFeeReady).toBe(true);
        expect(result.current.formDraft?.maxFeePerGas).toBe('30');
    });

    it('keeps insufficient native balance distinct from an estimation failure', async () => {
        mockCompose.mockResolvedValue(
            fulfilled({ normal: { type: 'error', error: 'AMOUNT_NOT_ENOUGH_CURRENCY_FEE' } }),
        );
        const { result } = await renderFees();
        await settleDebounce();
        expect(result.current.hasFeeEstimationError).toBe(false);
        expect(result.current.isFeeUnavailable).toBe(true);
        expect(result.current.isAllowanceFeeReady).toBe(false);
    });

    it('lets the user recover from an initial unavailable Normal fee by selecting Low', async () => {
        mockCompose.mockResolvedValue(
            fulfilled({
                normal: { type: 'error', error: 'AMOUNT_NOT_ENOUGH_CURRENCY_FEE' },
                low: FEE_LEVELS.normal!,
            }),
        );
        const { result, store } = await renderFees();
        await settleDebounce();
        expect(result.current.formDraft).toBeDefined();
        expect(result.current.isAllowanceFeeReady).toBe(false);
        await act(() =>
            (
                store.dispatch as ThunkDispatch<
                    ReturnType<typeof store.getState>,
                    Record<never, never>,
                    UnknownAction
                >
            )(
                result.current.updateFeeLevelThunk({
                    accountKey: FLOW.flowData!.account.key,
                    formDraftKey: result.current.formDraftKey,
                    feeLevelLabel: 'low',
                }),
            ),
        );
        await settleDebounce();
        expect(result.current.selectedFee).toBe('low');
        expect(result.current.isAllowanceFeeReady).toBe(true);
    });

    it('shows a retryable error instead of throwing when initial allowance inputs cannot be encoded', async () => {
        const { result } = await renderFees(undefined, {
            ...TRANSACTION,
            modalState: { ...TRANSACTION.modalState, spender: 'invalid' },
        });
        await settleDebounce();
        expect(result.current.hasFeeEstimationError).toBe(true);
        expect(result.current.isAllowanceFeeReady).toBe(false);
        expect(mockCompose).not.toHaveBeenCalled();
    });

    it('ignores a failed request from the previous allowance', async () => {
        const pending = createDeferred<ComposeResult>();
        mockCompose.mockReturnValueOnce(pending.promise);
        const { result, rerender } = await renderFees();
        await settleDebounce();
        await rerender({
            flowData: FLOW.flowData,
            flowKey: FLOW.flowKey,
            draftTransactionType: 'approve',
            isEnabled: true,
            transaction: { ...TRANSACTION, allowanceAmount: '200' },
        });
        await settleDebounce();
        await act(() => pending.resolve(rejected()));
        expect(result.current.hasFeeEstimationError).toBe(false);
        expect(result.current.isAllowanceFeeReady).toBe(true);
    });
});
