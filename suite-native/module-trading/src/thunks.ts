import { isFulfilled, isRejected } from '@reduxjs/toolkit';
import { type DexApprovalType, type ExchangeTrade } from 'invity-api';

import { Calldata } from '@suite-common/calldata';
import {
    type MevProtectionRootState,
    selectIsMevProtectionFeatureEnabled,
} from '@suite-common/mev';
import { createThunk } from '@suite-common/redux-utils';
import {
    type TradingExchangeType,
    type TradingSellType,
    type TradingSignAndPushSendFormTransactionProps,
    parseCryptoId,
    selectTradingExchangeProviders,
    selectTradingExchangeReceiveAccountKey,
    selectTradingExchangeSelectedQuote,
    selectTradingSellProviders,
    selectTradingSellSelectedQuote,
    tradingBuyActions,
    tradingActions as tradingCommonActions,
    tradingExchangeActions,
    tradingSellActions,
} from '@suite-common/trading';
import { type Network } from '@suite-common/wallet-config';
import {
    type ComposeSendFormTransactionFeeLevelsThunkState,
    type EnhancePrecomposedTransactionThunkState,
    type FormDraftRootState,
    type PushSendFormTransactionThunkDeps,
    type PushSendFormTransactionThunkState,
    type SignTransactionError,
    type SignTransactionThunkState,
    type SignTransactionTimeoutError,
    composeAllowanceTransactionThunk,
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
    type Account,
    type FeeInfo,
    type FeeLevelLabel,
    type PrecomposedLevels,
    type PrecomposedLevelsCardano,
    type PrecomposedTransactionFinal,
    isFinalPrecomposedTransaction,
} from '@suite-common/wallet-types';
import {
    buildApprovalTransactionData,
    getAllowanceAmount,
    tryGetAccountIdentity,
} from '@suite-common/wallet-utils';
import { requestPrioritizedDeviceAccess } from '@suite-native/device-mutex';
import { type TokensRootState, selectAccountTokenInfo } from '@suite-native/tokens';
import { getErrorStrFromThunkRejectedValue } from '@suite-native/trading-quote-utils';
import { type TradingRootState, getFormDraftKeyByTradeType } from '@suite-native/trading-state';
import {
    type AddTransactionLabelingThunkDeps,
    type AddTransactionLabelingThunkState,
    type UpdateSelectedFeeLevelThunkParams,
    addTransactionLabelingThunk,
    transactionManagementActions,
} from '@suite-native/transaction-management';
import { type BlockbookTransaction } from '@trezor/blockchain-link-types';
import TrezorConnect from '@trezor/connect';
import { type SerializedError } from '@trezor/connect-common/src/constants/errors';
import { type Ok } from '@trezor/type-utils';

import { createFormStateForSendForm } from './utils';
import { getTradingFormDraftFeeLimit } from './utils/getTradingFormDraftFeeLimit';

const NATIVE_TRADING_EXCHANGE_THUNK_PREFIX = 'trading/native';

export const clearTradingStateThunk = createThunk<void, void, void>(
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

        // Clear last error messages
        dispatch(tradingSellActions.setLastErrorMessage(undefined));
        dispatch(tradingExchangeActions.setLastErrorMessage(undefined));
        dispatch(tradingBuyActions.setLastErrorMessage(undefined));
    },
);

type PushTradingTxnThunkParams = {
    serializedTx: string;
    account: Account;
};

export const pushTradingTxnThunk = createThunk<
    Ok<{ txid: string }>,
    PushTradingTxnThunkParams,
    { rejectValue: SerializedError | string }
>(
    `${NATIVE_TRADING_EXCHANGE_THUNK_PREFIX}/pushTransaction`,
    async ({ serializedTx, account }, { rejectWithValue, fulfillWithValue }) => {
        try {
            const pushTxResponse = await TrezorConnect.pushTransaction({
                tx: serializedTx,
                coin: account.symbol,
                identity: tryGetAccountIdentity(account),
            });

            if (!pushTxResponse.success) {
                return rejectWithValue(pushTxResponse.error ?? 'Push transaction failed');
            }

            return fulfillWithValue(pushTxResponse);
        } catch (error) {
            console.error('Push trading transaction error:', error);

            return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
        }
    },
);

type ComposeTradingTransactionThunkParams = {
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
};

