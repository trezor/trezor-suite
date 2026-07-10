import { asTypedDesktopAnalytics, events } from '@suite/analytics';
import { openDeferredModal } from '@suite/modal';
import { type StablecoinYieldTxSimulationParams } from '@suite-common/earn-stablecoin/src/tx-simulation';
import { createThunk } from '@suite-common/redux-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import {
    WRAPPED_NATIVE_TOKEN_DECIMALS,
    getWrappedNativeAddress,
    isWrappedNativeToken,
} from '@suite-common/wallet-config';
import {
    STABLECOIN_YIELD_PREFIX,
    type YieldFlowDisplayToken,
    type YieldFlowResolvedData,
    type YieldWithdrawFlowType,
    stablecoinYieldActions,
} from '@suite-common/wallet-core';
import { BigNumber } from '@trezor/utils';

import { getYieldErrorTranslationKey, sendYieldTransaction } from './signingHelpers';
import { composeWethUnwrapTransaction } from '../weth/composeWethUnwrapTransaction';

type SubmitYieldUnwrapPayload = {
    flowKey: string;
    flowType: YieldWithdrawFlowType;
    flowData: YieldFlowResolvedData;
    /** Wrapped-native amount to unwrap — the withdrawn amount by default. */
    unwrapAmount: string;
};

export const submitYieldUnwrapThunk = createThunk(
    `${STABLECOIN_YIELD_PREFIX}/thunk/submitUnwrap`,
    async (
        { flowKey, flowType, flowData, unwrapAmount }: SubmitYieldUnwrapPayload,
        { dispatch, getState, extra },
    ) => {
        try {
            if (flowData.account.networkType !== 'ethereum') {
                throw new Error('Yield actions currently support only EVM accounts.');
            }

            dispatch(stablecoinYieldActions.startSubmittingUnwrap({ flowType, flowKey }));

            const { account } = flowData;
            const wethAddress = getWrappedNativeAddress(account.symbol);

            if (!wethAddress) {
                throw new Error(`Network ${account.symbol} has no wrapped native token.`);
            }

            const wethToken = account.tokens?.find(token =>
                isWrappedNativeToken(account.symbol, token.contract),
            );
            // The withdrawn amount can exceed the refreshed balance by vault rounding
            // dust — never try to unwrap more than the account actually holds.
            const amount = BigNumber.min(
                unwrapAmount,
                wethToken?.balance ?? unwrapAmount,
            ).toString();

            const unsignedTransaction = await composeWethUnwrapTransaction({
                account,
                amount,
                dispatch,
                getState,
            });

            const userAcceptedTxSimulation = await dispatch(
                openDeferredModal({
                    type: 'earn-yield-tx-simulation',
                    data: {
                        flow: 'unwrap',
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

            const wethDisplayToken: YieldFlowDisplayToken = {
                networkSymbol: account.symbol,
                symbol: wethToken?.symbol ?? 'WETH',
                // Pinned like the wrap value — never scaled by remote token metadata.
                decimals: WRAPPED_NATIVE_TOKEN_DECIMALS,
                contractAddress: wethAddress,
            };

            const result = await sendYieldTransaction({
                account,
                amount,
                token: wethDisplayToken,
                unsignedTransaction,
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
                    type: 'tx-yield-unwrap',
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
                        type: 'unwrap',
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
            dispatch(stablecoinYieldActions.finishSubmittingUnwrap({ flowType, flowKey }));
        }
    },
);
