import { type DesktopAnalyticsDep } from '@suite/analytics';
import { openDeferredModal } from '@suite/modal';
import { events } from '@suite-common/analytics';
import { type StablecoinYieldTxSimulationParams } from '@suite-common/earn-stablecoin';
import { createThunk } from '@suite-common/redux-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import {
    type ComposeYieldWithdrawTransactionThunkState,
    YIELD_PREFIX,
    type YieldFlowResolvedData,
    type YieldWithdrawFlowType,
    composeYieldWithdrawTransactionThunk,
    isYieldWithdrawFeeError,
    yieldActions,
} from '@suite-common/wallet-core';

import {
    type SendYieldTransactionDeps,
    type SendYieldTransactionState,
    getYieldErrorTranslationKey,
    getYieldSubmitErrorAnalyticsMessage,
    sendYieldTransaction,
} from './signingHelpers';

type SubmitYieldWithdrawPayload = {
    flowKey: string;
    flowData: YieldFlowResolvedData;
    amount: string;
    flowType: YieldWithdrawFlowType;
};

type SubmitYieldWithdrawThunkState = ComposeYieldWithdrawTransactionThunkState &
    SendYieldTransactionState;

type SubmitYieldWithdrawThunkDeps = SendYieldTransactionDeps & {
    services: DesktopAnalyticsDep;
};

export const submitYieldWithdrawThunk = createThunk<
    void,
    SubmitYieldWithdrawPayload,
    { state: SubmitYieldWithdrawThunkState; extra: SubmitYieldWithdrawThunkDeps }
>(
    `${YIELD_PREFIX}/thunk/submitWithdraw`,
    async ({ flowKey, flowData, amount, flowType }, { dispatch, getState, extra }) => {
        const reportSubmitError = (errorMessage = 'submit-failed') =>
            extra.services.analytics.report({
                type: events.yieldWithdrawEvent.name,
                payload: {
                    type: 'error',
                    operation: flowType,
                    action: 'continue',
                    networkSymbol: flowData.account.symbol,
                    vaultId: flowData.vault.id,
                    errorMessage,
                },
            });

        try {
            if (flowData.account.networkType !== 'ethereum') {
                throw new Error('Yield actions currently support only EVM accounts.');
            }

            dispatch(yieldActions.startSubmittingAction({ flowType, flowKey, amount }));

            const { account } = flowData;

            const composeResult = await dispatch(
                composeYieldWithdrawTransactionThunk({ flowData, amount, flowType }),
            ).unwrap();

            if (composeResult.type === 'error') {
                const isFeeError = isYieldWithdrawFeeError(composeResult.reason);

                reportSubmitError(isFeeError ? 'fee-estimation-failed' : 'submit-failed');
                dispatch(
                    yieldActions.setError({
                        flowType,
                        flowKey,
                        error: isFeeError
                            ? 'TR_EARN_YIELD_ERROR_FEE_ESTIMATION'
                            : 'TR_EARN_YIELD_ERROR_GENERIC',
                    }),
                );

                return;
            }

            const { unsignedTransaction } = composeResult;

            const userAcceptedTxSimulation = await dispatch(
                openDeferredModal({
                    type: 'earn-yield-tx-simulation',
                    data: {
                        flow: flowType,
                        unsignedTx: unsignedTransaction,
                        account,
                    } satisfies StablecoinYieldTxSimulationParams,
                }),
            );

            extra.services.analytics.report({
                type: events.yieldWithdrawEvent.name,
                payload: {
                    type: 'tx-simulation-modal',
                    operation: flowType,
                    action: userAcceptedTxSimulation?.value === false ? 'cancel' : 'continue',
                    networkSymbol: account.symbol,
                    vaultId: flowData.vault.id,
                },
            });

            if (userAcceptedTxSimulation?.value === false) {
                return;
            }

            const selectedFee = userAcceptedTxSimulation?.selectedFee ?? null;
            const reviewToken = flowType === 'redeem' ? flowData.receiptToken : flowData.token;

            const result = await sendYieldTransaction({
                account,
                amount,
                token: reviewToken,
                unsignedTransaction,
                flowKey,
                flowType,
                dispatch,
                getState,
                selectedFee,
            });

            userAcceptedTxSimulation?.resolve();

            if (!result) {
                extra.services.analytics.report({
                    type: events.yieldWithdrawEvent.name,
                    payload: {
                        type: 'error',
                        operation: flowType,
                        action: 'continue',
                        networkSymbol: account.symbol,
                        vaultId: flowData.vault.id,
                        errorMessage: 'submit-failed',
                    },
                });

                return;
            }

            dispatch(
                notificationsActions.addToast({
                    type: 'tx-yield-withdraw',
                    descriptor: account.descriptor,
                    symbol: account.symbol,
                    txid: result.txid,
                }),
            );

            dispatch(
                yieldActions.setPendingTx({
                    flowType,
                    flowKey,
                    tx: {
                        type: flowType,
                        txid: result.txid,
                        amount,
                    },
                }),
            );
        } catch (error) {
            console.error(error);
            reportSubmitError(getYieldSubmitErrorAnalyticsMessage(error));
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