export type ComposeTradingTransactionThunkState = TradingRootState &
    ComposeSendFormTransactionFeeLevelsThunkState &
    EnhancePrecomposedTransactionThunkState;

export const composeTradingTransactionThunk = createThunk<
    PrecomposedLevels | PrecomposedLevelsCardano,
    ComposeTradingTransactionThunkParams,
    { rejectValue: string; state: ComposeTradingTransactionThunkState }
>(
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
                networkType: account.networkType,
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
                            precomposedTransaction: selectedLevel,
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

                    // Store the form state in trading draft so it's available for FeeSelector
                    dispatch(
                        formDraftActions.storeDraft({
                            key: formDraftKey,
                            formDraft: {
                                ...formState,
                                selectedFee: selectedFeeLevel,
                                feePerUnit: composed.feePerByte,
                                feeLimit: getTradingFormDraftFeeLimit({
                                    networkType: account.networkType,
                                    fee: composed.fee,
                                    feeLimit: composed.feeLimit,
                                    estimatedFeeLimit: composed.estimatedFeeLimit,
                                }),
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

type ComposeEvmApprovalFeeLevelsThunkParams = {
    quote: ExchangeTrade;
    account: Account;
    feeInfo: FeeInfo;
    selectedFeeLevel?: FeeLevelLabel;
    customFee?: {
        feeLimit: string;
        feePerUnit: string;
        maxFeePerGas?: string;
        maxPriorityFeePerGas?: string;
    };
    approvalTypeOverride?: DexApprovalType;
};

export type ComposeEvmApprovalFeeLevelsThunkState = TokensRootState & FormDraftRootState;

export const composeEvmApprovalFeeLevelsThunk = createThunk<
    PrecomposedLevels,
    ComposeEvmApprovalFeeLevelsThunkParams,
    { rejectValue: string; state: ComposeEvmApprovalFeeLevelsThunkState }
>(
    `${NATIVE_TRADING_EXCHANGE_THUNK_PREFIX}/composeEvmApprovalFeeLevels`,
    async (
        { quote, account, feeInfo, selectedFeeLevel = 'normal', customFee, approvalTypeOverride },
        { dispatch, getState, rejectWithValue, fulfillWithValue },
    ) => {
        try {
            const { dexTx, send, sendStringAmount, approvalType: quoteApprovalType } = quote;

            if (!dexTx?.data || !send || !sendStringAmount) {
                return rejectWithValue('DEX quote with dexTx data is required');
            }

            const approvalData = Calldata.evm.erc20.approve.decode(dexTx.data);
            const spender = approvalData?.spender;
            if (!spender) {
                return rejectWithValue('Could not extract spender from dexTx data');
            }

            const { contractAddress } = parseCryptoId(send);
            if (!contractAddress) {
                return rejectWithValue('Could not extract token contract address');
            }

            const token = selectAccountTokenInfo(getState(), account.key, contractAddress);

            if (!token) {
                return rejectWithValue('Token not found in account');
            }

            const approvalType = approvalTypeOverride ?? quoteApprovalType ?? 'INFINITE';
            const { allowanceAmount } = getAllowanceAmount({
                rawAmount: sendStringAmount,
                approvalType,
                token,
            });

            if (!allowanceAmount) {
                return rejectWithValue('Could not compute allowance amount');
            }

            const data = buildApprovalTransactionData({
                amount: allowanceAmount,
                spender,
            });

            const response = await dispatch(
                composeAllowanceTransactionThunk({
                    account,
                    contract: contractAddress,
                    data,
                    feeInfo,
                    selectedFee: selectedFeeLevel,
                    customFee,
                }),
            );

            if (isFulfilled(response)) {
                const feeLevels = response.payload;
                dispatch(transactionManagementActions.storeFeeLevels({ feeLevels }));

                const selectedLevel = feeLevels[selectedFeeLevel];
                if (selectedLevel && isFinalPrecomposedTransaction(selectedLevel)) {
                    const composed = selectedLevel;

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

                    const formDraftKey = getFormDraftKeyByTradeType('exchange');
                    const existingDraft = selectDeepCopyOfFormDraft(getState(), formDraftKey) ?? {};
                    // Preserve swap form fields (especially outputs[0].token). A full replace would drop
                    // outputs; composeSendFormTransactionFeeLevelsThunk then cannot resolve the ERC-20
                    // contract for approval fee composition and custom gas shows insufficient balance.
                    const outputs =
                        existingDraft.outputs?.[0]?.token != null
                            ? existingDraft.outputs
                            : [
                                  {
                                      type: 'payment' as const,
                                      address: '',
                                      amount: '0',
                                      fiat: '',
                                      currency: { label: '', value: '' },
                                      label: '',
                                      token: contractAddress,
                                  },
                              ];

                    dispatch(
                        formDraftActions.storeDraft({
                            key: formDraftKey,
                            formDraft: {
                                ...existingDraft,
                                selectedFee: selectedFeeLevel,
                                feePerUnit: composed.feePerByte,
                                feeLimit: composed.feeLimit ?? '',
                                maxFeePerGas: composed.maxFeePerGas ?? '',
                                maxPriorityFeePerGas: composed.maxPriorityFeePerGas ?? '',
                                estimatedFeeLimit: composed.estimatedFeeLimit,
                                transactionData: data,
                                outputs,
                            },
                        }),
                    );
                }

                return fulfillWithValue(response.payload);
            }

            const errStr = getErrorStrFromThunkRejectedValue(response);

            return rejectWithValue(`Failed to compose allowance transaction: ${errStr}`);
        } catch (error) {
            console.error('Compose allowance fee levels error:', error);

            return rejectWithValue(getErrorStrFromThunkRejectedValue(error));
        }
    },
);

export type SignTradingTransactionThunkState = SignTransactionThunkState;

export const signTradingTransactionThunk = createThunk<
    BlockbookTransaction | undefined,
    TradingSignAndPushSendFormTransactionProps,
    {
        rejectValue: SignTransactionError | SignTransactionTimeoutError | undefined;
        state: SignTradingTransactionThunkState;
    }
>(
    `${NATIVE_TRADING_EXCHANGE_THUNK_PREFIX}/signTransaction`,
    async (
        { formState, precomposedTransaction, selectedAccount, paymentRequests },
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

type SignAndPushSendFormTransactionThunkParams = TradingSignAndPushSendFormTransactionProps & {
    waitForPushApprovalPromise: () => Promise<boolean>;
};

export type SignAndPushSendFormTransactionThunkState = MevProtectionRootState &
    EnhancePrecomposedTransactionThunkState &
    SignTradingTransactionThunkState &
    PushSendFormTransactionThunkState &
    AddTransactionLabelingThunkState;

export type SignAndPushSendFormTransactionThunkDeps = PushSendFormTransactionThunkDeps &
    AddTransactionLabelingThunkDeps;

export const signAndPushSendFormTransactionThunk = createThunk<
    Ok<{ txid: string }>,
    SignAndPushSendFormTransactionThunkParams,
    {
        rejectValue: unknown;
        state: SignAndPushSendFormTransactionThunkState;
        extra: SignAndPushSendFormTransactionThunkDeps;
    }
>(
    `${NATIVE_TRADING_EXCHANGE_THUNK_PREFIX}/signAndPushSendFormTransaction`,
    async (
        {
            formState,
            precomposedTransaction,
            selectedAccount,
            paymentRequests,
            waitForPushApprovalPromise,
        },
        { dispatch, getState, rejectWithValue, fulfillWithValue },
    ) => {
        const enhanceResponse = await dispatch(
            enhancePrecomposedTransactionThunk({
                transactionFormValues: formState,
                precomposedTransaction,
                selectedAccount,
            }),
        );

        if (isRejected(enhanceResponse)) {
            return rejectWithValue(enhanceResponse.payload);
        }

        const enhancedPrecomposedTransaction = enhanceResponse.payload;

        const signResult = await dispatch(
            signTradingTransactionThunk({
                formState,
                precomposedTransaction: enhancedPrecomposedTransaction,
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

        return fulfillWithValue(pushResult.payload);
    },
);

export type UpdateTradingSelectedFeeLevelThunkState = FormDraftRootState;

export const updateTradingSelectedFeeLevelThunk = createThunk<
    void,
    UpdateSelectedFeeLevelThunkParams,
    { state: UpdateTradingSelectedFeeLevelThunkState }
>(
    `${NATIVE_TRADING_EXCHANGE_THUNK_PREFIX}/updateSelectedFeeLevelThunk`,
    (
        { feeLevelLabel, feePerUnit, feeLimit, formDraftKey, maxPriorityFeePerGas, maxFeePerGas },
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
