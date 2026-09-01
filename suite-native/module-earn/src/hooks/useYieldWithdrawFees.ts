import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector, useStore } from 'react-redux';

import { buildStablecoinYieldTransactionReview } from '@suite-common/earn-stablecoin';
import { createThunk, useDispatch } from '@suite-common/redux-utils';
import {
    type FeesRootState,
    type FormDraftRootState,
    type ResolvedYieldFlowData,
    type YieldWithdrawFlowType,
    buildEvmSelectedFee,
    composeYieldWithdrawTransactionThunk,
    formDraftActions,
    getYieldWithdrawInputToken,
    selectConvertedNetworkFeeInfo,
    selectDeepCopyOfFormDraft,
    selectFormDraft,
    updateFeeInfoThunk,
} from '@suite-common/wallet-core';
import {
    type FeeInfo,
    type FeeLevelLabel,
    type FormState,
    type PrecomposedLevels,
    type PrecomposedTransactionFinal,
    isFinalPrecomposedTransaction,
} from '@suite-common/wallet-types';
import {
    type NativeSendRootState,
    type UpdateSelectedFeeLevelThunkParams,
    getFeeAvailability,
    selectFeeLevels,
    transactionManagementActions,
} from '@suite-native/transaction-management';
import { useDebounce } from '@trezor/react-utils';

import { EARN_MODULE_PREFIX } from '../constants';
import { useYieldFeeEstimationError } from './useYieldFeeEstimationError';
import { getYieldWithdrawFormDraftKey } from '../utils/yieldWithdrawUtils';

type UseYieldWithdrawFeesParams = Pick<ResolvedYieldFlowData, 'flowData' | 'flowKey'> & {
    amount: string;
    flowType: YieldWithdrawFlowType;
    isEnabled: boolean;
};

type PreparedYieldWithdrawAction = {
    amount: string;
    flowType: YieldWithdrawFlowType;
    unsignedTransaction: string;
};

type WithdrawFlowData = NonNullable<ResolvedYieldFlowData['flowData']>;

type UseYieldWithdrawFeesResult = {
    fee: string | null;
    formDraft: FormState | undefined;
    formDraftKey: string;
    hasFeeEstimationError: boolean;
    isComposingWithdrawFee: boolean;
    isFeeUnavailable: boolean;
    preparedAction: PreparedYieldWithdrawAction | null;
    retryFeeEstimation: () => void;
    selectedFee: FeeLevelLabel;
    updateFeeLevelThunk: typeof updateYieldWithdrawSelectedFeeLevelThunk;
};

// Only the inputs that should trigger a fresh (network) fee composition. The fee context
// (selected/custom fee, flowData) is read from refs at compose time and fee info is fetched by the
// compose itself, so neither can re-trigger the effect — most importantly the fee draft it writes.
type ComposeWithdrawFeeParams = {
    amount: string;
    flowType: YieldWithdrawFlowType;
    formDraftKey: string;
};

type BuildYieldWithdrawFeeLevelsParams = {
    amount: string;
    feeInfo: FeeInfo;
    gasLimit: string;
    reviewToken: WithdrawFlowData['receiptToken'];
    symbol: WithdrawFlowData['account']['symbol'];
    unsignedTransaction: string;
};

const FEE_LEVEL_LABELS_BY_PRICE: FeeLevelLabel[] = ['economy', 'low', 'normal', 'high'];

const getYieldWithdrawSelectedFeeFields = (
    selectedFeeTransaction: PrecomposedTransactionFinal,
): Pick<FormState, 'feePerUnit' | 'feeLimit' | 'maxFeePerGas' | 'maxPriorityFeePerGas'> => ({
    feePerUnit: selectedFeeTransaction.feePerByte,
    feeLimit: selectedFeeTransaction.feeLimit ?? '',
    maxFeePerGas: selectedFeeTransaction.maxFeePerGas,
    maxPriorityFeePerGas: selectedFeeTransaction.maxPriorityFeePerGas,
});

