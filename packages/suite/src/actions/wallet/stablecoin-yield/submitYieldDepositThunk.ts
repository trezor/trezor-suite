import { type DesktopAnalyticsDep } from '@suite/analytics';
import { openDeferredModal } from '@suite/modal';
import { events } from '@suite-common/analytics';
import { type StablecoinYieldTxSimulationParams } from '@suite-common/earn-stablecoin';
import { createThunk } from '@suite-common/redux-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import {
    type ComposeYieldDepositTransactionThunkState,
    YIELD_PREFIX,
    type YieldFlowResolvedData,
    composeYieldDepositTransactionThunk,
    getYieldDepositErrorTranslationKey,
    openYieldApproveModal,
    setYieldError,
    yieldActions,
} from '@suite-common/wallet-core';

import {
    type SendYieldTransactionDeps,
    type SendYieldTransactionState,
    getYieldErrorTranslationKey,
    getYieldSubmitErrorAnalyticsMessage,
    sendYieldTransaction,
} from './signingHelpers';

type SubmitYieldDepositPayload = {
    flowKey: string;
    flowData: YieldFlowResolvedData;
    amount: string;
};

type SubmitYieldDepositThunkState = ComposeYieldDepositTransactionThunkState &
    SendYieldTransactionState;

type SubmitYieldDepositThunkDeps = SendYieldTransactionDeps & {
    services: DesktopAnalyticsDep;
};

export const submitYieldDepositThunk = createThunk<
    void,
    SubmitYieldDepositPayload,
    { state: SubmitYieldDepositThunkState; extra: SubmitYieldDepositThunkDeps }
>(
    `${YIELD_PREFIX}/thunk/submitDeposit`,
    async ({ flowKey, flowData, amount }, { dispatch, getState, extra }) => {
        const flowType = 'deposit' as const;

        try {
            dispatch(yieldActions.startSubmittingAction({ flowType, flowKey, amount }));

            const result = await dispatch(
                composeYieldDepositTransactionThunk({ flowData, amount }),
            ).unwrap();

            if (result.type === 'error') {
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
                openDeferredModal({
                    type: 'earn-yield-tx-simulation',
                    data: {
                        flow: flowType,
                        unsignedTx: result.unsignedTransaction,
                        account: flowData.account,
                    } satisfies StablecoinYieldTxSimulationParams,
                }),
            );

            extra.services.analytics.report({
                type: events.yieldDepositEvent.name,
                payload: {
                    type: 'tx-simulation-modal',
                    action: userAcceptedTxSimulation?.value === false ? 'cancel' : 'continue',
                    networkSymbol: flowData.account.symbol,
                    vaultId: flowData.vault.id,
                },
            });

            if (userAcceptedTxSimulation?.value === false) {
                return;
            }

            const selectedFee = userAcceptedTxSimulation?.selectedFee ?? null;

            const sendResult = await sendYieldTransaction({
                account: flowData.account,
                amount,
                token: flowData.token,
                unsignedTransaction: result.unsignedTransaction,
                flowKey,
                flowType,
                dispatch,
                getState,
                selectedFee,
            });

            userAcceptedTxSimulation?.resolve();

            // A deliberate user cancel — not reported as a failure.
            if (sendResult.status === 'cancelled') {
                return;
            }

            dispatch(
                notificationsActions.addToast({
                    type: 'tx-yield-deposit',
                    descriptor: flowData.account.descriptor,
                    symbol: flowData.account.symbol,
                    txid: sendResult.txid,
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
            // Static string only: the raw error can embed the signed tx hex / from-address
            // (see sendYieldTransaction) and console.error is forwarded to Sentry.
            // The sanitized message is reported separately via getYieldSubmitErrorAnalyticsMessage below.
            console.error('submitYieldDepositThunk failed');
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
            dispatch(
                yieldActions.setError({
                    flowType,
                    flowKey,
                    error: getYieldErrorTranslationKey(error),
                }),
            );
        } finally {
            dispatch(yieldActions.finishSubmittingAction({ flowType, flowKey }));
        }
    },
);
