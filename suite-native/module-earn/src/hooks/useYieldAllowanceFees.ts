import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { isFulfilled } from '@reduxjs/toolkit';

import {
    type FeesRootState,
    type FormDraftRootState,
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
import { useDebounce } from '@trezor/react-utils';

import { type ResolvedYieldFlowData } from './useResolvedYieldFlowData';
import { type YieldAllowanceFormDraftTransactionType } from '../types';
import {
    getYieldAllowanceFormDraftKey,
    updateYieldAllowanceSelectedFeeLevelThunk,
} from '../yieldApprovalThunks';
import { buildYieldAllowanceFormState, getYieldAllowanceFeeState } from '../yieldApprovalUtils';

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
    const dispatch = useDispatch();
    const debounce = useDebounce();
    const [isComposingAllowanceFee, setIsComposingAllowanceFee] = useState(false);
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

    const { customFee, selectedFee } = useMemo(
        () => getYieldAllowanceFeeState(formDraft),
        [formDraft],
    );
    const selectedFeeLevel = feeLevels[selectedFee];
    const fee = isFinalPrecomposedTransaction(selectedFeeLevel) ? selectedFeeLevel.fee : null;
    const { isFeeUnavailable } = getFeeAvailability({
        fee,
        feeLevels,
        selectedFee,
        isLoading: isComposingAllowanceFee,
    });
    const isAllowanceFeeReady =
        formDraft !== undefined && !isComposingAllowanceFee && !isFeeUnavailable;

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

    const composeAllowanceFee = useCallback(async () => {
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

            if (!isFulfilled(feeResponse)) {
                dispatch(formDraftActions.removeDraft({ key: allowanceFormDraftKey }));

                return;
            }

            dispatch(
                transactionManagementActions.storeFeeLevels({ feeLevels: feeResponse.payload }),
            );

            const selectedFeeTransaction = feeResponse.payload[selectedFee];

            if (!isFinalPrecomposedTransaction(selectedFeeTransaction)) {
                dispatch(formDraftActions.removeDraft({ key: allowanceFormDraftKey }));

                return;
            }

            const formState = buildYieldAllowanceFormState({
                approvalModalState: modalState,
                data,
                precomposedTransaction: selectedFeeTransaction,
                selectedFee,
            });

            dispatch(
                formDraftActions.storeDraft({ key: allowanceFormDraftKey, formDraft: formState }),
            );
        } catch {
            dispatch(formDraftActions.removeDraft({ key: composeAllowanceFeeParams.formDraftKey }));
        } finally {
            setIsComposingAllowanceFee(false);
        }
    }, [composeAllowanceFeeParams, customFee, dispatch, selectedFee]);

    useEffect(() => {
        setIsComposingAllowanceFee(composeAllowanceFeeParams !== null);
        debounce(composeAllowanceFee);
    }, [composeAllowanceFee, composeAllowanceFeeParams, debounce]);

    return {
        formDraft,
        formDraftKey,
        isAllowanceFeeReady,
        isComposingAllowanceFee,
        isFeeUnavailable,
        selectedFee,
        updateFeeLevelThunk: updateYieldAllowanceSelectedFeeLevelThunk,
    };
};
