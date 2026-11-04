import {
    type FormDraftRootState,
    REVOKE_ALLOWANCE_AMOUNT,
    type YieldFlowResolvedData,
    type YieldRootState,
    selectDeepCopyOfFormDraft,
    selectYieldSession,
    sendFormActions,
} from '@suite-common/wallet-core';
import {
    type AllowanceLimitType,
    type AllowanceTransactionType,
    type FormState,
    type TokenAddress,
    isFinalPrecomposedTransaction,
} from '@suite-common/wallet-types';
import { buildApprovalTransactionData } from '@suite-common/wallet-utils';
import { type NativeSendRootState, selectFeeLevels } from '@suite-native/transaction-management';
import { createThunk } from '@trezor/redux-utils';
import { exhaustive } from '@trezor/type-utils';

import { EARN_MODULE_PREFIX } from '../../constants';
import {
    buildYieldAllowanceFormState,
    getYieldAllowanceFeeState,
    getYieldApprovalAllowanceAmount,
} from '../../utils/yield/yieldApprovalUtils';

const yieldAllowanceFormDraftPrefixes: Record<AllowanceTransactionType, string> = {
    approve: 'yield-approval',
    revoke: 'yield-revoke',
};

export const getYieldAllowanceFormDraftKey = (
    flowKey: string,
    transactionType: AllowanceTransactionType,
) => `${yieldAllowanceFormDraftPrefixes[transactionType]}/${flowKey}`;

type PrepareYieldAllowanceReviewTransactionParams = {
    amount?: string;
    approvalLimitType?: AllowanceLimitType;
    flowData: YieldFlowResolvedData;
    flowKey: string;
    transactionType: AllowanceTransactionType;
    tokenContract: TokenAddress;
};

type GetYieldAllowanceReviewAmountParams = {
    amount?: string;
    approvalLimitType?: AllowanceLimitType;
    flowData: YieldFlowResolvedData;
    modalTxType: AllowanceTransactionType;
    tokenContract: TokenAddress;
};

const getYieldAllowanceReviewAmount = ({
    amount,
    approvalLimitType,
    flowData,
    modalTxType,
    tokenContract,
}: GetYieldAllowanceReviewAmountParams) => {
    switch (modalTxType) {
        case 'approve':
            if (!amount || !approvalLimitType) {
                return null;
            }

            return getYieldApprovalAllowanceAmount({
                amount,
                approvalLimitType,
                tokenContract,
                tokenDecimals: flowData.token.decimals,
                tokenSymbol: flowData.token.symbol,
            });
        case 'revoke':
            return REVOKE_ALLOWANCE_AMOUNT;
        default:
            return exhaustive(modalTxType);
    }
};

const isExpectedAllowanceModalTxType = (
    transactionType: AllowanceTransactionType,
    modalTxType: AllowanceTransactionType,
) => {
    if (transactionType === 'approve') {
        return modalTxType === 'approve';
    }

    return modalTxType === 'revoke';
};

export type PrepareYieldAllowanceReviewTransactionThunkState = FormDraftRootState &
    YieldRootState &
    NativeSendRootState;

export const prepareYieldAllowanceReviewTransactionThunk = createThunk<
    void,
    PrepareYieldAllowanceReviewTransactionParams,
    { rejectValue: string; state: PrepareYieldAllowanceReviewTransactionThunkState }
>(
    `${EARN_MODULE_PREFIX}/prepareYieldAllowanceReviewTransactionThunk`,
    (
        { amount, approvalLimitType, flowData, flowKey, transactionType, tokenContract },
        { dispatch, getState, rejectWithValue },
    ) => {
        dispatch(sendFormActions.discardTransaction());

        const formDraftKey = getYieldAllowanceFormDraftKey(flowKey, transactionType);
        const formDraft = selectDeepCopyOfFormDraft(getState(), formDraftKey) as
            FormState | undefined;
        const { approval } = selectYieldSession(getState(), 'deposit', flowKey);

        const { modalState } = approval;

        if (!modalState) {
            return rejectWithValue('Approval review transaction is not ready.');
        }

        if (!isExpectedAllowanceModalTxType(transactionType, modalState.txType)) {
            return rejectWithValue('Allowance review transaction type does not match.');
        }

        const { selectedFee } = getYieldAllowanceFeeState(formDraft);
        const selectedFeeTransaction = selectFeeLevels(getState())[selectedFee];

        if (!isFinalPrecomposedTransaction(selectedFeeTransaction)) {
            return rejectWithValue('Selected allowance fee is not composed.');
        }

        const allowanceAmount = getYieldAllowanceReviewAmount({
            amount,
            approvalLimitType,
            flowData,
            modalTxType: modalState.txType,
            tokenContract,
        });

        if (allowanceAmount === null) {
            return rejectWithValue('Allowance review amount is not ready.');
        }

        const data = buildApprovalTransactionData({
            amount: allowanceAmount ?? '',
            spender: modalState.spender,
        });
        const formState = buildYieldAllowanceFormState({
            approvalModalState: modalState,
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
