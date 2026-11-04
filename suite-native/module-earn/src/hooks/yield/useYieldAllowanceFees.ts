import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';

import { isFulfilled } from '@reduxjs/toolkit';

import {
    type ComposeAllowanceTransactionThunkParams,
    type FeesRootState,
    type FormDraftRootState,
    type ResolvedYieldFlowData,
    type YieldApproveModalState,
    composeAllowanceTransactionThunk,
    formDraftActions,
    selectConvertedNetworkFeeInfo,
    selectFormDraft,
} from '@suite-common/wallet-core';
import {
    type AllowanceTransactionType,
    type FeeLevelLabel,
    type FormState,
    isFinalPrecomposedTransaction,
} from '@suite-common/wallet-types';
import { buildApprovalTransactionData } from '@suite-common/wallet-utils';
import {
    type NativeSendRootState,
    isPrecomposedTransactionError,
    selectFeeLevels,
    transactionManagementActions,
} from '@suite-native/transaction-management';
import { useServices } from '@trezor/dependency-injection';
import { useDebounce, useFreshRef } from '@trezor/react-utils';
import { injectDispatch } from '@trezor/redux-utils';

import { getYieldAllowanceFormDraftKey } from '../../thunks/yield/yieldApprovalThunks';
import {
    buildYieldAllowanceFormState,
    getYieldAllowanceFeeState,
} from '../../utils/yield/yieldApprovalUtils';
import { updateEarnSelectedFeeLevelThunk } from '../earn/useComposeEarnFees';
import { useEarnFeeEstimationError } from '../earn/useEarnFeeEstimationError';

export type YieldAllowanceFeeTransaction = {
    allowanceAmount: string;
    modalState: YieldApproveModalState;
};

type YieldAllowanceFeesCommonParams = Pick<ResolvedYieldFlowData, 'flowData' | 'flowKey'> & {
    isEnabled: boolean;
};

export type UseYieldAllowanceFeesParams = YieldAllowanceFeesCommonParams & {
    draftTransactionType: AllowanceTransactionType;
    transaction: YieldAllowanceFeeTransaction | null;
};

type ComposeAllowanceFeeParams = Pick<
    ComposeAllowanceTransactionThunkParams,
    'customFee' | 'feeInfo'
> & {
    flowData: NonNullable<ResolvedYieldFlowData['flowData']>;
    formDraftKey: string;
    selectedFee: FeeLevelLabel;
    transaction: YieldAllowanceFeeTransaction;
};

