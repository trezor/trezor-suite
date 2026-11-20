import { useLayoutEffect } from 'react';

import { combineReducers } from '@reduxjs/toolkit';

import { asNetworkSymbol } from '@suite-common/wallet-config';
import { formDraftActions, formDraftReducer } from '@suite-common/wallet-core';
import {
    type Account,
    type FeesState,
    type FormState,
    type PrecomposedLevels,
} from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { getFormDraftKey } from '@suite-common/wallet-utils';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import { Button, Text } from '@suite-native/atoms';
import { Form, useFormContext } from '@suite-native/forms';
import {
    act,
    createLightStore,
    createStaticReducer,
    fireEvent,
    renderHookWithStoreProvider,
    renderWithStoreProvider,
} from '@suite-native/test-utils-store';
import {
    type FeesFormValues,
    prepareSendFormReducer,
    transactionManagementActions,
    useCustomFee,
    useFeeSelection,
    useFeesForm,
} from '@suite-native/transaction-management';
import { mockActionType, mockReducer } from '@trezor/redux-utils/mocks';
import { createDeferred } from '@trezor/utils';

import { updateEarnSelectedFeeLevelThunk, useComposeEarnFees } from './useComposeEarnFees';
import { useEarnSelectedPrecomposedTransaction } from './useEarnSelectedPrecomposedTransaction';
import { buildEarnComposeFormState } from '../../utils/earn/utils';

type ComposeResult = {
    type: string;
    meta: { requestStatus: 'fulfilled' | 'rejected'; requestId: string };
    payload?: PrecomposedLevels;
};
const mockCompose = jest.fn<Promise<ComposeResult>, []>();
const mockSolanaCompose = jest.fn<Promise<ComposeResult>, []>();
const FEE_LEVELS = {
    normal: {
        type: 'final',
        fee: '21000000',
        feeLimit: '21000',
        estimatedFeeLimit: '21000',
        feePerByte: '10',
        totalSpent: '21000000',
        bytes: 0,
        inputs: [],
        outputs: [],
        outputsPermutation: [],
    },
} satisfies PrecomposedLevels;
const fulfilled = (payload: PrecomposedLevels = FEE_LEVELS): ComposeResult => ({
    type: 'test/compose/fulfilled',
    meta: { requestStatus: 'fulfilled', requestId: 'test-compose' },
    payload,
});
const rejected = (): ComposeResult => ({
    type: 'test/compose/rejected',
    meta: { requestStatus: 'rejected', requestId: 'test-compose' },
});
const settleDebounce = () => act(() => jest.advanceTimersByTimeAsync(300));

let mockIsFocused = true;

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useIsFocused: () => mockIsFocused,
}));
jest.mock('@suite-common/wallet-core', () => ({
    ...jest.requireActual('@suite-common/wallet-core'),
    composeSendFormTransactionFeeLevelsThunk: Object.assign(
        () => () => mockCompose(),
        jest.requireActual('@suite-common/wallet-core').composeSendFormTransactionFeeLevelsThunk,
    ),
    composeSolanaStakingTransactionFeeLevelsThunk: Object.assign(
        () => () => mockSolanaCompose(),
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

const createTestStore = (account = ACCOUNT, additionalAccounts: Account[] = []) =>
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
                accounts: createStaticReducer([account, ...additionalAccounts]),
                fees: createStaticReducer({
                    ...FEES_STATE,
                    [account.symbol]: FEES_STATE.eth,
                    sol: FEES_STATE.eth,
                }),
                formDrafts: formDraftReducer,
                send: prepareSendFormReducer({
                    actionTypes: { storageLoad: mockActionType('storageLoad') },
                    reducers: { storageLoadFormDrafts: mockReducer() },
                }),
            }),
        },
    });

const renderFees = async () => {
    const analytics = mockNativeAnalytics();
    const store = createTestStore();
    const rendered = await renderHookWithStoreProvider(useComposeEarnFees, {
        services: { store, analytics },
        initialProps: { accountKey: ACCOUNT.key, formState: FORM_STATE, formDraftPrefix: 'stake' },
    });

    return { ...rendered, analytics, store };
};

type FeeFlowProps = Parameters<typeof useComposeEarnFees>[0] & { isCustomOpen?: boolean };

type CustomFeeProps = Pick<FeeFlowProps, 'accountKey' | 'formState'> & { formDraftKey: string };

