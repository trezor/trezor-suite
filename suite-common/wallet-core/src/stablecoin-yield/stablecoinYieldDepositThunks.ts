import { createThunk } from '@suite-common/redux-utils';

import {
    getApprovalRequestAmount,
    setYieldGenericError,
    submitYieldOpportunity,
} from './stablecoinYieldApprovalThunks';
import { STABLECOIN_YIELD_PREFIX, stablecoinYieldActions } from './stablecoinYieldReducer';
import type { YieldFlowResolvedData } from './stablecoinYieldTypes';
import {
    getWithdrawRequestAmount,
    getYieldApprovalModalParams,
    getYieldRevokeModalParams,
    getYieldSupplyTransaction,
} from './stablecoinYieldUtils';

const YIELD_DEPOSIT_THUNK_PREFIX = `${STABLECOIN_YIELD_PREFIX}/thunk`;

export type PrepareYieldDepositResult =
    | {
          type: 'action-ready';
          unsignedTransaction: string;
          receiptAmount: string;
      }
    | {
          type: 'approval-required';
          spender: string;
      }
    | {
          type: 'revoke-required';
          spender: string | null;
      }
    | {
          type: 'error';
      };

type GetYieldDepositPreparationResultParams = {
    amount: string;
    flowData: YieldFlowResolvedData;
    transactions: Awaited<ReturnType<typeof submitYieldOpportunity>>['response']['transactions'];
};

type PrepareYieldDepositPayload = {
    flowKey: string;
    flowData: YieldFlowResolvedData;
    amount: string;
};

type PrepareYieldDepositActionParams = {
    amount: string;
    flowData: YieldFlowResolvedData;
};

export const getYieldDepositPreparationResult = ({
    amount,
    flowData,
    transactions,
}: GetYieldDepositPreparationResultParams): PrepareYieldDepositResult => {
    const revokeModalParams = getYieldRevokeModalParams(transactions);

    if (revokeModalParams) {
        return {
            type: 'revoke-required',
            spender: revokeModalParams.spender,
        };
    }

    const approvalModalParams = getYieldApprovalModalParams(transactions);

    if (approvalModalParams) {
        return {
            type: 'approval-required',
            spender: approvalModalParams.spender,
        };
    }

    const actionTransaction = getYieldSupplyTransaction(transactions);

    if (!actionTransaction?.id || typeof actionTransaction.unsignedTransaction !== 'string') {
        return { type: 'error' };
    }

    const receiptAmount =
        getWithdrawRequestAmount({
            networkSymbol: flowData.account.symbol,
            amount,
            token: flowData.token,
            receiptToken: flowData.receiptToken,
            pricePerShare: flowData.vault.state?.pricePerShareState?.price,
        }) ?? amount;

    return {
        type: 'action-ready',
        unsignedTransaction: actionTransaction.unsignedTransaction,
        receiptAmount,
    };
};

export const prepareYieldDepositAction = async ({
    amount,
    flowData,
}: PrepareYieldDepositActionParams): Promise<PrepareYieldDepositResult> => {
    const errorResult = { type: 'error' } as const;
    const requestAmount = getApprovalRequestAmount({
        flowType: 'deposit',
        amount,
        flowData,
    });

    if (!requestAmount) {
        return errorResult;
    }

    const { response, verification } = await submitYieldOpportunity({
        flowType: 'deposit',
        flowData,
        amount: requestAmount,
    });

    if (verification === 'failure') {
        return errorResult;
    }

    return getYieldDepositPreparationResult({
        amount,
        flowData,
        transactions: response.transactions,
    });
};

export const prepareYieldDepositThunk = createThunk<
    PrepareYieldDepositResult,
    PrepareYieldDepositPayload,
    void
>(
    `${YIELD_DEPOSIT_THUNK_PREFIX}/prepareDeposit`,
    async ({ flowKey, flowData, amount }, { dispatch }) => {
        const flowType = 'deposit' as const;
        const errorResult = { type: 'error' } as const;

        dispatch(stablecoinYieldActions.startSubmittingAction({ flowType, flowKey, amount }));

        try {
            const result = await prepareYieldDepositAction({
                amount,
                flowData,
            });

            if (result.type === 'error') {
                setYieldGenericError({ dispatch, flowType, flowKey });
            }

            return result;
        } catch {
            setYieldGenericError({ dispatch, flowType, flowKey });

            return errorResult;
        } finally {
            dispatch(stablecoinYieldActions.finishSubmittingAction({ flowType, flowKey }));
        }
    },
);
