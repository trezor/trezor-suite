import { combineReducers } from '@reduxjs/toolkit';

import { asNetworkSymbol } from '@suite-common/wallet-config';
import { formDraftActions, formDraftReducer } from '@suite-common/wallet-core';
import { type FeesState, type PrecomposedLevels } from '@suite-common/wallet-types';
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

import { useComposeEarnFees } from './useComposeEarnFees';
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

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useIsFocused: () => true,
}));
jest.mock('@suite-common/wallet-core', () => ({
    ...jest.requireActual('@suite-common/wallet-core'),
    composeSendFormTransactionFeeLevelsThunk: Object.assign(
        () => () => mockCompose(),
        jest.requireActual('@suite-common/wallet-core').composeSendFormTransactionFeeLevelsThunk,
    ),
    composeSolanaStakingTransactionFeeLevelsThunk: Object.assign(
        () => () => mockCompose(),
        jest.requireActual('@suite-common/wallet-core')
            .composeSolanaStakingTransactionFeeLevelsThunk,
    ),
}));
const ACCOUNT = mockWalletAccount({ symbol: asNetworkSymbol('eth') });
const FORM_STATE = buildEarnComposeFormState(
    '0x0000000000000000000000000000000000000001',
    '1',
    '0x',
);
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
                accounts: createStaticReducer([ACCOUNT]),
                fees: createStaticReducer(FEES_STATE),
                formDrafts: formDraftReducer,
                send: prepareSendFormReducer({
                    actionTypes: { storageLoad: mockActionType('storageLoad') },
                    reducers: { storageLoadFormDrafts: mockReducer() },
                }),
            }),
        },
    });

const renderFees = () =>
    renderHookWithStoreProvider(useComposeEarnFees, {
        services: { store: createTestStore(), analytics: mockNativeAnalytics() },
        initialProps: { accountKey: ACCOUNT.key, formState: FORM_STATE, formDraftPrefix: 'stake' },
    });

describe('useComposeEarnFees recovery', () => {
    beforeEach(() => {
        jest.useFakeTimers();
        mockCompose.mockResolvedValue(fulfilled());
    });
    afterEach(() => {
        jest.resetAllMocks();
        jest.useRealTimers();
    });

    it('does not restart composition after publishing its own fee levels and draft', async () => {
        const { result } = await renderFees();

        await settleDebounce();
        expect(result.current.isFeeReady).toBe(true);
        expect(mockCompose).toHaveBeenCalledTimes(1);

        await act(() => jest.advanceTimersByTimeAsync(3000));

        expect(mockCompose).toHaveBeenCalledTimes(1);
        expect(result.current.isComposingFeeLevels).toBe(false);
        expect(result.current.isFeeReady).toBe(true);
    });

    it.each(['rejected', 'throws', 'empty', 'estimation-error', 'incorrect-rate'] as const)(
        'offers retry after %s composition and recovers in place',
        async failure => {
            if (failure === 'throws')
                mockCompose.mockRejectedValueOnce(new Error('Backend unavailable'));
            else if (failure === 'estimation-error' || failure === 'incorrect-rate')
                mockCompose.mockResolvedValueOnce(
                    fulfilled({
                        normal: {
                            type: 'error',
                            error:
                                failure === 'incorrect-rate'
                                    ? 'INCORRECT-FEE-RATE'
                                    : 'TR_GENERIC_ERROR_TITLE',
                            errorMessage: { id: 'TR_GENERIC_ERROR_TITLE' },
                        },
                    }),
                );
            else
                mockCompose.mockResolvedValueOnce(failure === 'empty' ? fulfilled({}) : rejected());
            const { result } = await renderFees();
            expect(result.current.isFeeReady).toBe(false);
            await settleDebounce();
            expect(result.current.hasFeeEstimationError).toBe(true);
            expect(result.current.isFeeReady).toBe(false);
            await act(() => result.current.retryFeeEstimation());
            await settleDebounce();
            expect(result.current.hasFeeEstimationError).toBe(false);
            expect(result.current.isFeeReady).toBe(true);
            expect(result.current.formDraft?.outputs[0]?.amount).toBe('1');
        },
    );

    it('does not report previous-flow error levels as a new failure at mount', async () => {
        const store = createTestStore();
        store.dispatch(
            transactionManagementActions.storeFeeLevels({
                feeLevels: {
                    normal: { type: 'error', error: 'AMOUNT_NOT_ENOUGH_CURRENCY_FEE' },
                },
            }),
        );
        const analytics = mockNativeAnalytics();
        const { result } = await renderHookWithStoreProvider(useComposeEarnFees, {
            services: { store, analytics },
            initialProps: {
                accountKey: ACCOUNT.key,
                formState: FORM_STATE,
                formDraftPrefix: 'stake',
            },
        });
        expect(result.current.isFeeReady).toBe(false);
        expect(store.getState().wallet.send.feeLevels).toEqual({});
        await settleDebounce();
        expect(result.current.isFeeReady).toBe(true);
        expect(analytics.report).not.toHaveBeenCalled();
    });

    it('preserves a newer Standard selection when an older composition completes', async () => {
        const pending = createDeferred<ComposeResult>();
        mockCompose.mockReturnValueOnce(pending.promise);
        const store = createTestStore();
        const { result } = await renderHookWithStoreProvider(useComposeEarnFees, {
            services: { store, analytics: mockNativeAnalytics() },
            initialProps: {
                accountKey: ACCOUNT.key,
                formState: FORM_STATE,
                formDraftPrefix: 'stake',
            },
        });
        await settleDebounce();
        await act(() =>
            store.dispatch(
                formDraftActions.storeDraft({
                    key: result.current.formDraftKey,
                    formDraft: { ...FORM_STATE, selectedFee: 'low' },
                }),
            ),
        );
        await act(() => pending.resolve(fulfilled({ ...FEE_LEVELS, low: FEE_LEVELS.normal! })));
        expect(result.current.formDraft?.selectedFee).toBe('low');
        expect(result.current.isFeeReady).toBe(true);
        await settleDebounce();
        expect(mockCompose).toHaveBeenCalledTimes(1);
    });

    it('ignores an obsolete failure after the amount changes', async () => {
        const pending = createDeferred<ComposeResult>();
        mockCompose.mockReturnValueOnce(pending.promise);
        const { result, rerender } = await renderFees();
        await settleDebounce();
        await rerender({
            accountKey: ACCOUNT.key,
            formState: { ...FORM_STATE, outputs: [{ ...FORM_STATE.outputs[0]!, amount: '2' }] },
            formDraftPrefix: 'stake',
        });
        await settleDebounce();
        await act(() => pending.resolve(rejected()));
        expect(result.current.hasFeeEstimationError).toBe(false);
        expect(result.current.isFeeReady).toBe(true);
        expect(result.current.formDraft?.outputs[0]?.amount).toBe('2');
    });
});
