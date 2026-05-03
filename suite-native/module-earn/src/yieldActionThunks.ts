import { createThunk } from '@suite-common/redux-utils';
import {
    type YieldFlowResolvedData,
    getYieldActionReviewState,
    openYieldApproveModal,
    prepareYieldAction,
    sendFormActions,
    stablecoinYieldActions,
} from '@suite-common/wallet-core';

import { EARN_MODULE_PREFIX } from './constants';

type PrepareYieldSupplyReviewTransactionParams = {
    amount: string;
    flowData: YieldFlowResolvedData;
    flowKey: string;
};

type PrepareYieldSupplyReviewTransactionResult =
    | {
          type: 'approval-required';
      }
    | {
          type: 'review-ready';
          amount: string;
          receiptAmount: string;
          transactionId: string;
      };

type PrepareYieldSupplyReviewTransactionError =
    | 'approval-modal-unavailable'
    | 'review-transaction-unavailable'
    | 'yield-action-unavailable';

export const prepareYieldSupplyReviewTransactionThunk = createThunk<
    PrepareYieldSupplyReviewTransactionResult,
    PrepareYieldSupplyReviewTransactionParams,
    { rejectValue: PrepareYieldSupplyReviewTransactionError }
>(
    `${EARN_MODULE_PREFIX}/prepareYieldSupplyReviewTransactionThunk`,
    async ({ amount, flowData, flowKey }, { dispatch, rejectWithValue }) => {
        const flowType = 'supply';

        dispatch(sendFormActions.discardTransaction());

        const preparedAction = await prepareYieldAction({
            flowType,
            flowData,
            amount,
        });

        if (preparedAction.type === 'error') {
            return rejectWithValue('yield-action-unavailable');
        }

        if (preparedAction.type === 'approval-required') {
            dispatch(
                stablecoinYieldActions.setApprovalResponse({
                    flowType,
                    flowKey,
                    approvedSpender: preparedAction.approvalModalParams.spender,
                    revokeTransactions: preparedAction.transactions,
                }),
            );
            dispatch(stablecoinYieldActions.enterModifyMode({ flowType, flowKey }));

            const isApprovalModalOpened = openYieldApproveModal({
                dispatch,
                flowKey,
                flowType,
                flowData,
                amount: preparedAction.requestAmount,
                spender: preparedAction.approvalModalParams.spender,
                transactionId: preparedAction.approvalModalParams.transactionId,
                txType: 'approve',
            });

            if (!isApprovalModalOpened) {
                return rejectWithValue('approval-modal-unavailable');
            }

            return { type: 'approval-required' };
        }

        const vaultName = flowData.vault.outputToken?.name ?? flowData.vault.metadata.name;
        const reviewState = getYieldActionReviewState({
            amount: preparedAction.reviewAmount,
            token: flowData.token,
            symbol: flowData.account.symbol,
            transaction: preparedAction.actionTransaction,
            flowType,
            vaultName,
        });

        if (!reviewState) {
            return rejectWithValue('review-transaction-unavailable');
        }

        dispatch(
            sendFormActions.storePrecomposedTransaction({
                formState: reviewState.formState,
                precomposedTransaction: reviewState.precomposedTransaction,
                accountKey: flowData.account.key,
            }),
        );

        return {
            type: 'review-ready',
            amount,
            receiptAmount: preparedAction.receiptAmount,
            transactionId: preparedAction.actionTransaction.id,
        };
    },
);
