import { combineReducers } from '@reduxjs/toolkit';

import { buildClaimCalldata, buildUnsignedClaimTransaction } from '@suite-common/earn-stablecoin';
import {
    type StablecoinYieldAccountRewards,
    estimateYieldFeeLevel,
    feesActions,
    feesReducer,
    formDraftReducer,
} from '@suite-common/wallet-core';
import { type FeesState, type FormState, type PrecomposedLevels } from '@suite-common/wallet-types';
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

import { useYieldClaimFees } from './useYieldClaimFees';
import { buildYieldClaimFeeLevels, getYieldClaimFee } from '../../utils/yield/yieldClaimFeeUtils';
import { updateEarnSelectedFeeLevelThunk } from '../earn/useComposeEarnFees';

const mockGetCurrentNonce = jest.fn<Promise<{ nonce: string }>, []>();

jest.mock('@suite-common/wallet-core', () => ({
    ...jest.requireActual('@suite-common/wallet-core'),
    estimateYieldFeeLevel: jest.fn(),
    ethereumGetCurrentNonceThunk: jest.fn(() => () => ({
        unwrap: () => mockGetCurrentNonce(),
    })),
}));

jest.mock('@suite-common/earn-stablecoin', () => ({
    ...jest.requireActual('@suite-common/earn-stablecoin'),
    buildClaimCalldata: jest.fn(),
    buildUnsignedClaimTransaction: jest.fn(() => ({ type: 'unsigned-claim-transaction' })),
}));

jest.mock('../../utils/yield/yieldClaimFeeUtils', () => ({
    buildYieldClaimFeeLevels: jest.fn(),
    getYieldClaimFee: jest.fn(),
}));

const actualClaimFeeUtils = jest.requireActual<{
    buildYieldClaimFeeLevels: typeof buildYieldClaimFeeLevels;
    getYieldClaimFee: typeof getYieldClaimFee;
}>('../../utils/yield/yieldClaimFeeUtils');

const estimateYieldFeeLevelMock = jest.mocked(estimateYieldFeeLevel);
const buildClaimCalldataMock = jest.mocked(buildClaimCalldata);
const buildYieldClaimFeeLevelsMock = jest.mocked(buildYieldClaimFeeLevels);
const getYieldClaimFeeMock = jest.mocked(getYieldClaimFee);

const FEE_LEVELS = {
    normal: {
        type: 'final',
        fee: '21000000',
        feeLimit: '21000',
        feePerByte: '10',
        totalSpent: '21000000',
        bytes: 0,
        inputs: [],
        outputs: [],
        outputsPermutation: [],
    },
} satisfies PrecomposedLevels;

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

const ACCOUNT = {
    key: 'account-key',
    symbol: 'eth',
    networkType: 'ethereum',
    descriptor: '0xSenderAddress',
    deviceState: 'device-state',
    availableBalance: '1000000000000000000',
} as unknown as StablecoinYieldAccountRewards['account'];

const createAccountRewards = (amount = '100') =>
    ({
        account: ACCOUNT,
        rewards: [{ amount, proofs: [], token: { address: '0xToken', symbol: 'TKN' } }],
        totalFiatClaimableAmount: '1',
    }) as unknown as StablecoinYieldAccountRewards;

type HookProps = {
    accountRewards: StablecoinYieldAccountRewards | null;
    isEnabled: boolean;
};

const createTestStore = (fees: FeesState = FEES_STATE) =>
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
                fees: feesReducer,
                formDrafts: formDraftReducer,
                send: prepareSendFormReducer({
                    actionTypes: { storageLoad: mockActionType('storageLoad') },
                    reducers: { storageLoadFormDrafts: mockReducer() },
                }),
            }),
        },
        preloadedState: { wallet: { fees } },
    });

const renderYieldClaimFees = async (initialProps: HookProps, fees: FeesState = FEES_STATE) => {
    const store = createTestStore(fees);
    const analytics = mockNativeAnalytics();

    return {
        store,
        analytics,
        ...(await renderHookWithStoreProvider((props: HookProps) => useYieldClaimFees(props), {
            services: { store, analytics },
            initialProps,
        })),
    };
};

