import { type TransactionDto } from '@suite-common/earn-stablecoin-api';
import { exhaustive } from '@trezor/type-utils';

import {
    type YieldFlowResolvedData,
    getApprovalRequestAmount,
    submitYieldOpportunity,
} from './stablecoinYieldApprovalThunks';
import { type YieldFlowType } from './stablecoinYieldTypes';
import {
    getWithdrawRequestAmount,
    getYieldApprovalModalParams,
    getYieldSupplyTransaction,
    getYieldWithdrawTransaction,
} from './stablecoinYieldUtils';

type YieldActionTransaction = TransactionDto & {
    id: string;
};

type PrepareYieldActionParams = {
    flowType: YieldFlowType;
    flowData: YieldFlowResolvedData;
    amount: string;
};

type YieldApprovalModalParams = NonNullable<ReturnType<typeof getYieldApprovalModalParams>>;

export type PrepareYieldActionErrorReason =
    | 'request-amount-unavailable'
    | 'submission-failed'
    | 'verification-failed'
    | 'missing-action-transaction';

export type PrepareYieldActionResult =
    | {
          type: 'approval-required';
          requestAmount: string;
          approvalModalParams: YieldApprovalModalParams;
          transactions: TransactionDto[];
      }
    | {
          type: 'action-ready';
          requestAmount: string;
          reviewAmount: string;
          actionTransaction: YieldActionTransaction;
          receiptAmount: string;
      }
    | {
          type: 'error';
          reason: PrepareYieldActionErrorReason;
      };

const getYieldActionTransaction = ({
    flowType,
    transactions,
}: Pick<PrepareYieldActionParams, 'flowType'> & {
    transactions: TransactionDto[];
}) => {
    switch (flowType) {
        case 'supply':
            return getYieldSupplyTransaction(transactions);
        case 'withdraw':
            return getYieldWithdrawTransaction(transactions);
        default:
            return exhaustive(flowType);
    }
};

const getYieldReceiptAmount = ({
    flowType,
    flowData,
    amount,
    requestAmount,
}: PrepareYieldActionParams & {
    requestAmount: string;
}) => {
    switch (flowType) {
        case 'supply':
            return (
                getWithdrawRequestAmount({
                    networkSymbol: flowData.account.symbol,
                    amount,
                    token: flowData.token,
                    receiptToken: flowData.receiptToken,
                    pricePerShare: flowData.vault.state?.pricePerShareState?.price,
                }) ?? amount
            );
        case 'withdraw':
            return requestAmount;
        default:
            return exhaustive(flowType);
    }
};

export const prepareYieldAction = async ({
    flowType,
    flowData,
    amount,
}: PrepareYieldActionParams): Promise<PrepareYieldActionResult> => {
    const requestAmount = getApprovalRequestAmount({
        flowType,
        amount,
        flowData,
    });

    if (!requestAmount) {
        return {
            type: 'error',
            reason: 'request-amount-unavailable',
        };
    }

    try {
        const { response, verification } = await submitYieldOpportunity({
            flowType,
            flowData,
            amount: requestAmount,
        });

        if (verification === 'failure') {
            return {
                type: 'error',
                reason: 'verification-failed',
            };
        }

        const { transactions } = response.data;
        const approvalModalParams = getYieldApprovalModalParams(transactions);

        if (approvalModalParams) {
            return {
                type: 'approval-required',
                requestAmount,
                approvalModalParams,
                transactions,
            };
        }

        const actionTransaction = getYieldActionTransaction({ flowType, transactions });

        if (!actionTransaction?.id) {
            return {
                type: 'error',
                reason: 'missing-action-transaction',
            };
        }

        return {
            type: 'action-ready',
            requestAmount,
            reviewAmount: flowType === 'withdraw' ? requestAmount : amount,
            actionTransaction,
            receiptAmount: getYieldReceiptAmount({
                flowType,
                flowData,
                amount,
                requestAmount,
            }),
        };
    } catch {
        return {
            type: 'error',
            reason: 'submission-failed',
        };
    }
};