export type UpdateYieldWithdrawSelectedFeeLevelThunkState = FormDraftRootState &
    NativeSendRootState;

export const updateYieldWithdrawSelectedFeeLevelThunk = createThunk<
    void,
    UpdateSelectedFeeLevelThunkParams,
    { state: UpdateYieldWithdrawSelectedFeeLevelThunkState }
>(
    `${EARN_MODULE_PREFIX}/updateYieldWithdrawSelectedFeeLevelThunk`,
    (
        { feeLevelLabel, feePerUnit, feeLimit, formDraftKey, maxFeePerGas, maxPriorityFeePerGas },
        { dispatch, getState },
    ) => {
        if (!formDraftKey) return;

        const formDraft = selectDeepCopyOfFormDraft(getState(), formDraftKey);

        if (!formDraft) {
            return;
        }

        formDraft.selectedFee = feeLevelLabel;

        if (feeLevelLabel === 'custom') {
            if (feePerUnit) {
                formDraft.feePerUnit = feePerUnit;
            }

            if (feeLimit) {
                formDraft.feeLimit = feeLimit;
            }

            if (maxFeePerGas) {
                formDraft.maxFeePerGas = maxFeePerGas;
            }

            if (maxPriorityFeePerGas) {
                formDraft.maxPriorityFeePerGas = maxPriorityFeePerGas;
            }

            dispatch(formDraftActions.storeDraft({ key: formDraftKey, formDraft }));

            return;
        }

        const selectedFeeTransaction = selectFeeLevels(getState())[feeLevelLabel];

        if (!isFinalPrecomposedTransaction(selectedFeeTransaction)) {
            return;
        }

        dispatch(
            formDraftActions.storeDraft({
                key: formDraftKey,
                formDraft: {
                    ...formDraft,
                    ...getYieldWithdrawSelectedFeeFields(selectedFeeTransaction),
                },
            }),
        );
    },
);

const getYieldWithdrawFeeState = (formDraft: FormState | null | undefined) => {
    const selectedFee: FeeLevelLabel =
        formDraft?.selectedFee === 'custom' && (!formDraft.feeLimit || !formDraft.feePerUnit)
            ? 'normal'
            : (formDraft?.selectedFee ?? 'normal');

    if (selectedFee !== 'custom' || !formDraft?.feeLimit || !formDraft.feePerUnit) {
        return {
            customFee: undefined,
            selectedFee,
        };
    }

    return {
        customFee: {
            feeLimit: formDraft.feeLimit,
            feePerUnit: formDraft.feePerUnit,
            maxFeePerGas: formDraft.maxFeePerGas,
            maxPriorityFeePerGas: formDraft.maxPriorityFeePerGas,
        },
        selectedFee,
    };
};

const buildYieldWithdrawFeeLevels = ({
    amount,
    feeInfo,
    gasLimit,
    reviewToken,
    symbol,
    unsignedTransaction,
}: BuildYieldWithdrawFeeLevelsParams): PrecomposedLevels =>
    Object.fromEntries(
        feeInfo.levels
            .filter(feeLevel => feeLevel.label !== 'custom')
            .map(feeLevel => {
                const { precomposedTransaction } = buildStablecoinYieldTransactionReview({
                    amount,
                    selectedFee: buildEvmSelectedFee({ feeLevel, gasLimit }),
                    symbol,
                    token: reviewToken,
                    unsignedTransaction,
                });

                return [feeLevel.label, precomposedTransaction];
            }),
    );

