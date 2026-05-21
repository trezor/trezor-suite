import { asTypedDesktopAnalytics, events } from '@suite/analytics';
import { openDeferredModal } from '@suite/modal';
import { type StablecoinYieldTxSimulationParams } from '@suite-common/earn-stablecoin/src/tx-simulation';
import { createThunk } from '@suite-common/redux-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import {
    STABLECOIN_YIELD_PREFIX,
    type YieldFlowResolvedData,
    type YieldWithdrawInputUnit,
    setYieldGenericError,
    stablecoinYieldActions,
} from '@suite-common/wallet-core';

import { composeYieldWithdrawTransaction } from './composeYieldWithdrawTransaction';
import { sendYieldTransaction } from './signingHelpers';

type SubmitYieldWithdrawPayload = {
    flowKey: string;
    flowData: YieldFlowResolvedData;
    amount: string;
    withdrawInputUnit?: YieldWithdrawInputUnit;
};

export const submitYieldWithdrawThunk = createThunk(
    `${STABLECOIN_YIELD_PREFIX}/thunk/submitWithdraw`,
    async (
        { flowKey, flowData, amount, withdrawInputUnit = 'asset' }: SubmitYieldWithdrawPayload,
        { dispatch, getState, extra },
    ) => {
        const flowType = 'withdraw' as const;

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
                withdrawInputUnit,
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
                    type: 'simulation-modal',
                    action: userAcceptedTxSimulation?.value === false ? 'cancel' : 'continue',
                    networkSymbol: account.symbol,
                    vaultId: flowData.vault.id,
                },
            });

            if (userAcceptedTxSimulation?.value === false) {
                return;
            }

            const selectedFee = userAcceptedTxSimulation?.selectedFee ?? null;
            const vaultName = flowData.vault.outputToken?.name ?? flowData.vault.metadata.name;
            const isSharesInput = withdrawInputUnit === 'shares';
            const reviewToken = isSharesInput ? flowData.receiptToken : flowData.token;
            const reviewFlowType = isSharesInput ? 'redeem' : 'withdraw';

            const result = await sendYieldTransaction({
                account,
                amount,
                token: reviewToken,
                unsignedTransaction,
                flowType: reviewFlowType,
                vaultName,
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
                    action: 'continue',
                    networkSymbol: flowData.account.symbol,
                    vaultId: flowData.vault.id,
                    errorMessage: 'submit-failed',
                },
            });
            setYieldGenericError({ dispatch, flowType, flowKey });
        } finally {
            dispatch(stablecoinYieldActions.finishSubmittingAction({ flowType, flowKey }));
        }
    },
);
