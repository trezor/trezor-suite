import { asTypedDesktopAnalytics, events } from '@suite/analytics';
import { openDeferredModal } from '@suite/modal';
import { type StablecoinYieldTxSimulationParams } from '@suite-common/earn-stablecoin/src/tx-simulation';
import { createThunk } from '@suite-common/redux-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import {
    STABLECOIN_YIELD_PREFIX,
    type YieldFlowResolvedData,
    type YieldWithdrawFlowType,
    stablecoinYieldActions,
} from '@suite-common/wallet-core';

import { composeYieldWithdrawTransaction } from './composeYieldWithdrawTransaction';
import { getYieldErrorTranslationKey, sendYieldTransaction } from './signingHelpers';

type SubmitYieldWithdrawPayload = {
    flowKey: string;
    flowData: YieldFlowResolvedData;
    amount: string;
    flowType: YieldWithdrawFlowType;
};

export const submitYieldWithdrawThunk = createThunk(
    `${STABLECOIN_YIELD_PREFIX}/thunk/submitWithdraw`,
    async (
        { flowKey, flowData, amount, flowType }: SubmitYieldWithdrawPayload,
        { dispatch, getState, extra },
    ) => {
        try {
            if (flowData.account.networkType !== 'ethereum') {
                throw new Error('Yield actions currently support only EVM accounts.');
            }

            dispatch(stablecoinYieldActions.startSubmittingAction({ flowType, flowKey, amount }));

            const { account } = flowData;

            const unsignedTransaction = await composeYieldWithdrawTransaction({
                account,
                flowData,
                amount,
                flowType,
                dispatch,
                getState,
            });

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

            asTypedDesktopAnalytics(extra.services.analytics).report({
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
                asTypedDesktopAnalytics(extra.services.analytics).report({
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
                stablecoinYieldActions.setPendingTx({
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
            asTypedDesktopAnalytics(extra.services.analytics).report({
                type: events.yieldWithdrawEvent.name,
                payload: {
                    type: 'error',
                    operation: flowType,
                    action: 'continue',
                    networkSymbol: flowData.account.symbol,
                    vaultId: flowData.vault.id,
                    errorMessage: 'submit-failed',
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
