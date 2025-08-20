import { isFulfilled, isRejected } from '@reduxjs/toolkit';

import { createThunk } from '@suite-common/redux-utils';
import {
    TradingExchangeType,
    TradingSellType,
    TradingSignAndPushSendFormTransactionProps,
    selectTradingExchangeProviders,
    selectTradingExchangeReceiveAccountKey,
    selectTradingExchangeSelectedQuote,
    selectTradingSellProviders,
    selectTradingSellSelectedQuote,
    tradingActions,
    tradingExchangeActions,
    tradingSellActions,
} from '@suite-common/trading';
import { Network } from '@suite-common/wallet-config';
import {
    composeSendFormTransactionFeeLevelsThunk,
    enhancePrecomposedTransactionThunk,
    pushSendFormTransactionThunk,
    sendFormActions,
    signTransactionThunk,
} from '@suite-common/wallet-core';
import { Account, FeeInfo, PrecomposedTransactionFinal } from '@suite-common/wallet-types';
import { tryGetAccountIdentity } from '@suite-common/wallet-utils';
import { requestPrioritizedDeviceAccess } from '@suite-native/device-mutex';
import { NativeSupportedFeeLevel, storeFeeLevels } from '@suite-native/transaction-management';
import TrezorConnect from '@trezor/connect';

import { createFormStateForSendForm } from './utils';

const NATIVE_TRADING_EXCHANGE_THUNK_PREFIX = 'trading/native';

export const clearTradingStateThunk = createThunk(
    `${NATIVE_TRADING_EXCHANGE_THUNK_PREFIX}/clearTradingState`,
    (_, { dispatch }) => {
        // Clear only selected quotes and transaction-related data
        dispatch(tradingExchangeActions.saveSelectedQuote(undefined));
        dispatch(tradingSellActions.saveSelectedQuote(undefined));

        // Clear composed transaction info
        dispatch(tradingActions.saveComposedTransactionInfo({}));

        // Clear send form transaction state (precomposed, signed, serialized)
        dispatch(sendFormActions.discardTransaction());
    },
);

export const pushTradingTxnThunk = createThunk(
    `${NATIVE_TRADING_EXCHANGE_THUNK_PREFIX}/pushTransaction`,
    async (
        {
            serializedTx,
            account,
        }: {
            serializedTx: string;
            account: Account;
        },
        { rejectWithValue, fulfillWithValue },
    ) => {
        try {
            const pushTxResponse = await TrezorConnect.pushTransaction({
                tx: serializedTx,
                coin: account.symbol,
                identity: tryGetAccountIdentity(account),
            });

            if (!pushTxResponse.success) {
                return rejectWithValue(pushTxResponse.payload ?? 'Push transaction failed');
            }

            return fulfillWithValue(pushTxResponse);
        } catch (error) {
            console.error('Push trading transaction error:', error);

            return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
        }
    },
);