const CustomFeeCalculation = ({ accountKey, formState, formDraftKey }: CustomFeeProps) => {
    const { feeLevels, isSubmittable } = useCustomFee({ accountKey, formState });
    const { getValues } = useFormContext<FeesFormValues>();
    const { handleCustomFeeSet } = useFeeSelection({
        accountKey,
        formDraftKey,
        updateThunk: updateEarnSelectedFeeLevelThunk,
    });

    return (
        <Button
            testID="confirm-custom-fee"
            isDisabled={!isSubmittable}
            onPress={() => handleCustomFeeSet({ ...getValues(), customFeeLevels: feeLevels })}
        >
            Confirm custom fee
        </Button>
    );
};

const CustomFeeForm = (props: CustomFeeProps) => {
    const form = useFeesForm({
        accountKey: props.accountKey,
        defaultFeeLevel: 'custom',
        defaultFeePerUnit: '10',
    });

    return (
        <Form form={form}>
            <CustomFeeCalculation {...props} />
        </Form>
    );
};

const FeeFlow = ({ isCustomOpen, ...props }: FeeFlowProps) => {
    const fees = useComposeEarnFees(props);

    return (
        <>
            <Text testID="fee-ready">{String(fees.isFeeReady)}</Text>
            {isCustomOpen && (
                <CustomFeeForm
                    accountKey={props.accountKey}
                    formState={fees.formDraft}
                    formDraftKey={fees.formDraftKey}
                />
            )}
        </>
    );
};

const ReviewFee = ({
    accountKey,
    formDraftPrefix,
}: Pick<FeeFlowProps, 'accountKey' | 'formDraftPrefix'>) => {
    const transaction = useEarnSelectedPrecomposedTransaction(formDraftPrefix, accountKey);

    return <Text testID="review-fee">{transaction?.fee ?? 'not-ready'}</Text>;
};

