import { asTypedDesktopAnalytics, events } from '@suite/analytics';
import { openDeferredModal } from '@suite/modal';
import { type StablecoinYieldTxSimulationParams } from '@suite-common/earn-stablecoin/src/tx-simulation';
import { createThunk } from '@suite-common/redux-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import {
    WRAPPED_NATIVE_TOKEN_DECIMALS,
    getNetworkDisplaySymbol,
} from '@suite-common/wallet-config';
import {
    STABLECOIN_YIELD_PREFIX,
    type YieldFlowDisplayToken,
    type YieldFlowResolvedData,
    setYieldGenericError,
    stablecoinYieldActions,
} from '@suite-common/wallet-core';

import { composeYieldWrapTransaction } from './composeYieldWrapTransaction';
import { sendYieldTransaction } from './signingHelpers';

type SubmitYieldWrapPayload = {
    flowKey: string;
    flowData: YieldFlowResolvedData;
    /** Native coin amount to wrap — the value carried by the transaction. */
    wrapAmount: string;
    /** Held WETH + wrapAmount — the deposit total the approve step is prefilled with. */
    totalDepositAmount: string;
};

export const submitYieldWrapThunk = createThunk(
    `${STABLECOIN_YIELD_PREFIX}/thunk/submitWrap`,
    async (
        { flowKey, flowData, wrapAmount, totalDepositAmount }: SubmitYieldWrapPayload,
        { dispatch, getState, extra },
    ) => {
        const flowType = 'deposit' as const;

        try {
            if (flowData.account.networkType !== 'ethereum') {
                throw new Error('Yield actions currently support only EVM accounts.');
            }

            dispatch(
                stablecoinYieldActions.startSubmittingWrap({
                    flowType,
                    flowKey,
                    amount: totalDepositAmount,
                }),
            );

            const { account } = flowData;

            const unsignedTransaction = await composeYieldWrapTransaction({
                account,
                flowData,
                wrapAmount,
                dispatch,
                getState,
            });

            const userAcceptedTxSimulation = await dispatch(
                openDeferredModal({
                    type: 'earn-yield-tx-simulation',
                    data: {
                        flow: 'wrap',
                        unsignedTx: unsignedTransaction,
                        account,
                    } satisfies StablecoinYieldTxSimulationParams,
                }),
            );

            asTypedDesktopAnalytics(extra.services.analytics).report({
                type: events.yieldDepositEvent.name,
                payload: {
                    type: 'tx-simulation-modal',
                    action: userAcceptedTxSimulation?.value === false ? 'cancel' : 'continue',
                    networkSymbol: account.symbol,
                    vaultId: flowData.vault.id,
                },
            });

            if (userAcceptedTxSimulation?.value === false) {
                return;
            }

            const selectedFee = userAcceptedTxSimulation?.selectedFee ?? null;

            // No contract address — the wrapped amount is spent as native value,
            // which makes the review modal compute totalSpent = amount + fee.
            const nativeDisplayToken: YieldFlowDisplayToken = {
                networkSymbol: account.symbol,
                symbol: getNetworkDisplaySymbol(account.symbol),
                // Pin to the wrapped-native decimals the wrap value was built with,
                // rather than trusting remote vault-token metadata.
                decimals: WRAPPED_NATIVE_TOKEN_DECIMALS,
                contractAddress: null,
            };

            const result = await sendYieldTransaction({
                account,
                amount: wrapAmount,
                token: nativeDisplayToken,
                unsignedTransaction,
                dispatch,
                getState,
                selectedFee,
            });

            userAcceptedTxSimulation?.resolve();

            if (!result) {
                asTypedDesktopAnalytics(extra.services.analytics).report({
                    type: events.yieldDepositEvent.name,
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
                    type: 'tx-yield-wrap',
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
                        type: 'wrap',
                        txid: result.txid,
                        amount: wrapAmount,
                    },
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
                    errorMessage: 'submit-failed',
                },
            });
            setYieldGenericError({ dispatch, flowType, flowKey });
        } finally {
            dispatch(stablecoinYieldActions.finishSubmittingWrap({ flowType, flowKey }));
        }
    },
);