export const useYieldWithdrawFees = ({
    amount,
    flowType,
    flowData,
    flowKey,
    isEnabled,
}: UseYieldWithdrawFeesParams): UseYieldWithdrawFeesResult => {
    const dispatch = useDispatch();
    const store = useStore<FeesRootState>();
    const debounce = useDebounce();
    const requestIdRef = useRef(0);
    const [preparedAction, setPreparedAction] = useState<PreparedYieldWithdrawAction | null>(null);
    const [isComposingWithdrawFee, setIsComposingWithdrawFee] = useState(false);
    const {
        feeEstimationRetryKey,
        hasFeeEstimationError,
        retryFeeEstimation,
        setHasFeeEstimationError,
    } = useYieldFeeEstimationError();

    const formDraftKey = useMemo(
        () => (flowKey ? getYieldWithdrawFormDraftKey(flowKey) : ''),
        [flowKey],
    );
    const formDraft = useSelector((state: FormDraftRootState) =>
        formDraftKey ? selectFormDraft<FormState>(state, formDraftKey) : undefined,
    );
    const feeLevels = useSelector((state: NativeSendRootState) => selectFeeLevels(state));

    const feeState = useMemo(() => getYieldWithdrawFeeState(formDraft), [formDraft]);
    const { selectedFee } = feeState;

    // Latest fee context kept in refs so the compose effect can read it without re-running when it
    // changes (which would otherwise loop: compose -> stores draft -> draft change -> compose ...).
    const flowDataRef = useRef(flowData);
    flowDataRef.current = flowData;
    const feeStateRef = useRef(feeState);
    feeStateRef.current = feeState;
    const selectedFeeLevel = feeLevels[selectedFee];
    const fee = isFinalPrecomposedTransaction(selectedFeeLevel) ? selectedFeeLevel.fee : null;
    const { isFeeUnavailable } = getFeeAvailability({
        fee,
        feeLevels,
        selectedFee,
        isLoading: isComposingWithdrawFee,
    });

    const composeWithdrawFee = useCallback(
        async (params: ComposeWithdrawFeeParams, requestId: number) => {
            const { amount: withdrawAmount, formDraftKey: withdrawFormDraftKey } = params;
            const withdrawFlowData = flowDataRef.current;
            const currentFlowType = params.flowType;
            const { customFee: withdrawCustomFee, selectedFee: withdrawSelectedFee } =
                feeStateRef.current;

            try {
                if (requestId !== requestIdRef.current) {
                    return;
                }

                if (!withdrawFlowData) {
                    throw new Error('Yield withdraw flow data is not available.');
                }

                // There is no background fee-info sync on mobile (desktop has one) and `fees` is not
                // persisted, so levels are refreshed before composing. The refresh is best-effort —
                // a failed one still composes from the stored levels, only missing fee info fails.
                await dispatch(
                    updateFeeInfoThunk({ networkSymbol: withdrawFlowData.account.symbol }),
                );

                if (requestId !== requestIdRef.current) {
                    return;
                }

                const withdrawFeeInfo = selectConvertedNetworkFeeInfo(
                    store.getState(),
                    withdrawFlowData.account.symbol,
                );

                if (!withdrawFeeInfo) {
                    throw new Error('Fee info is not available.');
                }

                const composeResult = await dispatch(
                    composeYieldWithdrawTransactionThunk({
                        flowData: withdrawFlowData,
                        amount: withdrawAmount,
                        flowType: currentFlowType,
                    }),
                ).unwrap();

                if (requestId !== requestIdRef.current) {
                    return;
                }

                if (composeResult.type === 'error') {
                    setHasFeeEstimationError(true);
                    dispatch(formDraftActions.removeDraft({ key: withdrawFormDraftKey }));
                    setPreparedAction(null);

                    return;
                }

                const { unsignedTransaction } = composeResult;

                const reviewToken = getYieldWithdrawInputToken({
                    flowData: withdrawFlowData,
                    flowType: currentFlowType,
                });
                const { formState: baseFormState } = buildStablecoinYieldTransactionReview({
                    amount: withdrawAmount,
                    selectedFee: null,
                    symbol: withdrawFlowData.account.symbol,
                    token: reviewToken,
                    unsignedTransaction,
                });
                const withdrawFeeLevels = buildYieldWithdrawFeeLevels({
                    amount: withdrawAmount,
                    feeInfo: withdrawFeeInfo,
                    gasLimit: baseFormState.feeLimit,
                    reviewToken,
                    symbol: withdrawFlowData.account.symbol,
                    unsignedTransaction,
                });
                const mergedFormState = {
                    ...baseFormState,
                    selectedFee: withdrawSelectedFee,
                    feePerUnit: withdrawCustomFee?.feePerUnit ?? baseFormState.feePerUnit,
                    feeLimit: withdrawCustomFee?.feeLimit ?? baseFormState.feeLimit,
                    maxFeePerGas: withdrawCustomFee?.maxFeePerGas ?? baseFormState.maxFeePerGas,
                    maxPriorityFeePerGas:
                        withdrawCustomFee?.maxPriorityFeePerGas ??
                        baseFormState.maxPriorityFeePerGas,
                };

                dispatch(
                    transactionManagementActions.storeFeeLevels({ feeLevels: withdrawFeeLevels }),
                );

                const resolvedSelectedFee = isFinalPrecomposedTransaction(
                    withdrawFeeLevels[mergedFormState.selectedFee],
                )
                    ? mergedFormState.selectedFee
                    : FEE_LEVEL_LABELS_BY_PRICE.find(label =>
                          isFinalPrecomposedTransaction(withdrawFeeLevels[label]),
                      );
                const selectedFeeTransaction = resolvedSelectedFee
                    ? withdrawFeeLevels[resolvedSelectedFee]
                    : undefined;

                if (!isFinalPrecomposedTransaction(selectedFeeTransaction)) {
                    setHasFeeEstimationError(true);
                    dispatch(formDraftActions.removeDraft({ key: withdrawFormDraftKey }));
                    setPreparedAction(null);

                    return;
                }

                dispatch(
                    formDraftActions.storeDraft({
                        key: withdrawFormDraftKey,
                        formDraft: {
                            ...mergedFormState,
                            selectedFee: resolvedSelectedFee,
                            ...getYieldWithdrawSelectedFeeFields(selectedFeeTransaction),
                        },
                    }),
                );
                setPreparedAction({
                    amount: withdrawAmount,
                    flowType: currentFlowType,
                    unsignedTransaction,
                });
            } catch {
                if (requestId === requestIdRef.current) {
                    setHasFeeEstimationError(true);
                    dispatch(formDraftActions.removeDraft({ key: withdrawFormDraftKey }));
                    setPreparedAction(null);
                }
            } finally {
                if (requestId === requestIdRef.current) {
                    setIsComposingWithdrawFee(false);
                }
            }
        },
        [dispatch, setHasFeeEstimationError, store],
    );

    useEffect(() => {
        const requestId = requestIdRef.current + 1;
        requestIdRef.current = requestId;

        setHasFeeEstimationError(false);

        if (!isEnabled || !amount || !formDraftKey) {
            setIsComposingWithdrawFee(false);
            setPreparedAction(null);

            if (!amount && formDraftKey) {
                dispatch(formDraftActions.removeDraft({ key: formDraftKey }));
            }

            return;
        }

        setIsComposingWithdrawFee(true);
        debounce(
            () =>
                void composeWithdrawFee(
                    {
                        amount,
                        flowType,
                        formDraftKey,
                    },
                    requestId,
                ),
        );
    }, [
        amount,
        composeWithdrawFee,
        debounce,
        dispatch,
        feeEstimationRetryKey,
        flowType,
        formDraftKey,
        isEnabled,
        setHasFeeEstimationError,
    ]);

    return {
        fee,
        formDraft,
        formDraftKey,
        hasFeeEstimationError,
        isComposingWithdrawFee,
        isFeeUnavailable,
        preparedAction,
        retryFeeEstimation,
        selectedFee,
        updateFeeLevelThunk: updateYieldWithdrawSelectedFeeLevelThunk,
    };
};
