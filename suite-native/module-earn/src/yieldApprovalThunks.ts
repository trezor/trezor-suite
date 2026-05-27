import { createThunk } from '@suite-common/redux-utils';
import {
    type YieldFlowResolvedData,
    formDraftActions,
    selectDeepCopyOfFormDraft,
    selectStablecoinYieldSession,
    sendFormActions,
} from '@suite-common/wallet-core';
import {
    type FormState,
    type TokenAddress,
    isFinalPrecomposedTransaction,
} from '@suite-common/wallet-types';
import { buildApprovalTransactionData } from '@suite-common/wallet-utils';
import {
    type UpdateSelectedFeeLevelThunkParams,
    selectFeeLevels,
} from '@suite-native/transaction-management';

import { EARN_MODULE_PREFIX } from './constants';
import { type YieldApprovalLimitType } from './types';
import {
    buildYieldAllowanceFormState,
    getYieldAllowanceFeeState,
    getYieldApprovalAllowanceAmount,
} from './yieldApprovalUtils';

export type YieldAllowanceFormDraftTransactionType = 'approve' | 'revoke';

const yieldAllowanceFormDraftPrefixes: Record<YieldAllowanceFormDraftTransactionType, string> = {
    approve: 'yield-approval',
    revoke: 'yield-revoke',
};

export const getYieldAllowanceFormDraftKey = (
    flowKey: string,
    transactionType: YieldAllowanceFormDraftTransactionType,
) => `${yieldAllowanceFormDraftPrefixes[transactionType]}/${flowKey}`;

export const getYieldApprovalFormDraftKey = (flowKey: string) =>
    getYieldAllowanceFormDraftKey(flowKey, 'approve');

export const getYieldRevokeFormDraftKey = (flowKey: string) =>
    getYieldAllowanceFormDraftKey(flowKey, 'revoke');

export const prepareYieldApprovalReviewTransactionThunk = createThunk(
    `${EARN_MODULE_PREFIX}/prepareYieldApprovalReviewTransactionThunk`,
    (
        {
            amount,
            approvalLimitType,
            flowData,
            flowKey,
            tokenContract,
        }: {
            amount: string;
            approvalLimitType: YieldApprovalLimitType;
            flowData: YieldFlowResolvedData;
            flowKey: string;
            tokenContract: TokenAddress;
        },
        { dispatch, getState, rejectWithValue },
    ) => {
        dispatch(sendFormActions.discardTransaction());

        const formDraftKey = getYieldApprovalFormDraftKey(flowKey);
        const formDraft = selectDeepCopyOfFormDraft(getState(), formDraftKey) as
            | FormState
            | undefined;
        const { approval } = selectStablecoinYieldSession(getState(), 'deposit', flowKey);

        if (!approval.modalState) {
            return rejectWithValue('Approval review transaction is not ready.');
        }

        const { selectedFee } = getYieldAllowanceFeeState(formDraft);
        const selectedFeeTransaction = selectFeeLevels(getState())[selectedFee];

        if (!isFinalPrecomposedTransaction(selectedFeeTransaction)) {
            return rejectWithValue('Selected approval fee is not composed.');
        }

        const allowanceAmount = getYieldApprovalAllowanceAmount({
            amount,
            approvalLimitType,
            tokenContract,
            tokenDecimals: flowData.token.decimals,
            tokenSymbol: flowData.token.symbol,
        });
        const data = buildApprovalTransactionData({
            amount: allowanceAmount,
            spender: approval.modalState.spender,
        });
        const formState = buildYieldAllowanceFormState({
            approvalModalState: approval.modalState,
            data,
            precomposedTransaction: selectedFeeTransaction,
            selectedFee,
        });

        dispatch(
            sendFormActions.storePrecomposedTransaction({
                formState,
                precomposedTransaction: selectedFeeTransaction,
                accountKey: flowData.account.key,
            }),
        );
    },
);

export const updateYieldAllowanceSelectedFeeLevelThunk = createThunk(
    `${EARN_MODULE_PREFIX}/updateYieldAllowanceSelectedFeeLevelThunk`,
    (
        {
            feeLevelLabel,
            feePerUnit,
            feeLimit,
            formDraftKey,
            maxFeePerGas,
            maxPriorityFeePerGas,
        }: UpdateSelectedFeeLevelThunkParams,
        { dispatch, getState },
    ) => {
        if (!formDraftKey) return;

        const formDraft = selectDeepCopyOfFormDraft(getState(), formDraftKey) as
            | FormState
            | undefined;

        if (!formDraft) return;

        formDraft.selectedFee = feeLevelLabel;

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
    },
);
