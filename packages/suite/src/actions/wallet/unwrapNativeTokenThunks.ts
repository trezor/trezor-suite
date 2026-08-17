import { openDeferredModal } from '@suite/modal';
import { type AnalyticsDep, events } from '@suite-common/analytics';
import { type StablecoinYieldTxSimulationParams } from '@suite-common/earn-stablecoin';
import { createThunk } from '@suite-common/redux-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import {
    type ComposeYieldUnwrapTransactionThunkState,
    type YieldFlowDisplayToken,
    type YieldWithdrawFlowType,
    composeYieldUnwrapTransactionThunk,
} from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';

import {
    type SendYieldTransactionDeps,
    type SendYieldTransactionState,
    getYieldSubmitErrorAnalyticsMessage,
    sendYieldTransaction,
} from './stablecoin-yield/signingHelpers';

const UNWRAP_NATIVE_TOKEN_PREFIX = '@wallet/unwrap-native-token';

type UnwrapNativeTokenPayload = {
    account: Account;
    token: YieldFlowDisplayToken & { contractAddress: string };
    unwrapAmount: string;
    yieldFlow?: {
        flowKey: string;
        flowType: YieldWithdrawFlowType;
        vaultId?: string;
    };
};

type SubmitUnwrapNativeTokenThunkState = ComposeYieldUnwrapTransactionThunkState &
    SendYieldTransactionState;
type SubmitUnwrapNativeTokenThunkDeps = SendYieldTransactionDeps & {
    services: AnalyticsDep;
};

export const submitUnwrapNativeTokenThunk = createThunk<
    { txid: string } | undefined,
    UnwrapNativeTokenPayload,
    { state: SubmitUnwrapNativeTokenThunkState; extra: SubmitUnwrapNativeTokenThunkDeps }
>(
    `${UNWRAP_NATIVE_TOKEN_PREFIX}/submit`,
    async ({ account, token, unwrapAmount, yieldFlow }, { dispatch, getState, extra }) => {
        // An in-flow unwrap belongs to the withdraw funnel, so its failures are reported there
        // rather than as a standalone yield/unwrap. Only the broadcast unwrap transaction is
        // resolved by `useYieldPendingTransactionTracking`, so these pre-broadcast failures are the
        // withdraw event's only view of them and cannot double-count. The `unwrap-` prefix keeps
        // them apart from failures of the withdraw transaction itself.
        const reportError = (errorMessage: string) => {
            if (yieldFlow) {
                extra.services.analytics.report({
                    type: events.yieldWithdrawEvent.name,
                    payload: {
                        type: 'error',
                        action: 'continue',
                        operation: yieldFlow.flowType,
                        networkSymbol: account.symbol,
                        vaultId: yieldFlow.vaultId,
                        errorMessage: `unwrap-${errorMessage}`,
                    },
                });

                return;
            }

            extra.services.analytics.report({
                type: events.yieldUnwrapEvent.name,
                payload: {
                    type: 'error',
                    action: 'continue',
                    networkSymbol: account.symbol,
                    errorMessage,
                },
            });
        };

        try {
            const result = await dispatch(
                composeYieldUnwrapTransactionThunk({ account, token, unwrapAmount }),
            ).unwrap();

            if (result.type === 'error') {
                reportError(result.reason);
                dispatch(
                    notificationsActions.addToast({
                        type: 'sign-tx-error',
                        error: `Failed to compose unwrap transaction (${result.reason}).`,
                    }),
                );

                return undefined;
            }

            const userAcceptedTxSimulation = await dispatch(
                openDeferredModal({
                    type: 'earn-yield-tx-simulation',
                    data: {
                        flow: 'unwrap',
                        unsignedTx: result.unsignedTransaction,
                        account,
                    } satisfies StablecoinYieldTxSimulationParams,
                }),
            );

            if (!yieldFlow) {
                extra.services.analytics.report({
                    type: events.yieldUnwrapEvent.name,
                    payload: {
                        type: 'tx-simulation-modal',
                        action: userAcceptedTxSimulation?.value === false ? 'cancel' : 'continue',
                        networkSymbol: account.symbol,
                    },
                });
            }

            if (userAcceptedTxSimulation?.value === false) {
                return undefined;
            }

            const sendResult = await sendYieldTransaction({
                account,
                amount: unwrapAmount,
                token,
                unsignedTransaction: result.unsignedTransaction,
                flowKey: yieldFlow?.flowKey ?? 'standalone-unwrap-native',
                flowType: yieldFlow?.flowType ?? 'withdraw',
                dispatch,
                getState,
                selectedFee: userAcceptedTxSimulation?.selectedFee ?? null,
            });

            userAcceptedTxSimulation?.resolve();

            if (!sendResult) {
                reportError('submit-failed');

                return undefined;
            }

            if (!yieldFlow) {
                extra.services.analytics.report({
                    type: events.yieldUnwrapEvent.name,
                    payload: {
                        type: 'sent',
                        action: 'continue',
                        networkSymbol: account.symbol,
                    },
                });
            }

            dispatch(
                notificationsActions.addToast({
                    type: 'tx-unwrap',
                    isYieldFlowStep: !!yieldFlow,
                    descriptor: account.descriptor,
                    symbol: account.symbol,
                    txid: sendResult.txid,
                    formattedAmount: unwrapAmount,
                    metadata: {
                        send: {
                            symbol: account.symbol,
                            displaySymbol: token.symbol,
                            contractAddress: token.contractAddress,
                            amount: unwrapAmount,
                        },
                        receive: {
                            symbol: account.symbol,
                            displaySymbol: getNetworkDisplaySymbol(account.symbol),
                            amount: unwrapAmount,
                        },
                    },
                    style: { maxWidth: 'auto' },
                }),
            );

            return sendResult;
        } catch (error) {
            console.error(error);
            reportError(getYieldSubmitErrorAnalyticsMessage(error));
            dispatch(
                notificationsActions.addToast({
                    type: 'sign-tx-error',
                    error: error instanceof Error ? error.message : String(error),
                }),
            );

            return undefined;
        }
    },
);
