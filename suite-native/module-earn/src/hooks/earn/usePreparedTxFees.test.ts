import { combineReducers } from '@reduxjs/toolkit';

import { mockActionType, mockReducer } from '@suite-common/redux-utils/mocks';
import { formDraftReducer } from '@suite-common/wallet-core';
import {
    type FeesState,
    type FormState,
    type GeneralPrecomposedLevels,
    type PrecomposedTransactionFinal,
} from '@suite-common/wallet-types';
import {
    act,
    createLightStore,
    createStaticReducer,
    renderHookWithStoreProvider,
} from '@suite-native/test-utils-store';
import { prepareSendFormReducer } from '@suite-native/transaction-management';
import { createDeferred } from '@trezor/utils';

import { type ComposeTxResult, type ComposedTxBase, usePreparedTxFees } from './usePreparedTxFees';
import {
    buildYieldDepositFeeDraftState,
    buildYieldDepositFeePreview,
} from '../../utils/yield/yieldDepositFeeUtils';

jest.mock('../../utils/yield/yieldDepositFeeUtils', () => ({
    buildYieldDepositFeeDraftState: jest.fn(),
    buildYieldDepositFeePreview: jest.fn(),
}));

const buildFeeDraftStateMock = jest.mocked(buildYieldDepositFeeDraftState);
const buildFeePreviewMock = jest.mocked(buildYieldDepositFeePreview);

const FORM_DRAFT_KEY = 'earn/test-flow/test-account';
const BASE_UNSIGNED_TX = '0xbase';

const BASE_FEE_PREVIEW = {
    type: 'final',
    fee: '21000000',
    feeLimit: '21000',
} as unknown as PrecomposedTransactionFinal;

const FEE_LEVELS = {
    normal: { type: 'final', fee: '21000000', feeLimit: '21000' },
} as unknown as GeneralPrecomposedLevels;

const FORM_DRAFT = { selectedFee: 'normal', feePerUnit: '10' } as unknown as FormState;

type FeeDraftState = NonNullable<ReturnType<typeof buildYieldDepositFeeDraftState>>;

const FEE_DRAFT_STATE = {
    feeLevels: FEE_LEVELS,
    formDraft: FORM_DRAFT,
    selectedFeeUnsignedTransaction: BASE_UNSIGNED_TX,
} as unknown as FeeDraftState;

const FEES_STATE = {
    eth: {
        status: 'loaded',
        data: {
            blockHeight: 100,
            blockTime: 10,
            minFee: 1,
            maxFee: 100,
            levels: [{ label: 'normal', feePerUnit: '10', blocks: 1 }],
        },
    },
} as unknown as FeesState;

const composeReady = (unsignedTransaction = BASE_UNSIGNED_TX) => ({
    type: 'ready' as const,
    transaction: {
        symbol: 'eth',
        token: { contractAddress: null, decimals: 18, symbol: 'ETH' },
        unsignedTransaction,
    } satisfies ComposedTxBase,
});

type HookProps = {
    amount: string | undefined;
    composeTransaction: (amount: string) => Promise<ComposeTxResult<ComposedTxBase>>;
    formDraftKey: string;
    hasInvalidContext: boolean;
    isEnabled: boolean;
    symbol: 'eth' | undefined;
};

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

const createProps = (overrides: Partial<HookProps> = {}): HookProps => ({
    amount: '1',
    composeTransaction: jest.fn(),
    formDraftKey: FORM_DRAFT_KEY,
    hasInvalidContext: false,
    isEnabled: true,
    symbol: 'eth',
    ...overrides,
});

const renderPreparedTxFees = async (initialProps: HookProps) => {
    const store = createTestStore();

    return {
        store,
        ...(await renderHookWithStoreProvider((props: HookProps) => usePreparedTxFees(props), {
            store,
            initialProps,
        })),
    };
};

/** Fires the compose debounce (300 ms) and lets the pending promises settle. */
const settleDebounce = () => act(() => jest.advanceTimersByTimeAsync(300));

/** Resolves a deferred compose result inside act so the hook can process it. */
const resolveCompose = (
    deferred: { resolve: (composeResult: ComposeTxResult<ComposedTxBase>) => void },
    composeResult: ComposeTxResult<ComposedTxBase>,
) =>
    act(async () => {
        deferred.resolve(composeResult);
        await Promise.resolve();
    });

