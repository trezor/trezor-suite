import { openDeferredModal } from '@suite/modal';
import { type AnalyticsDep, events } from '@suite-common/analytics';
import { type StablecoinYieldTxSimulationParams } from '@suite-common/earn-stablecoin';
import { notificationsActions } from '@suite-common/toast-notifications';
import { type TokenAddress } from '@suite-common/tokens';
import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import {
    type ComposeYieldWrapTransactionThunkState,
    type YieldFlowDisplayToken,
    composeYieldWrapTransactionThunk,
    setYieldError,
    transactionsActions,
} from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { type TokenInfo } from '@trezor/connect';
import { getWrappedNativeToken } from '@trezor/network-ethereum-suite-common';
import { createThunk } from '@trezor/redux-utils';

import {
    type SendYieldTransactionDeps,
    type SendYieldTransactionState,
    getYieldErrorTranslationKey,
    getYieldSubmitErrorAnalyticsMessage,
    isYieldPushError,
    sendYieldTransaction,
} from './stablecoin-yield/signingHelpers';
import { addToken } from './tokenActions';

const WRAP_NATIVE_TOKEN_PREFIX = '@wallet/wrap-native-token';

type WrapNativeTokenPayload = {
    account: Account;
    token: YieldFlowDisplayToken & { contractAddress: TokenAddress };
    wrapAmount: string;
    yieldFlow?: {
        flowKey: string;
        flowType: 'deposit';
        vaultId?: string;
    };
};

type SubmitWrapNativeTokenThunkState = ComposeYieldWrapTransactionThunkState &
    SendYieldTransactionState;

type SubmitWrapNativeTokenThunkDeps = SendYieldTransactionDeps & {
    services: AnalyticsDep;
};

export const submitWrapNativeTokenThunk = createThunk<
    { txid: string; fee: string } | undefined,
    WrapNativeTokenPayload,
    { state: SubmitWrapNativeTokenThunkState; extra: SubmitWrapNativeTokenThunkDeps }
>(
    `${WRAP_NATIVE_TOKEN_PREFIX}/submit`,
    async ({ account, token, wrapAmount, yieldFlow }, { dispatch, getState, extra }) => {
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
                openDeferredModal({
                    type: 'earn-yield-tx-simulation',
                    data: {
                        flow: 'wrap',
                        unsignedTx: result.unsignedTransaction,
                        account,
                    } satisfies StablecoinYieldTxSimulationParams,
                }),
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

            // The wrap sends the native coin, so the transaction moves no token.
            const sendResult = await sendYieldTransaction({
                account,
                amount: wrapAmount,
                unsignedTransaction: result.unsignedTransaction,
                flowKey: yieldFlow?.flowKey ?? 'standalone-wrap-native',
                flowType: yieldFlow?.flowType ?? 'deposit',
                dispatch,
                getState,
                selectedFee: userAcceptedTxSimulation.selectedFee,
                selectedFeeLevel: userAcceptedTxSimulation.selectedFeeLevel,
            });

            userAcceptedTxSimulation.resolve();

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

            // Tracking the token and the toast describe WETH as text, so its catalog entry supplies
            // the symbol and decimals; the compose step has checked the contract.
            const wrappedNative = getWrappedNativeToken(account.symbol);

            if (!isAlreadyTracked && wrappedNative) {
                const wrappedTokenInfo: TokenInfo = {
                    // Only affects symbol casing (both ERC20 and BEP20 preserve it); the real
                    // standard/balance are filled in by the next backend account refresh.
                    standard: 'ERC20',
                    contract: token.contractAddress,
                    symbol: wrappedNative.symbol,
                    name: wrappedNative.symbol,
                    decimals: wrappedNative.decimals,
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
                            displaySymbol: wrappedNative?.symbol ?? '',
                            contractAddress: token.contractAddress,
                            amount: wrapAmount,
                        },
                    },
                    style: { maxWidth: 'auto' },
                }),
            );

            return { txid: sendResult.txid, fee: sendResult.fee };
        } catch (error) {
            if (isYieldPushError(error)) {
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
            dispatch(
                notificationsActions.addToast({
                    type: 'sign-tx-error',
                    error: error instanceof Error ? error.message : String(error),
                }),
            );
            // Same reasoning as the compose failure above. A push failure in particular means the
            // transaction was already signed, which is worth saying rather than leaving the step
            // looking idle.
            if (yieldFlow) {
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
