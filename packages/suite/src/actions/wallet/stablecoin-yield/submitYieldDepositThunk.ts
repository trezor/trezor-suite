import { type DesktopAnalyticsDep } from '@suite/analytics';
import { events } from '@suite-common/analytics';
import { selectSelectedDevice } from '@suite-common/device';
import {
    type ComposeYieldDepositTransactionThunkState,
    YIELD_PREFIX,
    type YieldFlowResolvedData,
    composeYieldDepositTransactionThunk,
    getYieldDepositErrorTranslationKey,
    notifyEarnTransactionBroadcastThunk,
    openYieldApproveModal,
    setYieldError,
    transactionsActions,
    yieldActions,
} from '@suite-common/wallet-core';
import { createThunk } from '@trezor/redux-utils';

import {
    type SendEvmTransactionDeps,
    type SendEvmTransactionState,
    isEvmBroadcastError,
    openEvmTransactionSimulationThunk,
    sendEvmTokenTransaction,
} from '../evmTransaction';
import { getYieldSubmitErrorAnalyticsMessage, showYieldSubmitErrorThunk } from './signingHelpers';

type SubmitYieldDepositPayload = {
    flowKey: string;
    flowData: YieldFlowResolvedData;
    amount: string;
};

type SubmitYieldDepositThunkState = ComposeYieldDepositTransactionThunkState &
    SendEvmTransactionState;

type SubmitYieldDepositThunkDeps = SendEvmTransactionDeps & {
    services: DesktopAnalyticsDep;
};

export const submitYieldDepositThunk = createThunk<
    void,
    SubmitYieldDepositPayload,
    { state: SubmitYieldDepositThunkState; extra: SubmitYieldDepositThunkDeps }
>(
    `${YIELD_PREFIX}/thunk/submitDeposit`,
    async ({ flowKey, flowData, amount }, { dispatch, getState, extra }) => {
        const device = selectSelectedDevice(getState());
        const flowType = 'deposit' as const;

        try {
            dispatch(yieldActions.startSubmittingAction({ flowType, flowKey, amount }));

            const result = await dispatch(
                composeYieldDepositTransactionThunk({ flowData, amount }),
            ).unwrap();

            if (result.type === 'error') {
                extra.services.analytics.report({
                    type: events.yieldDepositEvent.name,
                    payload: {
                        type: 'error',
                        action: 'continue',
                        networkSymbol: flowData.account.symbol,
                        vaultId: flowData.vault.id,
                        errorMessage: result.reason,
                    },
                });
                setYieldError({
                    dispatch,
                    flowType,
                    flowKey,
                    error: getYieldDepositErrorTranslationKey(result.reason),
                });

                return;
            }

            if (result.type === 'revoke-required') {
                dispatch(yieldActions.enterModifyMode({ flowType, flowKey }));
                dispatch(yieldActions.setRevokeRequired({ flowType, flowKey }));

                return;
            }

            if (result.type === 'approval-required') {
                dispatch(yieldActions.enterModifyMode({ flowType, flowKey }));

                openYieldApproveModal({
                    dispatch,
                    flowKey,
                    flowType,
                    flowData,
                    amount,
                    spender: result.spender,
                    txType: 'approve',
                });

                return;
            }

            const userAcceptedTxSimulation = await dispatch(
                openEvmTransactionSimulationThunk(
                    {
                        flow: flowType,
                        unsignedTx: result.unsignedTransaction,
                        account: flowData.account,
                    },
                    device,
                ),
            );

            if (userAcceptedTxSimulation === undefined) {
                return;
            }

            extra.services.analytics.report({
                type: events.yieldDepositEvent.name,
                payload: {
                    type: 'tx-simulation-modal',
                    action: userAcceptedTxSimulation.value === false ? 'cancel' : 'continue',
                    networkSymbol: flowData.account.symbol,
                    vaultId: flowData.vault.id,
                },
            });

            if (userAcceptedTxSimulation.value === false) {
                return;
            }

            const sendResult = await sendEvmTokenTransaction({
                account: flowData.account,
                amount,
                token: flowData.token,
                unsignedTransaction: result.unsignedTransaction,
                yieldFlow: { flowKey, flowType },
                device,
                txType: 'yield',
                simulation: userAcceptedTxSimulation,
                dispatch,
                getState,
            });

            // A deliberate user cancel — not reported as a failure.
            if (sendResult.status === 'cancelled') {
                extra.services.analytics.report({
                    type: events.transactionCancelEvent.name,
                    payload: {
                        txType: 'yield',
                        networkSymbol: flowData.account.symbol,
                        stage: sendResult.stage,
                    },
                });

                return;
            }

            dispatch(
                notifyEarnTransactionBroadcastThunk({
                    account: flowData.account,
                    txid: sendResult.txid,
                    flow: 'yield-deposit',
                }),
            );

            dispatch(
                yieldActions.setPendingTx({
                    flowType,
                    flowKey,
                    tx: {
                        type: flowType,
                        txid: sendResult.txid,
                        amount,
                        fee: sendResult.fee,
                        submittedAt: Date.now(),
                    },
                    receiptAmount: result.receiptAmount,
                }),
            );
        } catch (error) {
            if (isEvmBroadcastError(error)) {
                dispatch(
                    transactionsActions.transactionBroadcastStatus({
                        account: flowData.account,
                        flow: 'yield-deposit',
                        status: 'error',
                    }),
                );
            }
            console.error(error);
            extra.services.analytics.report({
                type: events.yieldDepositEvent.name,
                payload: {
                    type: 'error',
                    action: 'continue',
                    networkSymbol: flowData.account.symbol,
                    vaultId: flowData.vault.id,
                    errorMessage: getYieldSubmitErrorAnalyticsMessage(error),
                },
            });
            dispatch(showYieldSubmitErrorThunk({ flowType, flowKey, error }));
        } finally {
            dispatch(yieldActions.finishSubmittingAction({ flowType, flowKey }));
        }
    },
);
