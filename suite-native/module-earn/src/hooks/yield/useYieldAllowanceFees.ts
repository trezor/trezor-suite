import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';

import { isFulfilled } from '@reduxjs/toolkit';

import {
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
    type FeeInfo,
    type FormState,
    isFinalPrecomposedTransaction,
} from '@suite-common/wallet-types';
import { buildApprovalTransactionData } from '@suite-common/wallet-utils';
import {
    type NativeSendRootState,
    getFeeAvailability,
    selectFeeLevels,
    transactionManagementActions,
} from '@suite-native/transaction-management';
import { useServices } from '@trezor/dependency-injection';
import { useDebounce, useFreshRef } from '@trezor/react-utils';
import { injectDispatch } from '@trezor/redux-utils';

import { useYieldFeeEstimationError } from './useYieldFeeEstimationError';
import {
    getYieldAllowanceFormDraftKey,
    updateYieldAllowanceSelectedFeeLevelThunk,
} from '../../thunks/yield/yieldApprovalThunks';
import { type YieldAllowanceFormDraftTransactionType } from '../../types';
import {
    buildYieldAllowanceFormState,
    getYieldAllowanceFeeState,
} from '../../utils/yield/yieldApprovalUtils';
import { useEarnFeeAnalytics } from '../earn/useEarnFeeAnalytics';

export type YieldAllowanceFeeTransaction = {
    allowanceAmount: string;
    modalState: YieldApproveModalState;
};

type YieldAllowanceFeesCommonParams = Pick<ResolvedYieldFlowData, 'flowData' | 'flowKey'> & {
    isEnabled: boolean;
};

export type UseYieldAllowanceFeesParams = YieldAllowanceFeesCommonParams & {
    draftTransactionType: YieldAllowanceFormDraftTransactionType;
    transaction: YieldAllowanceFeeTransaction | null;
};

type ComposeAllowanceFeeParams = {
    feeInfo: FeeInfo;
    flowData: NonNullable<ResolvedYieldFlowData['flowData']>;
    formDraftKey: string;
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
    } = useYieldFeeEstimationError();
    const [isComposingAllowanceFee, setIsComposingAllowanceFee] = useState(true);
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
    const selectedFeeLevel = feeLevels[selectedFee];
    const { isFeeUnavailable } = getFeeAvailability({
        feeLevels,
        selectedFee,
        isLoading: isComposingAllowanceFee,
    });
    const isAllowanceFeeReady =
        isEnabled &&
        transaction !== null &&
        formDraft !== undefined &&
        !isComposingAllowanceFee &&
        !hasFeeEstimationError &&
        isFinalPrecomposedTransaction(selectedFeeLevel);

    const composeAllowanceFeeParams = useMemo((): ComposeAllowanceFeeParams | null => {
        if (!isEnabled || !flowData || !formDraftKey || !feeInfo || !transaction) {
            return null;
        }

        return {
            feeInfo,
            flowData,
            formDraftKey,
            transaction,
        };
    }, [feeInfo, flowData, formDraftKey, isEnabled, transaction]);

    const formDraftRef = useFreshRef(formDraft);

    const composeAllowanceFee = useCallback(
        async (requestId: number) => {
            if (requestId !== requestIdRef.current) return;

            if (!composeAllowanceFeeParams) {
                setIsComposingAllowanceFee(false);

                return;
            }

            setIsComposingAllowanceFee(true);
            try {
                const {
                    feeInfo: allowanceFeeInfo,
                    flowData: allowanceFlowData,
                    formDraftKey: allowanceFormDraftKey,
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
                                selectedFee,
                            }),
                        }),
                    );
                }
                const feeResponse = await dispatch(
                    composeAllowanceTransactionThunk({
                        account: allowanceFlowData.account,
                        contract: modalState.contractAddress,
                        customFee,
                        data,
                        feeInfo: allowanceFeeInfo,
                        selectedFee,
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

                const selectedFeeTransaction = feeResponse.payload[selectedFee];

                if (!isFinalPrecomposedTransaction(selectedFeeTransaction)) {
                    setHasFeeEstimationError(selectedFeeTransaction?.type !== 'error');

                    return;
                }

                const formState = buildYieldAllowanceFormState({
                    approvalModalState: modalState,
                    data,
                    precomposedTransaction: selectedFeeTransaction,
                    selectedFee,
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
                    setIsComposingAllowanceFee(false);
                }
            }
        },
        [
            composeAllowanceFeeParams,
            customFee,
            dispatch,
            formDraftRef,
            selectedFee,
            setHasFeeEstimationError,
        ],
    );

    useEffect(() => {
        const requestId = ++requestIdRef.current;
        setHasFeeEstimationError(false);
        setIsComposingAllowanceFee(composeAllowanceFeeParams !== null);
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

    const retryWithAnalytics = useEarnFeeAnalytics({
        contextKey: formDraftKey,
        flow: draftTransactionType,
        networkSymbol: flowData?.account.symbol,
        isEnabled: composeAllowanceFeeParams !== null,
        hasEstimationError: hasFeeEstimationError,
        isFeeUnavailable,
        isReady: isAllowanceFeeReady,
        retry: retryFeeEstimation,
    });

    return {
        formDraft,
        formDraftKey,
        hasFeeEstimationError,
        retryFeeEstimation: retryWithAnalytics,
        isAllowanceFeeReady,
        isComposingAllowanceFee,
        isFeeUnavailable,
        selectedFee,
        updateFeeLevelThunk: updateYieldAllowanceSelectedFeeLevelThunk,
    };
};