describe('usePreparedTxFees', () => {
    beforeEach(() => {
        jest.useFakeTimers();
        buildFeePreviewMock.mockReturnValue(BASE_FEE_PREVIEW);
        buildFeeDraftStateMock.mockReturnValue(FEE_DRAFT_STATE);
    });

    afterEach(() => {
        jest.clearAllMocks();
        jest.useRealTimers();
    });

    it('prepares the transaction and stores fee levels with the form draft', async () => {
        const composeTransaction = jest.fn().mockResolvedValue(composeReady());
        const { result, store } = await renderPreparedTxFees(createProps({ composeTransaction }));

        expect(result.current.isFeePreparing).toBe(true);

        await settleDebounce();

        expect(composeTransaction).toHaveBeenCalledWith('1');
        expect(result.current.preparedTx).toEqual({
            amount: '1',
            feePreview: BASE_FEE_PREVIEW,
            transaction: composeReady().transaction,
            unsignedTransaction: BASE_UNSIGNED_TX,
        });
        expect(result.current.isFeeReady).toBe(true);
        expect(store.getState().wallet.send.feeLevels).toEqual(FEE_LEVELS);
        expect(store.getState().wallet.formDrafts[FORM_DRAFT_KEY]).toEqual(FORM_DRAFT);
    });

    it('ignores a stale compose result after the amount changes', async () => {
        const staleCompose = createDeferred<ComposeTxResult<ComposedTxBase>>();
        const freshCompose = createDeferred<ComposeTxResult<ComposedTxBase>>();
        const composeTransaction = jest
            .fn()
            .mockReturnValueOnce(staleCompose.promise)
            .mockReturnValueOnce(freshCompose.promise);
        const props = createProps({ composeTransaction });
        const { result, rerender } = await renderPreparedTxFees(props);

        await settleDebounce();
        await rerender({ ...props, amount: '2' });
        await settleDebounce();

        expect(composeTransaction).toHaveBeenNthCalledWith(1, '1');
        expect(composeTransaction).toHaveBeenNthCalledWith(2, '2');

        await resolveCompose(staleCompose, composeReady('0xstale'));

        expect(result.current.preparedTx).toBeNull();

        await resolveCompose(freshCompose, composeReady('0xfresh'));

        expect(result.current.preparedTx?.amount).toBe('2');
        expect(result.current.preparedTx?.transaction.unsignedTransaction).toBe('0xfresh');
    });

    it('clears the stored draft and its own fee levels when the context turns invalid', async () => {
        const composeTransaction = jest.fn().mockResolvedValue(composeReady());
        const props = createProps({ composeTransaction });
        const { rerender, store } = await renderPreparedTxFees(props);

        await settleDebounce();

        expect(store.getState().wallet.send.feeLevels).toEqual(FEE_LEVELS);
        expect(store.getState().wallet.formDrafts[FORM_DRAFT_KEY]).toEqual(FORM_DRAFT);

        await rerender({ ...props, amount: undefined, hasInvalidContext: true });

        expect(store.getState().wallet.send.feeLevels).toEqual({});
        expect(store.getState().wallet.formDrafts[FORM_DRAFT_KEY]).toBeUndefined();
    });

    it('keeps the fee store intact when only isEnabled turns false', async () => {
        const composeTransaction = jest.fn().mockResolvedValue(composeReady());
        const props = createProps({ composeTransaction });
        const { rerender, store } = await renderPreparedTxFees(props);

        await settleDebounce();
        await rerender({ ...props, isEnabled: false });

        expect(store.getState().wallet.send.feeLevels).toEqual(FEE_LEVELS);
        expect(store.getState().wallet.formDrafts[FORM_DRAFT_KEY]).toEqual(FORM_DRAFT);
    });

    it('surfaces an error for every failed compose', async () => {
        const composeTransaction = jest.fn().mockResolvedValue({ type: 'error' });
        const { result } = await renderPreparedTxFees(createProps({ composeTransaction }));

        await settleDebounce();

        expect(result.current.hasFeeEstimationError).toBe(true);
        expect(result.current.preparedTx).toBeNull();
        // A failure must never leave the submit button waiting on a spinner instead.
        expect(result.current.isFeePreparing).toBe(false);
    });

    it('surfaces an error when the base fee preview cannot be built', async () => {
        buildFeePreviewMock.mockReturnValue(null);
        const composeTransaction = jest.fn().mockResolvedValue(composeReady());
        const { result } = await renderPreparedTxFees(createProps({ composeTransaction }));

        await settleDebounce();

        expect(result.current.hasFeeEstimationError).toBe(true);
        expect(result.current.preparedTx).toBeNull();
        expect(result.current.isFeePreparing).toBe(false);
    });

    it('surfaces an error when the compose function throws', async () => {
        const composeTransaction = jest.fn().mockRejectedValue(new Error('compose exploded'));
        const { result } = await renderPreparedTxFees(createProps({ composeTransaction }));

        await settleDebounce();

        expect(result.current.hasFeeEstimationError).toBe(true);
        expect(result.current.preparedTx).toBeNull();
    });

    it('returns no preparedTx when the selected fee level preview cannot be built', async () => {
        buildFeeDraftStateMock.mockReturnValue({
            ...FEE_DRAFT_STATE,
            selectedFeeUnsignedTransaction: '0xselected',
        });
        buildFeePreviewMock.mockImplementation(unsignedTransaction =>
            unsignedTransaction === '0xselected' ? null : BASE_FEE_PREVIEW,
        );
        const composeTransaction = jest.fn().mockResolvedValue(composeReady());
        const { result } = await renderPreparedTxFees(createProps({ composeTransaction }));

        await settleDebounce();

        expect(result.current.preparedTx).toBeNull();
        expect(result.current.isFeeReady).toBe(false);
    });
});
