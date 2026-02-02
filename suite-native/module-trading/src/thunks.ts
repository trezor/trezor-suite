import { isFulfilled, isRejected } from '@reduxjs/toolkit';

import { selectIsMevProtectionFeatureEnabled } from '@suite-common/mev';
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
    tradingActions as tradingCommonActions,
    tradingExchangeActions,
    tradingSellActions,
} from '@suite-common/trading';
import { Network } from '@suite-common/wallet-config';
import {
    composeSendFormTransactionFeeLevelsThunk,
    enhancePrecomposedTransactionThunk,
    formDraftActions,
    pushSendFormTransactionThunk,
    selectDeepCopyOfFormDraft,
    selectIsMevProtectionEnabled,
    sendFormActions,
    signTransactionThunk,
} from '@suite-common/wallet-core';
import {
    Account,
    FeeInfo,
    FeeLevelLabel,
    PrecomposedTransactionFinal,
    isFinalPrecomposedTransaction,
} from '@suite-common/wallet-types';
import { tryGetAccountIdentity } from '@suite-common/wallet-utils';
import { requestPrioritizedDeviceAccess } from '@suite-native/device-mutex';
import { getFormDraftKeyByTradeType } from '@suite-native/trading-state';
import {
    UpdateSelectedFeeLevelThunkParams,
    addTransactionLabelingThunk,
    transactionManagementActions,
} from '@suite-native/transaction-management';
import TrezorConnect from '@trezor/connect';

import { createFormStateForSendForm } from './utils';
import { getErrorStrFromThunkRejectedValue } from './utils/general/utils';

const NATIVE_TRADING_EXCHANGE_THUNK_PREFIX = 'trading/native';

export const clearTradingStateThunk = createThunk(
    `${NATIVE_TRADING_EXCHANGE_THUNK_PREFIX}/clearTradingState`,
    (_, { dispatch }) => {
        // Clear only selected quotes and transaction-related data
        dispatch(tradingExchangeActions.saveSelectedQuote(undefined));
        dispatch(tradingExchangeActions.saveTransactionId(undefined));
        dispatch(tradingSellActions.saveSelectedQuote(undefined));
        dispatch(tradingSellActions.saveTransactionId(undefined));

        // Clear composed transaction info
        dispatch(tradingCommonActions.saveComposedTransactionInfo({}));

        // Clear send form transaction state (precomposed, signed, serialized, ...)
        dispatch(sendFormActions.dispose());
        dispatch(transactionManagementActions.clearFeeLevels());

        // Clear form draft with selected fees
        dispatch(formDraftActions.removeDraft({ key: getFormDraftKeyByTradeType('sell') }));
        dispatch(formDraftActions.removeDraft({ key: getFormDraftKeyByTradeType('exchange') }));
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
            feeLimit,
            feePerUnit,
            isSlip24Active,
            maxPriorityFeePerGas,
            maxFeePerGas,
        }: {
            tradeType: TradingSellType | TradingExchangeType;
            account: Account;
            network: Network;
            feeInfo: FeeInfo | null;
            selectedFeeLevel?: FeeLevelLabel;
            feeLimit?: string;
            feePerUnit?: string;
            maxFeePerGas?: string;
            maxPriorityFeePerGas?: string;
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
                feeLevel: {
                    label: selectedFeeLevel,
                    feePerUnit: feePerUnit ?? '',
                    feeLimit: feeLimit ?? '',
                    maxFeePerGas: maxFeePerGas ?? '',
                    maxPriorityFeePerGas: maxPriorityFeePerGas ?? '',
                },
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
                dispatch(transactionManagementActions.storeFeeLevels({ feeLevels }));

                const selectedLevel = feeLevels[selectedFeeLevel];
                if (selectedLevel && isFinalPrecomposedTransaction(selectedLevel)) {
                    const composed = (await dispatch(
                        enhancePrecomposedTransactionThunk({
                            transactionFormValues: formState,
                            precomposedTransaction: selectedLevel as PrecomposedTransactionFinal,
                            selectedAccount: account,
                        }),
                    ).unwrap()) as PrecomposedTransactionFinal;

                    dispatch(
                        tradingCommonActions.saveComposedTransactionInfo({
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

                    const formDraftKey = getFormDraftKeyByTradeType(tradeType);

                    // Store the form state in trading draft so it's available for TradingFeesForm
                    dispatch(
                        formDraftActions.storeDraft({
                            key: formDraftKey,
                            formDraft: {
                                ...formState,
                                selectedFee: selectedFeeLevel,
                                feePerUnit: composed.feePerByte,
                                feeLimit: composed.feeLimit ?? '',
                            },
                        }),
                    );
                }

                return fulfillWithValue(response.payload);
            }

            const errStr = getErrorStrFromThunkRejectedValue(response);
            console.error('Failed to compose transaction:', errStr);

            return rejectWithValue(`Failed to compose transaction: ${errStr}`);
        } catch (error) {
            console.error('Compose trading transaction error:', error);

            return rejectWithValue(getErrorStrFromThunkRejectedValue(error));
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
        const deviceAccessResponse = await requestPrioritizedDeviceAccess(() =>
            dispatch(
                signTransactionThunk({
                    formState,
                    precomposedTransaction,
                    selectedAccount,
                    paymentRequests,
                }),
            ),
        );

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
        { dispatch, getState, rejectWithValue, fulfillWithValue },
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

        const isMevProtectionEnabled =
            selectIsMevProtectionEnabled(getState()) &&
            selectIsMevProtectionFeatureEnabled(getState());
        const pushResult = await dispatch(
            pushSendFormTransactionThunk({ selectedAccount, isMevProtectionEnabled }),
        );

        if (isRejected(pushResult)) {
            return rejectWithValue(pushResult.error);
        }

        dispatch(
            addTransactionLabelingThunk({
                txId: pushResult.payload.payload.txid,
                selectedAccount,
            }),
        );

        return fulfillWithValue({
            success: true,
            payload: pushResult.payload,
        });
    },
);

export const updateTradingSelectedFeeLevelThunk = createThunk(
    `${NATIVE_TRADING_EXCHANGE_THUNK_PREFIX}/updateSelectedFeeLevelThunk`,
    (
        {
            feeLevelLabel,
            feePerUnit,
            feeLimit,
            formDraftKey,
            maxPriorityFeePerGas,
            maxFeePerGas,
        }: UpdateSelectedFeeLevelThunkParams,
        { dispatch, getState },
    ) => {
        const key = formDraftKey ?? '';
        const formDraft = selectDeepCopyOfFormDraft(getState(), key);
        if (!formDraft) throw Error('Draft not found.');

        formDraft.selectedFee = feeLevelLabel;
        if (feePerUnit) {
            formDraft.feePerUnit = feePerUnit;
        }
        if (feeLimit) {
            formDraft.feeLimit = feeLimit;
        }
        if (maxFeePerGas) {
            formDraft.maxFeePerGas = maxFeePerGas;
        }
        if (maxPriorityFeePerGas) {
            formDraft.maxPriorityFeePerGas = maxPriorityFeePerGas;
        }

        dispatch(formDraftActions.storeDraft({ key, formDraft }));
    },
);