describe('useComposeEarnFees recovery', () => {
    beforeEach(() => {
        jest.useFakeTimers();
        mockIsFocused = true;
        mockCompose.mockResolvedValue(fulfilled());
        mockSolanaCompose.mockResolvedValue(fulfilled());
    });
    afterEach(() => {
        jest.resetAllMocks();
        jest.useRealTimers();
    });

    it('does not carry a staking failure into a pending unstake estimate', async () => {
        const pending = createDeferred<ComposeResult>();
        mockCompose.mockResolvedValueOnce(rejected()).mockReturnValueOnce(pending.promise);
        const { rerender, analytics } = await renderFees();
        await settleDebounce();
        expect(analytics.report).toHaveBeenCalledTimes(1);

        await rerender({
            accountKey: ACCOUNT.key,
            formState: FORM_STATE,
            formDraftPrefix: 'unstake',
        });
        await settleDebounce();
        expect(analytics.report).toHaveBeenCalledTimes(1);

        await act(() => pending.resolve(fulfilled()));
        expect(analytics.report).toHaveBeenCalledTimes(1);
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
            const { result, analytics } = await renderFees();
            expect(result.current.isFeeReady).toBe(false);
            await settleDebounce();
            expect(result.current.hasFeeEstimationError).toBe(true);
            expect(result.current.isFeeReady).toBe(false);
            await act(() => result.current.retryFeeEstimation());
            expect(analytics.report).toHaveBeenCalledTimes(2);
            expect(result.current.isFeeReady).toBe(false);
            await settleDebounce();
            expect(result.current.hasFeeEstimationError).toBe(false);
            expect(result.current.isFeeReady).toBe(true);
            expect(result.current.formDraft?.outputs[0]?.amount).toBe('1');
            expect(jest.mocked(analytics.report).mock.calls.map(([event]) => event)).toEqual(
                [
                    'fee-estimation-error-banner',
                    'fee-estimation-retry',
                    'fee-estimation-recovered',
                ].map(element => ({
                    type: 'yield/interaction',
                    payload: { element, value: 'stake', networkSymbol: 'eth' },
                })),
            );
        },
    );

    it('does not recover from foreign fee levels after refocusing', async () => {
        mockCompose.mockResolvedValueOnce(
            fulfilled({ normal: { type: 'error', error: 'AMOUNT_NOT_ENOUGH_CURRENCY_FEE' } }),
        );
        const { rerender, analytics, store } = await renderFees();
        await settleDebounce();
        const props = {
            accountKey: ACCOUNT.key,
            formState: FORM_STATE,
            formDraftPrefix: 'stake' as const,
        };
        mockIsFocused = false;
        await rerender(props);
        await act(() =>
            store.dispatch(transactionManagementActions.storeFeeLevels({ feeLevels: FEE_LEVELS })),
        );
        const pending = createDeferred<ComposeResult>();
        mockCompose.mockReturnValueOnce(pending.promise);
        mockIsFocused = true;
        await rerender(props);
        await settleDebounce();
        expect(analytics.report).toHaveBeenCalledTimes(1);
        await act(() => pending.resolve(fulfilled()));
        expect(analytics.report).toHaveBeenCalledTimes(2);
        expect(analytics.report).toHaveBeenLastCalledWith({
            type: 'yield/interaction',
            payload: { element: 'fee-estimation-recovered', value: 'stake', networkSymbol: 'eth' },
        });
    });

    it('reports an unaffordable estimate once without reporting recovery', async () => {
        mockCompose.mockResolvedValueOnce(
            fulfilled({ normal: { type: 'error', error: 'AMOUNT_NOT_ENOUGH_CURRENCY_FEE' } }),
        );
        const { result, analytics } = await renderFees();

        await settleDebounce();
        await act(() => jest.advanceTimersByTimeAsync(3000));

        expect(result.current.hasFeeEstimationError).toBe(false);
        expect(result.current.isFeeReady).toBe(false);
        expect(jest.mocked(analytics.report).mock.calls.map(([event]) => event)).toEqual([
            {
                type: 'yield/interaction',
                payload: {
                    element: 'fee-unavailable-banner',
                    value: 'stake',
                    networkSymbol: 'eth',
                },
            },
        ]);
    });

    it.each([
        ['unstake', 'TR_GENERIC_ERROR_TITLE'],
        ['claim', 'TR_STAKE_TX_PREPARATION_FAILED'],
    ] as const)('offers retry for Solana %s after %s and recovers', async (stakeType, error) => {
        const account = mockWalletAccount({ symbol: asNetworkSymbol('sol') });
        const analytics = mockNativeAnalytics();
        mockSolanaCompose.mockResolvedValueOnce(fulfilled({ normal: { type: 'error', error } }));
        const { result } = await renderHookWithStoreProvider(useComposeEarnFees, {
            services: { store: createTestStore(account), analytics },
            initialProps: {
                accountKey: account.key,
                formState: buildEarnComposeFormState(account.descriptor, '1.1', ''),
                formDraftPrefix: stakeType,
            },
        });
        await settleDebounce();
        expect(result.current.hasFeeEstimationError).toBe(true);
        expect(result.current.isFeeReady).toBe(false);
        await act(() => result.current.retryFeeEstimation());
        await settleDebounce();
        expect(result.current.hasFeeEstimationError).toBe(false);
        expect(result.current.isFeeReady).toBe(true);
        expect(result.current.formDraft?.outputs[0]?.amount).toBe('1.1');
        expect(mockSolanaCompose).toHaveBeenCalledTimes(2);
        expect(mockCompose).not.toHaveBeenCalled();
        expect(jest.mocked(analytics.report).mock.calls.map(([event]) => event)).toEqual(
            ['fee-estimation-error-banner', 'fee-estimation-retry', 'fee-estimation-recovered'].map(
                element => ({
                    type: 'yield/interaction',
                    payload: { element, value: stakeType, networkSymbol: 'sol' },
                }),
            ),
        );
    });

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

    it('starts from the default fee instead of a Custom fee left by an earlier flow', async () => {
        const store = createTestStore();
        store.dispatch(
            formDraftActions.storeDraft({
                key: getFormDraftKey('stake', ACCOUNT.key),
                formDraft: { ...FORM_STATE, selectedFee: 'custom', feePerUnit: '1' },
            }),
        );
        const { result } = await renderHookWithStoreProvider(useComposeEarnFees, {
            services: { store, analytics: mockNativeAnalytics() },
            initialProps: {
                accountKey: ACCOUNT.key,
                formState: FORM_STATE,
                formDraftPrefix: 'stake',
            },
        });
        await settleDebounce();
        expect(result.current.formDraft?.selectedFee).toBe(FORM_STATE.selectedFee);
        expect(result.current.formDraft?.feePerUnit).toBe(FEE_LEVELS.normal.feePerByte);
        expect(result.current.isFeeReady).toBe(true);
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

    it.each(['account', 'operation', 'amount'] as const)(
        'blocks Review for a changed %s before the next composition effect runs',
        async changedInput => {
            const solAccount = mockWalletAccount({ symbol: asNetworkSymbol('sol') });
            const store = createTestStore(ACCOUNT, [solAccount]);
            const onCommit = jest.fn();
            const props: FeeFlowProps = {
                accountKey: ACCOUNT.key,
                formState: FORM_STATE,
                formDraftPrefix: 'stake',
            };
            const { result, rerender } = await renderHookWithStoreProvider(
                (currentProps: FeeFlowProps) => {
                    const fees = useComposeEarnFees(currentProps);
                    useLayoutEffect(() => {
                        onCommit(fees.isFeeReady);
                    }, [
                        currentProps.accountKey,
                        currentProps.formDraftPrefix,
                        currentProps.formState,
                        fees.isFeeReady,
                    ]);

                    return fees;
                },
                { initialProps: props, services: { store, analytics: mockNativeAnalytics() } },
            );
            await settleDebounce();
            expect(result.current.isFeeReady).toBe(true);
            onCommit.mockClear();
            const pending = createDeferred<ComposeResult>();
            mockCompose.mockReturnValueOnce(pending.promise);
            mockSolanaCompose.mockReturnValueOnce(pending.promise);
            await rerender({
                accountKey: changedInput === 'account' ? solAccount.key : ACCOUNT.key,
                formDraftPrefix: changedInput === 'operation' ? 'claim' : 'stake',
                formState:
                    changedInput === 'amount'
                        ? { ...FORM_STATE, outputs: [{ ...FORM_STATE.outputs[0]!, amount: '2' }] }
                        : FORM_STATE,
            });
            expect(onCommit).toHaveBeenCalledWith(false);
            expect(onCommit).not.toHaveBeenCalledWith(true);
            await settleDebounce();
            expect(result.current.isFeeReady).toBe(false);
            await act(() => pending.resolve(fulfilled()));
            expect(result.current.isFeeReady).toBe(true);
        },
    );

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

    it.each(['success', 'rejection', 'throw'] as const)(
        'does not replace a newly confirmed Custom fee with an older %s',
        async outcome => {
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

            const confirmedDraft: FormState = {
                ...FORM_STATE,
                selectedFee: 'custom',
                feePerUnit: '30',
                feeLimit: '45000',
                maxFeePerGas: '30',
                maxPriorityFeePerGas: '3',
            };
            const confirmedLevels: PrecomposedLevels = {
                ...FEE_LEVELS,
                custom: {
                    ...FEE_LEVELS.normal,
                    type: 'final',
                    fee: '1350000000000000',
                    feeLimit: '45000',
                    feePerByte: '30',
                    maxFeePerGas: '30',
                    maxPriorityFeePerGas: '3',
                },
            };
            mockCompose.mockResolvedValueOnce(fulfilled(confirmedLevels));
            await act(async () => {
                store.dispatch(
                    transactionManagementActions.storeFeeLevels({
                        feeLevels: confirmedLevels,
                    }),
                );
                store.dispatch(
                    formDraftActions.storeDraft({
                        key: result.current.formDraftKey,
                        formDraft: confirmedDraft,
                    }),
                );
                if (outcome === 'throw') pending.reject(new Error('Backend unavailable'));
                else pending.resolve(outcome === 'rejection' ? rejected() : fulfilled());
                await pending.promise.catch(() => undefined);
            });

            expect(result.current.formDraft).toMatchObject(confirmedDraft);
            expect(store.getState().wallet.send.feeLevels).toEqual({});
            expect(result.current.isFeeReady).toBe(false);
            expect(result.current.hasFeeEstimationError).toBe(false);
            await settleDebounce();
            expect(result.current.formDraft).toMatchObject(confirmedDraft);
            expect(result.current.isFeeReady).toBe(true);
            expect(store.getState().wallet.send.feeLevels.custom).toEqual(confirmedLevels.custom);
        },
    );

    it('keeps the Custom preview local and uses the confirmed fee in staking Review', async () => {
        const store = createTestStore();
        const props: FeeFlowProps = {
            accountKey: ACCOUNT.key,
            formState: FORM_STATE,
            formDraftPrefix: 'stake',
        };
        const { getByTestId, rerender } = await renderWithStoreProvider(<FeeFlow {...props} />, {
            services: { store, analytics: mockNativeAnalytics() },
        });
        await settleDebounce();
        const customLevels: PrecomposedLevels = {
            ...FEE_LEVELS,
            custom: { ...FEE_LEVELS.normal, fee: '123456' },
        };
        mockCompose.mockResolvedValueOnce(fulfilled(customLevels));
        await rerender(<FeeFlow {...props} isCustomOpen />);
        await settleDebounce();

        expect(store.getState().wallet.send.feeLevels).toEqual(FEE_LEVELS);
        expect(getByTestId('confirm-custom-fee')).toBeEnabled();
        mockCompose.mockResolvedValueOnce(fulfilled(customLevels));
        await act(() => fireEvent.press(getByTestId('confirm-custom-fee')));
        await rerender(<FeeFlow {...props} />);
        await settleDebounce();
        expect(getByTestId('fee-ready')).toHaveTextContent('true');
        expect(store.getState().wallet.send.feeLevels.normal).toEqual(FEE_LEVELS.normal);
        expect(store.getState().wallet.send.feeLevels.custom).toEqual(customLevels.custom);

        await rerender(<ReviewFee {...props} />);
        expect(getByTestId('review-fee')).toHaveTextContent('123456');
    });

    it.each(['account', 'operation', 'amount'] as const)(
        'ignores a late Custom estimate after the %s changes through the real hook and thunk',
        async changedInput => {
            const solAccount = mockWalletAccount({ symbol: asNetworkSymbol('sol') });
            const store = createTestStore(ACCOUNT, [solAccount]);
            const props: FeeFlowProps = {
                accountKey: ACCOUNT.key,
                formState: FORM_STATE,
                formDraftPrefix: 'stake',
            };
            const { getByTestId, rerender } = await renderWithStoreProvider(
                <FeeFlow {...props} />,
                {
                    services: { store, analytics: mockNativeAnalytics() },
                },
            );
            await settleDebounce();
            const pending = createDeferred<ComposeResult>();
            mockCompose.mockReturnValueOnce(pending.promise);
            await rerender(<FeeFlow {...props} isCustomOpen />);
            await settleDebounce();
            expect(mockCompose).toHaveBeenCalledTimes(2);

            const currentLevels: PrecomposedLevels = {
                normal: { ...FEE_LEVELS.normal, fee: '5000' },
            };
            mockCompose.mockResolvedValueOnce(fulfilled(currentLevels));
            mockSolanaCompose.mockResolvedValueOnce(fulfilled(currentLevels));
            const currentProps: FeeFlowProps = {
                accountKey: changedInput === 'account' ? solAccount.key : ACCOUNT.key,
                formState:
                    changedInput === 'amount'
                        ? { ...FORM_STATE, outputs: [{ ...FORM_STATE.outputs[0]!, amount: '2' }] }
                        : FORM_STATE,
                formDraftPrefix: changedInput === 'amount' ? 'stake' : 'claim',
                isCustomOpen: changedInput === 'amount',
            };
            await rerender(<FeeFlow {...currentProps} />);
            expect(getByTestId('fee-ready')).toHaveTextContent('false');
            await settleDebounce();
            expect(getByTestId('fee-ready')).toHaveTextContent('true');

            await act(async () => {
                pending.resolve(fulfilled({ ...FEE_LEVELS, custom: FEE_LEVELS.normal }));
                await pending.promise;
            });
            expect(store.getState().wallet.send.feeLevels).toEqual(currentLevels);
            expect(getByTestId('fee-ready')).toHaveTextContent('true');

            await rerender(<ReviewFee {...currentProps} />);
            expect(getByTestId('review-fee')).toHaveTextContent('5000');
        },
    );

    it('keeps the selected transaction in Review when an obsolete Custom preview finishes late', async () => {
        const store = createTestStore();
        const props: FeeFlowProps = {
            accountKey: ACCOUNT.key,
            formState: FORM_STATE,
            formDraftPrefix: 'stake',
        };
        const { getByTestId, rerender } = await renderWithStoreProvider(<FeeFlow {...props} />, {
            services: { store, analytics: mockNativeAnalytics() },
        });
        await settleDebounce();
        const pending = createDeferred<ComposeResult>();
        mockCompose.mockReturnValueOnce(pending.promise);
        await rerender(<FeeFlow {...props} isCustomOpen />);
        await settleDebounce();
        expect(mockCompose).toHaveBeenCalledTimes(2);

        await rerender(<ReviewFee {...props} />);
        expect(getByTestId('review-fee')).toHaveTextContent(FEE_LEVELS.normal.fee);
        await act(async () => {
            pending.resolve(fulfilled({ normal: { ...FEE_LEVELS.normal, fee: '999999' } }));
            await pending.promise;
        });
        expect(store.getState().wallet.send.feeLevels).toEqual(FEE_LEVELS);
        expect(getByTestId('review-fee')).toHaveTextContent(FEE_LEVELS.normal.fee);
    });
});
