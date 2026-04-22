import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { isFulfilled } from '@reduxjs/toolkit';

import { EVM_VAULT_ADDRESSES } from '@suite-common/earn-stablecoin-api';
import {
    type FeesRootState,
    type FormDraftRootState,
    type YieldApproveModalState,
    composeAllowanceTransactionThunk,
    formDraftActions,
    getApprovalContractAddress,
    selectConvertedNetworkFeeInfo,
    selectFormDraft,
} from '@suite-common/wallet-core';
import {
    type FeeInfo,
    type FormState,
    type TokenAddress,
    isFinalPrecomposedTransaction,
} from '@suite-common/wallet-types';
import { buildApprovalTransactionData } from '@suite-common/wallet-utils';
import { transactionManagementActions } from '@suite-native/transaction-management';
import { useDebounce } from '@trezor/react-utils';

import { type ResolvedYieldFlowData } from './useResolvedYieldFlowData';
import { type YieldApprovalLimitType } from '../types';
import {
    getYieldApprovalFormDraftKey,
    updateYieldApprovalSelectedFeeLevelThunk,
} from '../yieldApprovalThunks';
import {
    buildYieldApprovalFormState,
    getYieldApprovalAllowanceAmount,
    getYieldApprovalFeeState,
} from '../yieldApprovalUtils';

type UseYieldApprovalFeesParams = Pick<ResolvedYieldFlowData, 'flowData' | 'flowKey'> & {
    amount: string | undefined;
    approvalLimitType: YieldApprovalLimitType;
    isEnabled: boolean;
    tokenContract: TokenAddress;
};

type ComposeApprovalFeeParams = {
    allowanceAmount: string;
    amount: string;
    feeInfo: FeeInfo;
    flowData: NonNullable<ResolvedYieldFlowData['flowData']>;
    formDraftKey: string;
};

export const useYieldApprovalFees = ({
    amount,
    approvalLimitType,
    flowData,
    flowKey,
    isEnabled,
    tokenContract,
}: UseYieldApprovalFeesParams) => {
    const dispatch = useDispatch();
    const debounce = useDebounce();
    const [isComposingApprovalFee, setIsComposingApprovalFee] = useState(false);
    const formDraftKey = useMemo(
        () => (flowKey ? getYieldApprovalFormDraftKey(flowKey) : ''),
        [flowKey],
    );
    const feeInfo = useSelector((state: FeesRootState) =>
        selectConvertedNetworkFeeInfo(state, flowData?.account.symbol),
    );
    const formDraft = useSelector((state: FormDraftRootState) =>
        formDraftKey ? selectFormDraft<FormState>(state, formDraftKey) : undefined,
    );

    const { customFee, selectedFee } = useMemo(
        () => getYieldApprovalFeeState(formDraft),
        [formDraft],
    );

    const allowanceAmount = useMemo(() => {
        if (!amount || !flowData) {
            return undefined;
        }

        return getYieldApprovalAllowanceAmount({
            amount,
            approvalLimitType,
            tokenContract,
            tokenDecimals: flowData.token.decimals,
            tokenSymbol: flowData.token.symbol,
        });
    }, [amount, approvalLimitType, flowData, tokenContract]);

    const composeApprovalFeeParams = useMemo((): ComposeApprovalFeeParams | null => {
        if (!isEnabled || !amount || !flowData || !formDraftKey || !feeInfo || !allowanceAmount) {
            return null;
        }

        return {
            allowanceAmount,
            amount,
            feeInfo,
            flowData,
            formDraftKey,
        };
    }, [allowanceAmount, amount, feeInfo, flowData, formDraftKey, isEnabled]);

    const composeApprovalFee = useCallback(async () => {
        if (!composeApprovalFeeParams) {
            setIsComposingApprovalFee(false);

            return;
        }

        setIsComposingApprovalFee(true);
        try {
            const {
                allowanceAmount: approvalAllowanceAmount,
                amount: approvalAmount,
                feeInfo: approvalFeeInfo,
                flowData: approvalFlowData,
                formDraftKey: approvalFormDraftKey,
            } = composeApprovalFeeParams;
            const approvalContractAddress = getApprovalContractAddress({
                flowType: 'supply',
                flowData: approvalFlowData,
            });

            if (!approvalContractAddress) {
                dispatch(formDraftActions.removeDraft({ key: approvalFormDraftKey }));

                return;
            }

            const spender = EVM_VAULT_ADDRESSES[approvalFlowData.vault.id];
            if (!spender) {
                dispatch(formDraftActions.removeDraft({ key: approvalFormDraftKey }));

                return;
            }

            const approvalModalState: YieldApproveModalState = {
                amount: approvalAmount,
                contractAddress: approvalContractAddress,
                spender,
                txType: 'approve',
            };
            const data = buildApprovalTransactionData({
                amount: approvalAllowanceAmount,
                spender: approvalModalState.spender,
            });
            const feeResponse = await dispatch(
                composeAllowanceTransactionThunk({
                    account: approvalFlowData.account,
                    contract: approvalModalState.contractAddress,
                    customFee,
                    data,
                    feeInfo: approvalFeeInfo,
                    selectedFee,
                }),
            );

            if (!isFulfilled(feeResponse)) {
                return;
            }

            dispatch(
                transactionManagementActions.storeFeeLevels({ feeLevels: feeResponse.payload }),
            );

            const selectedFeeTransaction = feeResponse.payload[selectedFee];

            if (!isFinalPrecomposedTransaction(selectedFeeTransaction)) {
                return;
            }

            const formState = buildYieldApprovalFormState({
                approvalModalState,
                data,
                precomposedTransaction: selectedFeeTransaction,
                selectedFee,
            });

            dispatch(
                formDraftActions.storeDraft({ key: approvalFormDraftKey, formDraft: formState }),
            );
        } catch {
            dispatch(formDraftActions.removeDraft({ key: composeApprovalFeeParams.formDraftKey }));
        } finally {
            setIsComposingApprovalFee(false);
        }
    }, [composeApprovalFeeParams, customFee, dispatch, selectedFee]);

    useEffect(() => {
        setIsComposingApprovalFee(composeApprovalFeeParams !== null);
        debounce(composeApprovalFee);
    }, [composeApprovalFee, composeApprovalFeeParams, debounce]);

    return {
        formDraft,
        formDraftKey,
        isComposingApprovalFee,
        selectedFee,
        updateFeeLevelThunk: updateYieldApprovalSelectedFeeLevelThunk,
    };
};
