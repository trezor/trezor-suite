import { type AnalyticsDep, events } from '@suite-common/analytics';
import { selectSelectedDevice } from '@suite-common/device';
import { notificationsActions } from '@suite-common/toast-notifications';
import { getNetwork, getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import {
    type ComposeYieldWrapTransactionThunkState,
    type YieldFlowDisplayToken,
    composeYieldWrapTransactionThunk,
    setYieldError,
    transactionsActions,
} from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { type TokenInfo } from '@trezor/connect';
import { createThunk } from '@trezor/redux-utils';

import {
    type SendEvmTransactionDeps,
    type SendEvmTransactionState,
    isEvmBroadcastError,
    openEvmTransactionSimulationThunk,
    sendEvmTokenTransaction,
} from './evmTransaction';
import {
    getYieldDeviceErrorMessage,
    getYieldErrorTranslationKey,
    getYieldSubmitErrorAnalyticsMessage,
} from './stablecoin-yield/signingHelpers';
import { addToken } from './tokenActions';

const WRAP_NATIVE_TOKEN_PREFIX = '@wallet/wrap-native-token';

type WrapNativeTokenPayload = {
    account: Account;
    token: YieldFlowDisplayToken & { contractAddress: string };
    wrapAmount: string;
    yieldFlow?: {
        flowKey: string;
        flowType: 'deposit';
        vaultId?: string;
    };
};

type SubmitWrapNativeTokenThunkState = ComposeYieldWrapTransactionThunkState &
    SendEvmTransactionState;

type SubmitWrapNativeTokenThunkDeps = SendEvmTransactionDeps & {
    services: AnalyticsDep;
};

export const submitWrapNativeTokenThunk = createThunk<
    { txid: string; fee: string } | undefined,
    WrapNativeTokenPayload,
    { state: SubmitWrapNativeTokenThunkState; extra: SubmitWrapNativeTokenThunkDeps }
>(
    `${WRAP_NATIVE_TOKEN_PREFIX}/submit`,
    async ({ account, token, wrapAmount, yieldFlow }, { dispatch, getState, extra }) => {
        const device = selectSelectedDevice(getState());
        // An in-flow wrap belongs to the deposit funnel, so its failures are reported there rather
        // than as a standalone yield/wrap. Only the broadcast wrap transaction is resolved by
        // `useYieldPendingTransactionTracking`, so these pre-broadcast failures are the deposit
        // event's only view of them and cannot double-count. The `wrap-` prefix keeps them apart
        // from failures of the deposit transaction itself.
        const reportError = (errorMessage: string) => {
            if (yieldFlow) {
                extra.services.analytics.report({
                    type: events.yieldDepositEvent.name,
                    payload: {
                        type: 'error',
                        action: 'continue',
                        networkSymbol: account.symbol,
                        vaultId: yieldFlow.vaultId,
                        errorMessage: `wrap-${errorMessage}`,
                    },
                });

                return;
            }

            extra.services.analytics.report({
                type: events.yieldWrapEvent.name,
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
                composeYieldWrapTransactionThunk({ account, token, wrapAmount }),
            ).unwrap();

            if (result.type === 'error') {
                reportError(result.reason);
                dispatch(
                    notificationsActions.addToast({
                        type: 'sign-tx-error',
                        error: `Failed to compose wrap transaction (${result.reason}).`,
                    }),
                );

                // A wrap started from the deposit flow needs the failure on the step itself; the
                // toast alone leaves the flow looking idle.
                if (yieldFlow) {
                    setYieldError({ dispatch, ...yieldFlow });
                }

                return undefined;
            }

            const userAcceptedTxSimulation = await dispatch(
                openEvmTransactionSimulationThunk(
                    {
                        flow: 'wrap',
                        unsignedTx: result.unsignedTransaction,
                        account,
                    },
                    device,
                ),
            );

            if (userAcceptedTxSimulation === undefined) {
                return undefined;
            }

            if (!yieldFlow) {
                extra.services.analytics.report({
                    type: events.yieldWrapEvent.name,
                    payload: {
                        type: 'tx-simulation-modal',
                        action: userAcceptedTxSimulation.value === false ? 'cancel' : 'continue',
                        networkSymbol: account.symbol,
                    },
                });
            }

            if (userAcceptedTxSimulation.value === false) {
                return undefined;
            }

            const network = getNetwork(account.symbol);

            const sendResult = await sendEvmTokenTransaction({
                account,
                amount: wrapAmount,
                token: {
                    networkSymbol: account.symbol,
                    symbol: getNetworkDisplaySymbol(account.symbol),
                    decimals: network.decimals,
                    contractAddress: null,
                },
                unsignedTransaction: result.unsignedTransaction,
                yieldFlow,
                device,
                txType: 'yield',
                simulation: userAcceptedTxSimulation,
                dispatch,
                getState,
            });

            if (sendResult.status === 'cancelled') {
                extra.services.analytics.report({
                    type: events.transactionCancelEvent.name,
                    payload: {
                        txType: 'yield',
                        networkSymbol: account.symbol,
                        stage: sendResult.stage,
                    },
                });

                return undefined;
            }

            dispatch(
                transactionsActions.transactionBroadcastStatus({
                    account,
                    flow: 'wrap',
                    status: 'success',
                    txid: sendResult.txid,
                }),
            );

            if (!yieldFlow) {
                extra.services.analytics.report({
                    type: events.yieldWrapEvent.name,
                    payload: {
                        type: 'sent',
                        action: 'continue',
                        networkSymbol: account.symbol,
                    },
                });
            }

            // Make sure re-wrapping doesn't create a duplicate
            const isAlreadyTracked = account.tokens?.some(
                accountToken =>
                    accountToken.contract.toLowerCase() === token.contractAddress.toLowerCase(),
            );

            if (!isAlreadyTracked) {
                const wrappedTokenInfo: TokenInfo = {
                    // Only affects symbol casing (both ERC20 and BEP20 preserve it); the real
                    // standard/balance are filled in by the next backend account refresh.
                    standard: 'ERC20',
                    contract: token.contractAddress,
                    symbol: token.symbol,
                    name: token.symbol,
                    decimals: token.decimals,
                    balance: '0',
                };

                dispatch(addToken(account, [wrappedTokenInfo], { showSuccessToast: false }));
            }

            dispatch(
                notificationsActions.addToast({
                    type: 'tx-wrap',
                    isYieldFlowStep: !!yieldFlow,
                    descriptor: account.descriptor,
                    symbol: account.symbol,
                    txid: sendResult.txid,
                    amount: wrapAmount,
                    metadata: {
                        send: {
                            symbol: account.symbol,
                            displaySymbol: getNetworkDisplaySymbol(account.symbol),
                            amount: wrapAmount,
                        },
                        receive: {
                            symbol: account.symbol,
                            displaySymbol: token.symbol,
                            contractAddress: token.contractAddress,
                            amount: wrapAmount,
                        },
                    },
                    style: { maxWidth: 'auto' },
                }),
            );

            return { txid: sendResult.txid, fee: sendResult.fee };
        } catch (error) {
            if (isEvmBroadcastError(error)) {
                dispatch(
                    transactionsActions.transactionBroadcastStatus({
                        account,
                        flow: 'wrap',
                        status: 'error',
                    }),
                );
            }
            console.error(error);
            reportError(getYieldSubmitErrorAnalyticsMessage(error));
            const deviceError = getYieldDeviceErrorMessage(error);
            dispatch(
                notificationsActions.addToast({
                    type: 'sign-tx-error',
                    error: deviceError ?? (error instanceof Error ? error.message : String(error)),
                }),
            );
            // Same reasoning as the compose failure above. A push failure in particular means the
            // transaction was already signed, which is worth saying rather than leaving the step
            // looking idle.
            if (yieldFlow && !deviceError) {
                setYieldError({
                    dispatch,
                    ...yieldFlow,
                    error: getYieldErrorTranslationKey(error),
                });
            }

            return undefined;
        }
    },
);