export const useYieldAllowanceFees = ({
    flowData,
    flowKey,
    draftTransactionType,
    isEnabled,
    transaction,
}: UseYieldAllowanceFeesParams) => {
    const { dispatch } = useServices(injectDispatch);
    const debounce = useDebounce();
    const requestIdRef = useRef(0);
    const {
        feeEstimationRetryKey,
        hasFeeEstimationError,
        retryFeeEstimation,
        setHasFeeEstimationError,
    } = useEarnFeeEstimationError();
    const [isComposingFeeLevels, setIsComposingFeeLevels] = useState(true);
    const [composedParams, setComposedParams] = useState<ComposeAllowanceFeeParams | null>(null);
    const formDraftKey = useMemo(
        () => (flowKey ? getYieldAllowanceFormDraftKey(flowKey, draftTransactionType) : ''),
        [draftTransactionType, flowKey],
    );
    const feeInfo = useSelector((state: FeesRootState) =>
        selectConvertedNetworkFeeInfo(state, flowData?.account.symbol),
    );
    const formDraft = useSelector((state: FormDraftRootState) =>
        formDraftKey ? selectFormDraft<FormState>(state, formDraftKey) : undefined,
    );
    const feeLevels = useSelector((state: NativeSendRootState) => selectFeeLevels(state));

    const { customFee: draftCustomFee, selectedFee } = useMemo(
        () => getYieldAllowanceFeeState(formDraft),
        [formDraft],
    );
    const feePerUnit = draftCustomFee?.feePerUnit;
    const feeLimit = draftCustomFee?.feeLimit;
    const maxFeePerGas = draftCustomFee?.maxFeePerGas;
    const maxPriorityFeePerGas = draftCustomFee?.maxPriorityFeePerGas;
    const customFee = useMemo(
        () =>
            feePerUnit && feeLimit
                ? { feePerUnit, feeLimit, maxFeePerGas, maxPriorityFeePerGas }
                : undefined,
        [feePerUnit, feeLimit, maxFeePerGas, maxPriorityFeePerGas],
    );
    const composeAllowanceFeeParams = useMemo((): ComposeAllowanceFeeParams | null => {
        if (!isEnabled || !flowData || !formDraftKey || !feeInfo || !transaction) {
            return null;
        }

        return {
            customFee,
            feeInfo,
            flowData,
            formDraftKey,
            selectedFee,
            transaction,
        };
    }, [customFee, feeInfo, flowData, formDraftKey, isEnabled, selectedFee, transaction]);

    const isCurrentComposition =
        composeAllowanceFeeParams !== null && composedParams === composeAllowanceFeeParams;
    const isCurrentFeeComposing =
        isComposingFeeLevels ||
        (composeAllowanceFeeParams !== null && !isCurrentComposition && !hasFeeEstimationError);
    const isAllowanceFeeReady =
        isCurrentComposition &&
        formDraft !== undefined &&
        !isCurrentFeeComposing &&
        !hasFeeEstimationError &&
        isFinalPrecomposedTransaction(feeLevels[selectedFee]);

    const formDraftRef = useFreshRef(formDraft);

    const composeAllowanceFee = useCallback(
        async (requestId: number) => {
            if (requestId !== requestIdRef.current) return;

            if (!composeAllowanceFeeParams) {
                setIsComposingFeeLevels(false);

                return;
            }

            setIsComposingFeeLevels(true);
            try {
                const {
                    customFee: allowanceCustomFee,
                    feeInfo: allowanceFeeInfo,
                    flowData: allowanceFlowData,
                    formDraftKey: allowanceFormDraftKey,
                    selectedFee: allowanceSelectedFee,
                    transaction: allowanceTransaction,
                } = composeAllowanceFeeParams;
                const { allowanceAmount, modalState } = allowanceTransaction;
                const data = buildApprovalTransactionData({
                    amount: allowanceAmount,
                    spender: modalState.spender,
                });
                if (!formDraftRef.current) {
                    dispatch(
                        formDraftActions.storeDraft({
                            key: allowanceFormDraftKey,
                            formDraft: buildYieldAllowanceFormState({
                                approvalModalState: modalState,
                                data,
                                selectedFee: allowanceSelectedFee,
                            }),
                        }),
                    );
                }
                const feeResponse = await dispatch(
                    composeAllowanceTransactionThunk({
                        account: allowanceFlowData.account,
                        contract: modalState.contractAddress,
                        customFee: allowanceCustomFee,
                        data,
                        feeInfo: allowanceFeeInfo,
                        selectedFee: allowanceSelectedFee,
                    }),
                );

                if (requestId !== requestIdRef.current) return;

                if (!isFulfilled(feeResponse)) {
                    setHasFeeEstimationError(true);

                    return;
                }

                dispatch(
                    transactionManagementActions.storeFeeLevels({ feeLevels: feeResponse.payload }),
                );
                setComposedParams(composeAllowanceFeeParams);

                const selectedFeeTransaction = feeResponse.payload[allowanceSelectedFee];

                if (!isFinalPrecomposedTransaction(selectedFeeTransaction)) {
                    setHasFeeEstimationError(
                        selectedFeeTransaction?.type !== 'error' ||
                            !isPrecomposedTransactionError(selectedFeeTransaction.error),
                    );

                    return;
                }

                const formState = buildYieldAllowanceFormState({
                    approvalModalState: modalState,
                    data,
                    precomposedTransaction: selectedFeeTransaction,
                    selectedFee: allowanceSelectedFee,
                });

                dispatch(
                    formDraftActions.storeDraft({
                        key: allowanceFormDraftKey,
                        formDraft: formState,
                    }),
                );
            } catch {
                if (requestId !== requestIdRef.current) return;
                setHasFeeEstimationError(true);
            } finally {
                if (requestId === requestIdRef.current) {
                    setIsComposingFeeLevels(false);
                }
            }
        },
        [composeAllowanceFeeParams, dispatch, formDraftRef, setHasFeeEstimationError],
    );

    useEffect(() => {
        const requestId = ++requestIdRef.current;
        setHasFeeEstimationError(false);
        setIsComposingFeeLevels(composeAllowanceFeeParams !== null);
        debounce(() => composeAllowanceFee(requestId));
    }, [
        composeAllowanceFee,
        composeAllowanceFeeParams,
        debounce,
        feeEstimationRetryKey,
        setHasFeeEstimationError,
    ]);

    useEffect(
        () => () => {
            requestIdRef.current += 1;
        },
        [],
    );

    return {
        formDraft,
        formDraftKey,
        hasFeeEstimationError,
        retryFeeEstimation,
        isAllowanceFeeReady,
        isComposingFeeLevels: isCurrentFeeComposing,
        selectedFee,
        updateFeeLevelThunk: updateEarnSelectedFeeLevelThunk,
    };
};
