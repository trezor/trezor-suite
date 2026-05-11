import { openDeferredModal } from '@suite/modal';
import { type StablecoinYieldTxSimulationParams } from '@suite-common/earn-stablecoin/src/tx-simulation';
import { createThunk } from '@suite-common/redux-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import {
    STABLECOIN_YIELD_PREFIX,
    type YieldFlowResolvedData,
    getApprovalRequestAmount,
    getWithdrawRequestAmount,
    getYieldApprovalModalParams,
    getYieldSupplyTransaction,
    openYieldApproveModal,
    setYieldGenericError,
    stablecoinYieldActions,
    submitYieldOpportunity,
} from '@suite-common/wallet-core';

import { sendYieldTransaction } from './signingHelpers';

type SubmitYieldDepositPayload = {
    flowKey: string;
    flowData: YieldFlowResolvedData;
    amount: string;
};

export const submitYieldDepositThunk = createThunk(
    `${STABLECOIN_YIELD_PREFIX}/thunk/submitDeposit`,
    async ({ flowKey, flowData, amount }: SubmitYieldDepositPayload, { dispatch, getState }) => {
        const flowType = 'deposit' as const;

        try {
            dispatch(stablecoinYieldActions.startSubmittingAction({ flowType, flowKey, amount }));

            const requestAmount = getApprovalRequestAmount({
                flowType,
                amount,
                flowData,
            });

            if (!requestAmount) {
                setYieldGenericError({ dispatch, flowType, flowKey });

                return;
            }

            const { response, verification } = await submitYieldOpportunity({
                flowType,
                flowData,
                amount: requestAmount,
            });

            if (verification === 'failure') {
                setYieldGenericError({ dispatch, flowType, flowKey });

                return;
            }

            const { transactions } = response.data;
            const approvalModalParams = getYieldApprovalModalParams(transactions);

            if (approvalModalParams) {
                dispatch(
                    stablecoinYieldActions.setApprovalResponse({
                        flowType,
                        flowKey,
                        approvedSpender: approvalModalParams.spender,
                        revokeTransactions: transactions,
                    }),
                );
                dispatch(stablecoinYieldActions.enterModifyMode({ flowType, flowKey }));

                openYieldApproveModal({
                    dispatch,
                    flowKey,
                    flowType,
                    flowData,
                    amount: requestAmount,
                    spender: approvalModalParams.spender,
                    txType: 'approve',
                });

                return;
            }

            const actionTransaction = getYieldSupplyTransaction(transactions);

            if (!actionTransaction?.id) {
                setYieldGenericError({ dispatch, flowType, flowKey });

                return;
            }

            if (typeof actionTransaction.unsignedTransaction !== 'string') {
                setYieldGenericError({ dispatch, flowType, flowKey });

                return;
            }

            const userAcceptedTxSimulation = await dispatch(
                openDeferredModal({
                    type: 'earn-yield-tx-simulation',
                    data: {
                        flow: flowType,
                        unsignedTx: actionTransaction.unsignedTransaction,
                        account: flowData.account,
                    } satisfies StablecoinYieldTxSimulationParams,
                }),
            );

            if (userAcceptedTxSimulation?.value === false) {
                return;
            }

            const selectedFee = userAcceptedTxSimulation?.selectedFee ?? null;
            const vaultName = flowData.vault.outputToken?.name ?? flowData.vault.metadata.name;

            const result = await sendYieldTransaction({
                account: flowData.account,
                amount,
                token: flowData.token,
                unsignedTransaction: actionTransaction.unsignedTransaction,
                flowType,
                vaultName,
                dispatch,
                getState,
                selectedFee,
            });

            if (!result) {
                return;
            }

            dispatch(
                notificationsActions.addToast({
                    type: 'tx-yield-supply',
                    descriptor: flowData.account.descriptor,
                    symbol: flowData.account.symbol,
                    txid: result.txid,
                }),
            );

            const receiptAmount =
                getWithdrawRequestAmount({
                    networkSymbol: flowData.account.symbol,
                    amount,
                    token: flowData.token,
                    receiptToken: flowData.receiptToken,
                    pricePerShare: flowData.vault.state?.pricePerShareState?.price,
                }) ?? amount;

            dispatch(
                stablecoinYieldActions.setPendingTx({
                    flowType,
                    flowKey,
                    tx: {
                        type: flowType,
                        txid: result.txid,
                        amount,
                    },
                    receiptAmount,
                }),
            );
        } catch (error) {
            console.error(error);
            setYieldGenericError({ dispatch, flowType, flowKey });
        } finally {
            dispatch(stablecoinYieldActions.finishSubmittingAction({ flowType, flowKey }));
        }
    },
);
