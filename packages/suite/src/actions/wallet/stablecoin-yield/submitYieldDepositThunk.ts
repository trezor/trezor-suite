import { asTypedDesktopAnalytics } from '@suite/analytics';
import { openDeferredModal } from '@suite/modal';
import { events } from '@suite-common/analytics';
import { type StablecoinYieldTxSimulationParams } from '@suite-common/earn-stablecoin/src/tx-simulation';
import { createThunk } from '@suite-common/redux-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import {
    STABLECOIN_YIELD_PREFIX,
    type YieldFlowResolvedData,
    composeYieldDepositTransactionThunk,
    getYieldDepositErrorTranslationKey,
    openYieldApproveModal,
    setYieldError,
    stablecoinYieldActions,
} from '@suite-common/wallet-core';

import {
    getYieldErrorTranslationKey,
    getYieldSubmitErrorAnalyticsMessage,
    sendYieldTransaction,
} from './signingHelpers';

type SubmitYieldDepositPayload = {
    flowKey: string;
    flowData: YieldFlowResolvedData;
    amount: string;
};

export const submitYieldDepositThunk = createThunk(
    `${STABLECOIN_YIELD_PREFIX}/thunk/submitDeposit`,
    async (
        { flowKey, flowData, amount }: SubmitYieldDepositPayload,
        { dispatch, getState, extra },
    ) => {
        const flowType = 'deposit' as const;

        try {
            dispatch(stablecoinYieldActions.startSubmittingAction({ flowType, flowKey, amount }));

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
                dispatch(stablecoinYieldActions.enterModifyMode({ flowType, flowKey }));
                dispatch(stablecoinYieldActions.setRevokeRequired({ flowType, flowKey }));

                return;
            }

            if (result.type === 'approval-required') {
                dispatch(stablecoinYieldActions.enterModifyMode({ flowType, flowKey }));

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

            asTypedDesktopAnalytics(extra.services.analytics).report({
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

            if (!sendResult) {
                asTypedDesktopAnalytics(extra.services.analytics).report({
                    type: events.yieldDepositEvent.name,
                    payload: {
                        type: 'error',
                        action: 'continue',
                        networkSymbol: flowData.account.symbol,
                        vaultId: flowData.vault.id,
                        errorMessage: 'submit-failed',
                    },
                });

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
                stablecoinYieldActions.setPendingTx({
                    flowType,
                    flowKey,
                    tx: {
                        type: flowType,
                        txid: sendResult.txid,
                        amount,
                    },
                    receiptAmount: result.receiptAmount,
                }),
            );
        } catch (error) {
            console.error(error);
            asTypedDesktopAnalytics(extra.services.analytics).report({
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
                stablecoinYieldActions.setError({
                    flowType,
                    flowKey,
                    error: getYieldErrorTranslationKey(error),
                }),
            );
        } finally {
            dispatch(stablecoinYieldActions.finishSubmittingAction({ flowType, flowKey }));
        }
    },
);