export const composeTradingTransactionThunk = createThunk(
    `${NATIVE_TRADING_EXCHANGE_THUNK_PREFIX}/composeTransaction`,
    async (
        {
            tradeType,
            account,
            network,
            feeInfo,
            selectedFeeLevel = 'normal',
            isSlip24Active,
        }: {
            tradeType: TradingSellType | TradingExchangeType;
            account: Account;
            network: Network;
            feeInfo: FeeInfo | null;
            selectedFeeLevel?: NativeSupportedFeeLevel;
            isSlip24Active?: boolean;
        },
        { dispatch, getState, rejectWithValue, fulfillWithValue },
    ) => {
        try {
            const selectedQuote =
                tradeType === 'exchange'
                    ? selectTradingExchangeSelectedQuote(getState())
                    : selectTradingSellSelectedQuote(getState());
            const providers =
                tradeType === 'exchange'
                    ? (selectTradingExchangeProviders(getState()) ?? {})
                    : (selectTradingSellProviders(getState()) ?? {});

            const receiveAccountKey =
                tradeType === 'exchange'
                    ? selectTradingExchangeReceiveAccountKey(getState())
                    : undefined;

            if (!selectedQuote) {
                return rejectWithValue('No selected quote found');
            }

            if (!network || !feeInfo) {
                return rejectWithValue('Network and feeInfo are required');
            }

            const formState = createFormStateForSendForm({
                quote: selectedQuote,
                providers,
                feeLevel: { label: selectedFeeLevel, feePerUnit: '' },
                isSlip24Active,
                sendAccountKey: account.key,
                receiveAccountKey,
            });

            const response = await dispatch(
                composeSendFormTransactionFeeLevelsThunk({
                    formState,
                    composeContext: {
                        account,
                        network,
                        feeInfo,
                    },
                }),
            );

            if (isFulfilled(response)) {
                const feeLevels = response.payload;
                dispatch(storeFeeLevels({ feeLevels }));

                const composed = (await dispatch(
                    enhancePrecomposedTransactionThunk({
                        transactionFormValues: formState,
                        precomposedTransaction: feeLevels[
                            selectedFeeLevel
                        ] as PrecomposedTransactionFinal,
                        selectedAccount: account,
                    }),
                ).unwrap()) as PrecomposedTransactionFinal;

                if (composed && composed.type === 'final') {
                    dispatch(
                        tradingActions.saveComposedTransactionInfo({
                            selectedFee: selectedFeeLevel,
                            composed: {
                                fee: composed.fee,
                                feePerByte: composed.feePerByte,
                                feeLimit: composed.feeLimit,
                                estimatedFeeLimit: composed.estimatedFeeLimit,
                                maxFeePerGas: composed.maxFeePerGas,
                                maxPriorityFeePerGas: composed.maxPriorityFeePerGas,
                                token: composed.token,
                            },
                        }),
                    );
                }

                return fulfillWithValue(response.payload);
            }

            return rejectWithValue(`Failed to compose transaction: ${response.error}`);
        } catch (error) {
            console.error('Compose trading transaction error:', error);

            return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
        }
    },
);

export const signTradingTransactionThunk = createThunk(
    `${NATIVE_TRADING_EXCHANGE_THUNK_PREFIX}/signTransaction`,
    async (
        {
            formState,
            precomposedTransaction,
            selectedAccount,
            paymentRequests,
        }: TradingSignAndPushSendFormTransactionProps,
        { dispatch, rejectWithValue, fulfillWithValue },
    ) => {
        const deviceAccessResponse = await requestPrioritizedDeviceAccess({
            deviceCallback: () =>
                dispatch(
                    signTransactionThunk({
                        formState,
                        precomposedTransaction,
                        selectedAccount,
                        paymentRequests,
                    }),
                ),
        });

        if (!deviceAccessResponse.success) {
            return rejectWithValue({
                error: 'sign-transaction-failed',
                message: 'Prioritized device access failed.',
            });
        }

        const signTransactionResponse = deviceAccessResponse.payload;

        if (isRejected(signTransactionResponse)) {
            return rejectWithValue(signTransactionResponse.payload);
        }

        return fulfillWithValue(signTransactionResponse.payload.signedTx);
    },
);

export const signAndPushSendFormTransactionThunk = createThunk(
    `${NATIVE_TRADING_EXCHANGE_THUNK_PREFIX}/signAndPushSendFormTransaction`,
    async (
        {
            formState,
            precomposedTransaction,
            selectedAccount,
            paymentRequests,
            waitForPushApprovalPromise,
        }: TradingSignAndPushSendFormTransactionProps & {
            waitForPushApprovalPromise: () => Promise<boolean>;
        },
        { dispatch, rejectWithValue, fulfillWithValue },
    ) => {
        const signResult = await dispatch(
            signTradingTransactionThunk({
                formState,
                precomposedTransaction,
                selectedAccount,
                paymentRequests,
            }),
        );

        if (isRejected(signResult)) {
            return rejectWithValue(signResult.error);
        }

        // We need to wait until the user approves sending the transaction before pushing it
        const pushApproval = await waitForPushApprovalPromise();

        if (!pushApproval) {
            return rejectWithValue('Push approval not received');
        }

        const pushResult = await dispatch(
            pushSendFormTransactionThunk({
                selectedAccount,
            }),
        );

        if (isRejected(pushResult)) {
            return rejectWithValue(pushResult.error);
        }

        // Return the expected TradingFulfillValue format
        return fulfillWithValue({
            success: true,
            payload: pushResult.payload,
        });
    },
);