/** Fires the fee preparation debounce (300 ms) and lets the pending promises settle. */
const settleDebounce = () => act(() => jest.advanceTimersByTimeAsync(300));

describe('useYieldClaimFees', () => {
    beforeEach(() => {
        jest.useFakeTimers();
        mockGetCurrentNonce.mockResolvedValue({ nonce: '5' });
        estimateYieldFeeLevelMock.mockResolvedValue({
            success: true,
            payload: { feeLimit: '21000' },
        } as unknown as Awaited<ReturnType<typeof estimateYieldFeeLevel>>);
        buildClaimCalldataMock.mockImplementation(
            ({ rewards }) =>
                `0xcalldata-${rewards.map(reward => reward.amount).join('-')}` as ReturnType<
                    typeof buildClaimCalldata
                >,
        );
        buildYieldClaimFeeLevelsMock.mockReturnValue(FEE_LEVELS);
        getYieldClaimFeeMock.mockReturnValue({
            gasLimit: '21000',
            maxFeePerGas: '10',
            maxPriorityFeePerGas: '1',
        } as ReturnType<typeof getYieldClaimFee>);
    });

    afterEach(() => {
        jest.clearAllMocks();
        jest.useRealTimers();
    });

    it('does not report stale shared fee errors while rewards are unavailable', async () => {
        const rewards = createAccountRewards();
        const { store, analytics, rerender } = await renderYieldClaimFees({
            accountRewards: null,
            isEnabled: false,
        });
        await act(() => {
            store.dispatch(
                transactionManagementActions.storeFeeLevels({
                    feeLevels: { normal: { type: 'error', error: 'NOT-ENOUGH-FUNDS' } },
                }),
            );
        });

        await rerender({
            accountRewards: { ...rewards, rewards: [] },
            isEnabled: true,
        });
        await rerender({ accountRewards: rewards, isEnabled: true });
        await settleDebounce();

        expect(analytics.report).not.toHaveBeenCalled();
    });

    it('reports Claim estimation failure, explicit retry and usable recovery without private context', async () => {
        estimateYieldFeeLevelMock.mockResolvedValueOnce({
            success: false,
            error: 'fee-estimation-failed',
        });
        const { result, analytics } = await renderYieldClaimFees({
            accountRewards: createAccountRewards(),
            isEnabled: true,
        });

        await settleDebounce();
        expect(result.current.hasFeeEstimationError).toBe(true);
        await act(() => result.current.retryFeeEstimation());
        await settleDebounce();

        expect(result.current.preparedAction).not.toBeNull();
        expect(jest.mocked(analytics.report).mock.calls.map(([event]) => event)).toEqual(
            ['fee-estimation-error-banner', 'fee-estimation-retry', 'fee-estimation-recovered'].map(
                element => ({
                    type: 'yield/interaction',
                    payload: { element, value: 'merkl-claim', networkSymbol: 'eth' },
                }),
            ),
        );
    });

    it('does not show a previous flow fee before the current claim is prepared', async () => {
        const store = createTestStore();
        store.dispatch(
            transactionManagementActions.storeFeeLevels({
                feeLevels: {
                    normal: { ...FEE_LEVELS.normal!, fee: '999' },
                },
            }),
        );
        const { result } = await renderHookWithStoreProvider(useYieldClaimFees, {
            initialProps: { accountRewards: createAccountRewards(), isEnabled: true },
            services: { store, analytics: mockNativeAnalytics() },
        });
        expect(result.current.feePreview).toBeNull();
        expect(result.current.preparedAction).toBeNull();
        await settleDebounce();
        expect(result.current.feePreview).toEqual(FEE_LEVELS.normal);
    });

    it.each(['balance', 'rewards', 'disabled'] as const)(
        'invalidates the prepared action on the first render after %s changes',
        async change => {
            const store = createTestStore();
            const observations: unknown[] = [];
            const initialProps = { accountRewards: createAccountRewards(), isEnabled: true };
            const { rerender } = await renderHookWithStoreProvider(
                (props: HookProps) => {
                    const fees = useYieldClaimFees(props);
                    observations.push(fees.preparedAction);

                    return fees;
                },
                { services: { store, analytics: mockNativeAnalytics() }, initialProps },
            );
            await settleDebounce();
            expect(observations.at(-1)).not.toBeNull();
            observations.length = 0;

            let { accountRewards } = initialProps;
            if (change === 'balance') {
                accountRewards = {
                    ...accountRewards,
                    account: { ...ACCOUNT, availableBalance: '0' },
                };
            } else if (change === 'rewards') {
                accountRewards = createAccountRewards('200');
            }
            await rerender({ accountRewards, isEnabled: change !== 'disabled' });

            expect(observations.length).toBeGreaterThan(0);
            expect(observations.every(action => action === null)).toBe(true);
        },
    );

    it('ignores a completed estimate after rewards change', async () => {
        const oldEstimate = createDeferred<Awaited<ReturnType<typeof estimateYieldFeeLevel>>>();
        estimateYieldFeeLevelMock.mockReturnValueOnce(oldEstimate.promise);
        const { result, rerender } = await renderYieldClaimFees({
            accountRewards: createAccountRewards(),
            isEnabled: true,
        });
        await settleDebounce();
        await rerender({ accountRewards: createAccountRewards('200'), isEnabled: true });
        await settleDebounce();
        const currentAction = result.current.preparedAction;
        expect(currentAction).not.toBeNull();
        await act(() =>
            oldEstimate.resolve({
                success: true,
                payload: { feeLimit: '99999', feePerUnit: '10' },
            }),
        );

        expect(result.current.preparedAction).toBe(currentAction);
        expect(result.current.formDraft?.estimatedFeeLimit).toBe('21000');
    });

    it('ignores an old rejection after the current claim recovers', async () => {
        const oldEstimate = createDeferred<Awaited<ReturnType<typeof estimateYieldFeeLevel>>>();
        estimateYieldFeeLevelMock.mockReturnValueOnce(oldEstimate.promise);
        const { result, rerender } = await renderYieldClaimFees({
            accountRewards: createAccountRewards(),
            isEnabled: true,
        });
        await settleDebounce();
        await rerender({ accountRewards: createAccountRewards('200'), isEnabled: true });
        await settleDebounce();
        const currentAction = result.current.preparedAction;
        await act(() => oldEstimate.reject(new Error('obsolete request')));

        expect(result.current.hasFeeEstimationError).toBe(false);
        expect(result.current.preparedAction).toBe(currentAction);
    });

    it('removes the draft on unmount and ignores a pending response', async () => {
        const { result, store, rerender, unmount } = await renderYieldClaimFees({
            accountRewards: createAccountRewards(),
            isEnabled: true,
        });
        await settleDebounce();
        expect(result.current.formDraft).toBeDefined();
        const estimate = createDeferred<Awaited<ReturnType<typeof estimateYieldFeeLevel>>>();
        estimateYieldFeeLevelMock.mockReturnValueOnce(estimate.promise);
        await rerender({ accountRewards: createAccountRewards('200'), isEnabled: true });
        await settleDebounce();
        await unmount();
        await act(() =>
            estimate.resolve({ success: true, payload: { feeLimit: '99999', feePerUnit: '10' } }),
        );

        expect(store.getState().wallet.send.feeLevels).toEqual({});
        expect(store.getState().wallet.formDrafts).toEqual({});
    });

    it('waits for an in-flight fee fetch before estimating the claim', async () => {
        const { result, store } = await renderYieldClaimFees(
            { accountRewards: createAccountRewards(), isEnabled: true },
            { eth: { status: 'loading' } } as FeesState,
        );
        await settleDebounce();
        expect(result.current.hasFeeEstimationError).toBe(false);
        expect(result.current.isComposingFeeLevels).toBe(true);
        expect(estimateYieldFeeLevelMock).not.toHaveBeenCalled();

        await act(() => store.dispatch(feesActions.updateMultipleFees(FEES_STATE)));
        await settleDebounce();
        expect(result.current.isComposingFeeLevels).toBe(false);
        expect(result.current.preparedAction).not.toBeNull();
    });

    it('keeps the selected Custom fee for rate refreshes, then resets it for different calldata', async () => {
        const buildLevels = actualClaimFeeUtils.buildYieldClaimFeeLevels;
        buildYieldClaimFeeLevelsMock.mockImplementation(buildLevels);
        getYieldClaimFeeMock.mockImplementation(actualClaimFeeUtils.getYieldClaimFee);
        const { result, store, rerender } = await renderYieldClaimFees({
            accountRewards: createAccountRewards(),
            isEnabled: true,
        });
        await settleDebounce();
        const customDraft = {
            ...result.current.formDraft!,
            selectedFee: 'custom',
            feePerUnit: '20',
            feeLimit: '42000',
        } satisfies FormState;
        const { custom } = buildLevels({
            availableBalance: ACCOUNT.availableBalance,
            feeInfo: { ...FEES_STATE.eth!.data!, levels: [] },
            formDraft: customDraft,
            gasLimit: '21000',
        });
        if (custom?.type !== 'final') throw new Error('Expected an affordable Custom fee');
        await act(async () => {
            store.dispatch(transactionManagementActions.storeCustomFeeLevel({ feeLevel: custom }));
            await updateEarnSelectedFeeLevelThunk({
                accountKey: ACCOUNT.key,
                formDraftKey: result.current.formDraftKey,
                feeLevelLabel: 'custom',
                feePerUnit: '20',
                feeLimit: '42000',
            })(store.dispatch, store.getState, {});
        });
        expect(result.current.preparedAction?.feePreview).toEqual(custom);
        expect(buildUnsignedClaimTransaction).toHaveBeenLastCalledWith(
            expect.objectContaining({ fee: { gasLimit: '42000', gasPrice: '20000000000' } }),
        );

        await act(() =>
            store.dispatch(
                feesActions.updateMultipleFees({
                    eth: {
                        ...FEES_STATE.eth!,
                        data: {
                            ...FEES_STATE.eth!.data!,
                            levels: [{ label: 'normal', feePerUnit: '20', blocks: 1 }],
                        },
                    },
                }),
            ),
        );
        await settleDebounce();
        expect(result.current.selectedFee).toBe('custom');
        expect(result.current.preparedAction?.feePreview).toEqual(custom);

        await rerender({ accountRewards: createAccountRewards('200'), isEnabled: true });
        await settleDebounce();
        expect(result.current.selectedFee).toBe('normal');
        expect(result.current.formDraft?.feeLimit).toBe('');
    });

    it('prepares the claim fee', async () => {
        const { result } = await renderYieldClaimFees({
            accountRewards: createAccountRewards(),
            isEnabled: true,
        });

        expect(result.current.isComposingFeeLevels).toBe(true);

        await settleDebounce();

        expect(estimateYieldFeeLevelMock).toHaveBeenCalledTimes(1);
        expect(result.current.isComposingFeeLevels).toBe(false);
        expect(result.current.preparedAction).not.toBeNull();
    });

    it('retains the estimated gas when every fee level exceeds the available balance', async () => {
        buildYieldClaimFeeLevelsMock.mockReturnValue({
            normal: { type: 'error', error: 'AMOUNT_NOT_ENOUGH_CURRENCY_FEE' },
        });
        const { result } = await renderYieldClaimFees({
            accountRewards: createAccountRewards(),
            isEnabled: true,
        });

        await settleDebounce();

        expect(result.current.formDraft?.estimatedFeeLimit).toBe('21000');
        expect(result.current.isFeeUnavailable).toBe(true);
        expect(result.current.preparedAction).toBeNull();
    });

    it.each([{}, { eth: { status: 'error' } }] as FeesState[])(
        'offers retry after an initial network-fee fetch leaves missing data: %j',
        async fees => {
            buildYieldClaimFeeLevelsMock.mockImplementation(
                actualClaimFeeUtils.buildYieldClaimFeeLevels,
            );
            const { result, store } = await renderYieldClaimFees(
                {
                    accountRewards: createAccountRewards(),
                    isEnabled: true,
                },
                fees,
            );
            await settleDebounce();
            expect(result.current.preparedAction).toBeNull();
            expect(result.current.hasFeeEstimationError).toBe(true);
            await act(() => {
                store.dispatch(feesActions.updateMultipleFees(FEES_STATE));
                result.current.retryFeeEstimation();
            });
            await settleDebounce();
            expect(result.current.hasFeeEstimationError).toBe(false);
            expect(result.current.preparedAction).not.toBeNull();
        },
    );

    it('offers retry for unknown errors returned by the fee calculator', async () => {
        buildYieldClaimFeeLevelsMock.mockReturnValueOnce({
            normal: { type: 'error', error: 'TR_GENERIC_ERROR_TITLE' },
        });
        const { result } = await renderYieldClaimFees({
            accountRewards: createAccountRewards(),
            isEnabled: true,
        });
        await settleDebounce();
        expect(result.current.hasFeeEstimationError).toBe(true);
        expect(result.current.preparedAction).toBeNull();
    });

    it('offers retry when nonce preparation fails and recovers without leaving the form', async () => {
        mockGetCurrentNonce.mockRejectedValueOnce(new Error('Backend unavailable'));
        const { result } = await renderYieldClaimFees({
            accountRewards: createAccountRewards(),
            isEnabled: true,
        });

        await settleDebounce();

        expect(result.current.isComposingFeeLevels).toBe(false);
        expect(result.current.preparedAction).toBeNull();
        expect(result.current.hasFeeEstimationError).toBe(true);

        await act(() => result.current.retryFeeEstimation());
        await settleDebounce();

        expect(result.current.hasFeeEstimationError).toBe(false);
        expect(result.current.preparedAction).not.toBeNull();
    });

    it('offers retry when the fee estimation request rejects', async () => {
        estimateYieldFeeLevelMock.mockRejectedValueOnce(new Error('Backend unavailable'));
        const { result } = await renderYieldClaimFees({
            accountRewards: createAccountRewards(),
            isEnabled: true,
        });

        await settleDebounce();

        expect(result.current.isComposingFeeLevels).toBe(false);
        expect(result.current.preparedAction).toBeNull();
        expect(result.current.hasFeeEstimationError).toBe(true);
    });

    it('does not re-prepare when rewards only get a new identity with unchanged values', async () => {
        const { result, rerender } = await renderYieldClaimFees({
            accountRewards: createAccountRewards(),
            isEnabled: true,
        });

        await settleDebounce();

        const { preparedAction } = result.current;

        // A new deep-equal object, as produced by e.g. an unrelated fiat rates update.
        await rerender({ accountRewards: createAccountRewards(), isEnabled: true });

        expect(result.current.isComposingFeeLevels).toBe(false);
        expect(result.current.preparedAction).toBe(preparedAction);

        await settleDebounce();

        expect(estimateYieldFeeLevelMock).toHaveBeenCalledTimes(1);
        expect(result.current.preparedAction).toBe(preparedAction);
    });

    it('recovers after a balance-only top-up and blocks again if fee funds are spent', async () => {
        buildYieldClaimFeeLevelsMock.mockImplementation(
            actualClaimFeeUtils.buildYieldClaimFeeLevels,
        );
        const rewards = createAccountRewards();
        const withBalance = (availableBalance: string) => ({
            ...rewards,
            account: { ...rewards.account, availableBalance },
        });
        const { result, rerender } = await renderYieldClaimFees({
            accountRewards: withBalance('0'),
            isEnabled: true,
        });
        await settleDebounce();
        expect(result.current.preparedAction).toBeNull();
        expect(result.current.isFeeUnavailable).toBe(true);
        expect(result.current.hasFeeEstimationError).toBe(false);

        await rerender({ accountRewards: withBalance(ACCOUNT.availableBalance), isEnabled: true });
        await settleDebounce();
        expect(result.current.isFeeUnavailable).toBe(false);
        expect(result.current.preparedAction).not.toBeNull();

        await rerender({ accountRewards: withBalance('0'), isEnabled: true });
        await settleDebounce();
        expect(result.current.preparedAction).toBeNull();
        expect(result.current.isFeeUnavailable).toBe(true);
        expect(estimateYieldFeeLevelMock).toHaveBeenCalledTimes(3);
    });

    it('keeps a prepared claim during a status-only background fee refetch', async () => {
        const { result, store } = await renderYieldClaimFees({
            accountRewards: createAccountRewards(),
            isEnabled: true,
        });
        await settleDebounce();
        const { preparedAction } = result.current;
        expect(preparedAction).not.toBeNull();

        await act(() =>
            store.dispatch(
                feesActions.updateMultipleFees({
                    eth: { ...FEES_STATE.eth!, status: 'loading' },
                }),
            ),
        );
        expect(result.current.preparedAction).toBe(preparedAction);
        expect(result.current.isComposingFeeLevels).toBe(false);
        await settleDebounce();

        await act(() => store.dispatch(feesActions.updateMultipleFees(FEES_STATE)));
        await settleDebounce();
        expect(result.current.preparedAction).toBe(preparedAction);
        expect(estimateYieldFeeLevelMock).toHaveBeenCalledTimes(1);
    });

    it('ignores an estimate that resolves after the flow loses focus', async () => {
        const estimate = createDeferred<Awaited<ReturnType<typeof estimateYieldFeeLevel>>>();
        estimateYieldFeeLevelMock.mockReturnValueOnce(estimate.promise);
        const props = { accountRewards: createAccountRewards(), isEnabled: true };
        const { result, store, rerender } = await renderYieldClaimFees(props);
        await settleDebounce();
        await rerender({ ...props, isEnabled: false });
        await act(() =>
            estimate.resolve({ success: true, payload: { feeLimit: '99999', feePerUnit: '10' } }),
        );

        expect(result.current.preparedAction).toBeNull();
        expect(store.getState().wallet.send.feeLevels).toEqual({});
        expect(result.current.hasFeeEstimationError).toBe(false);
    });

    it('does not re-prepare when identical network fee data is reloaded', async () => {
        const { result, store } = await renderYieldClaimFees({
            accountRewards: createAccountRewards(),
            isEnabled: true,
        });
        await settleDebounce();
        const { preparedAction } = result.current;

        await act(() =>
            store.dispatch(
                feesActions.updateMultipleFees({
                    eth: {
                        ...FEES_STATE.eth!,
                        data: {
                            ...FEES_STATE.eth!.data!,
                            levels: FEES_STATE.eth!.data!.levels.map(level => ({ ...level })),
                        },
                    },
                }),
            ),
        );
        await settleDebounce();

        expect(estimateYieldFeeLevelMock).toHaveBeenCalledTimes(1);
        expect(result.current.preparedAction).toBe(preparedAction);
    });

    it('reprices when network rates change within the same block', async () => {
        buildYieldClaimFeeLevelsMock.mockImplementation(
            actualClaimFeeUtils.buildYieldClaimFeeLevels,
        );
        const { result, store } = await renderYieldClaimFees({
            accountRewards: createAccountRewards(),
            isEnabled: true,
        });
        await settleDebounce();
        const initialFee = result.current.preparedAction?.feePreview.fee;
        expect(initialFee).toBeDefined();

        await act(() =>
            store.dispatch(
                feesActions.updateMultipleFees({
                    eth: {
                        ...FEES_STATE.eth!,
                        data: {
                            ...FEES_STATE.eth!.data!,
                            levels: [{ label: 'normal', feePerUnit: '20', blocks: 1 }],
                        },
                    },
                }),
            ),
        );
        await settleDebounce();

        expect(estimateYieldFeeLevelMock).toHaveBeenCalledTimes(2);
        expect(result.current.preparedAction?.feePreview.fee).not.toBe(initialFee);
    });

    it('re-prepares when the claim rewards actually change', async () => {
        const { result, rerender } = await renderYieldClaimFees({
            accountRewards: createAccountRewards(),
            isEnabled: true,
        });

        await settleDebounce();

        await rerender({ accountRewards: createAccountRewards('200'), isEnabled: true });

        expect(result.current.isComposingFeeLevels).toBe(true);

        await settleDebounce();

        expect(estimateYieldFeeLevelMock).toHaveBeenCalledTimes(2);
        expect(result.current.preparedAction).not.toBeNull();
    });
});
