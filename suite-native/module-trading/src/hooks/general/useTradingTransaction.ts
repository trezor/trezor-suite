import { ReactNode, useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { isFulfilled, isRejected } from '@reduxjs/toolkit';
import type { ExchangeTrade, SellFiatTrade } from 'invity-api';

import {
    TradingFulfillValue,
    TradingSellFormProps,
    TradingSendRejectedProps,
    TradingSignAndPushSendFormTransactionProps,
    cryptoIdToNetworkAndContractAddress,
    exchangeThunks,
    selectTradingAccountKeyByTradeType,
    selectTradingExchangeSelectedQuote,
    selectTradingSellSelectedQuote,
    sellThunks,
} from '@suite-common/trading';
import { getNetwork } from '@suite-common/wallet-config';
import {
    AccountsRootState,
    FeesRootState,
    FormDraftRootState,
    SerializedTx,
    WalletSettingsRootState,
    selectAccountByKey,
    selectConvertedNetworkFeeInfo,
    selectDeepCopyOfFormDraft,
    selectIsAmountInSats,
    selectSendSerializedTx,
    updateFeeInfoThunk,
} from '@suite-common/wallet-core';
import { FeeLevelLabel, TokenAddress } from '@suite-common/wallet-types';
import { TxKeyPath } from '@suite-native/intl';
import { TokensRootState, selectAccountTokenDecimals } from '@suite-native/tokens';
import { TradingRootState, getFormDraftKeyByTradeType } from '@suite-native/trading-state';
import {
    selectFeeLevels,
    useFeesFetching,
    usePrecomposedTransactionError,
} from '@suite-native/transaction-management';
import TrezorConnect from '@trezor/connect';

import { useConsent } from './useConsent';
import { composeTradingTransactionThunk, signAndPushSendFormTransactionThunk } from '../../thunks';

export type TradingTransactionSignAndSendProps = {
    nextStep: () => void;
    onError: (error: TradingSendRejectedProps<TxKeyPath>) => void;
};

export type TradingTransactionComposeProps = {
    selectedFeeLevel?: FeeLevelLabel;
    feePerUnit?: string;
    feeLimit?: string;
    maxFeePerGas?: string;
    maxPriorityFeePerGas?: string;
};

export type UseTradingTransactionProps = {
    tradeType: 'exchange' | 'sell';
    returnUrl?: string;
    processResponseData?: (response: any) => void;
    triggerAnalyticsTradeConfirmation?: () => void;
};

export type UseTradingTransactionReturnProps = {
    txnErrorString: ReactNode;
    composeRequest: (props: TradingTransactionComposeProps) => Promise<unknown>;
    fetchFeesAndCompose: () => Promise<void>;
    signAndSendTransaction: (props: TradingTransactionSignAndSendProps) => Promise<boolean>;
    signAndPushSendFormTransaction: (
        props: TradingSignAndPushSendFormTransactionProps,
    ) => Promise<TradingFulfillValue>;
    serializedTx: SerializedTx | undefined;
    resolveTransactionSendConsent: (approved: boolean) => void;
    isTransactionSendConsentRequested: boolean;
    waitForTransactionSendConsent: () => Promise<boolean>;
    tokenDecimals: number | null;
    shouldSendInSats: boolean;
    isSlip24Active: boolean;
};

export const useTradingTransaction = ({
    tradeType,
    returnUrl,
    processResponseData,
    triggerAnalyticsTradeConfirmation,
}: UseTradingTransactionProps): UseTradingTransactionReturnProps => {
    const dispatch = useDispatch();

    const sendAccountKey = useSelector((state: TradingRootState) =>
        selectTradingAccountKeyByTradeType(state, tradeType),
    );

    const sendAccount = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, sendAccountKey),
    );

    const selectedQuote = useSelector((state: TradingRootState) =>
        tradeType === 'exchange'
            ? selectTradingExchangeSelectedQuote(state)
            : selectTradingSellSelectedQuote(state),
    );

    const draft = useSelector((state: FormDraftRootState) =>
        selectDeepCopyOfFormDraft(state, getFormDraftKeyByTradeType(tradeType)),
    );

    const {
        selectedFee,
        feePerUnit: feePerUnitDraft,
        feeLimit: feeLimitDraft,
        maxFeePerGas: maxFeePerGasDraft,
        maxPriorityFeePerGas: maxPriorityFeePerGasDraft,
    } = draft ?? {};

    const { contractAddress } = cryptoIdToNetworkAndContractAddress(
        tradeType === 'exchange'
            ? (selectedQuote as ExchangeTrade)?.send
            : (selectedQuote as SellFiatTrade)?.cryptoCurrency,
    );

    const tokenDecimals = useSelector((state: TokensRootState) =>
        selectAccountTokenDecimals(state, sendAccount?.key, contractAddress as TokenAddress),
    );

    const shouldSendInSats = useSelector((state: WalletSettingsRootState) =>
        selectIsAmountInSats(state, sendAccount?.symbol),
    );

    const networkFeeInfo = useSelector((state: FeesRootState) =>
        selectConvertedNetworkFeeInfo(state, sendAccount?.symbol),
    );

    const serializedTx = useSelector(selectSendSerializedTx);

    const feeLevels = useSelector(selectFeeLevels);

    const selectedLevel = feeLevels[(selectedFee as FeeLevelLabel) ?? 'normal'];
    const feeError = selectedLevel?.type === 'error' ? selectedLevel.error : null;

    const txnErrorString = usePrecomposedTransactionError({
        error: feeError,
        networkSymbol: sendAccount?.symbol,
    });

    const {
        isConsentRequested: isTransactionSendConsentRequested,
        waitForConsent: waitForTransactionSendConsent,
        resolveConsent: resolveTransactionSendConsent,
    } = useConsent();

    useFeesFetching({
        networkSymbol: sendAccount?.symbol,
        isRefetchDisabled: selectedFee === 'custom',
    });

    // TODO: slip24 - not implemented in mobile
    const isSlip24Active = false;

    // cancel txn signing on unmount
    useEffect(() => () => TrezorConnect.cancel(), []);

    // this is called when we want to compose a transaction
    const composeRequest = useCallback(
        async ({
            selectedFeeLevel,
            feePerUnit,
            feeLimit,
            maxPriorityFeePerGas,
            maxFeePerGas,
        }: TradingTransactionComposeProps) => {
            if (!sendAccount || !networkFeeInfo) {
                console.error(
                    'Send account and networkFeeInfo are required for composing transaction',
                );

                return;
            }

            try {
                const levels = await dispatch(
                    composeTradingTransactionThunk({
                        tradeType,
                        account: sendAccount,
                        network: getNetwork(sendAccount.symbol),
                        feeInfo: networkFeeInfo,
                        selectedFeeLevel,
                        feePerUnit,
                        feeLimit,
                        maxPriorityFeePerGas,
                        maxFeePerGas,
                    }),
                ).unwrap();

                return levels;
            } catch (error) {
                console.error('Failed to compose trading transaction:', error);
            }
        },
        [dispatch, networkFeeInfo, sendAccount, tradeType],
    );

    // this is called when we want to fetch fees and compose a transaction
    const fetchFeesAndCompose = useCallback(async () => {
        if (!sendAccount) {
            console.error('Send account is required to fetch fees and compose transaction');

            return;
        }

        const feesResult = await dispatch(
            updateFeeInfoThunk({ networkSymbol: sendAccount.symbol }),
        );
        if (isRejected(feesResult)) {
            console.error('Failed to fetch fees for trading transaction');
        }

        await composeRequest({
            selectedFeeLevel: selectedFee as FeeLevelLabel,
            feePerUnit: feePerUnitDraft,
            feeLimit: feeLimitDraft,
            maxFeePerGas: maxFeePerGasDraft,
            maxPriorityFeePerGas: maxPriorityFeePerGasDraft,
        });
    }, [
        sendAccount,
        dispatch,
        composeRequest,
        selectedFee,
        feePerUnitDraft,
        feeLimitDraft,
        maxFeePerGasDraft,
        maxPriorityFeePerGasDraft,
    ]);

    // this is the reusable signAndPushSendFormTransaction function
    // waitForPushApproval is used so that we can wait for the user to approve the transaction before sending it
    const signAndPushSendFormTransaction = useCallback(
        async ({
            formState,
            precomposedTransaction,
            selectedAccount,
            paymentRequests,
        }: TradingSignAndPushSendFormTransactionProps): Promise<TradingFulfillValue> => {
            const result = await dispatch(
                signAndPushSendFormTransactionThunk({
                    formState,
                    precomposedTransaction,
                    selectedAccount,
                    paymentRequests,
                    waitForPushApprovalPromise: waitForTransactionSendConsent,
                }),
            );

            if (isFulfilled(result)) {
                return result.payload as TradingFulfillValue;
            }

            return result.error as TradingFulfillValue;
        },
        [dispatch, waitForTransactionSendConsent],
    );

    // this is called when we want to sign and send a transaction
    const signAndSendTransaction = useCallback(
        async ({ nextStep, onError }: TradingTransactionSignAndSendProps) => {
            if (!selectedQuote || !sendAccount) {
                console.error(
                    'Selected quote and send account are required to sign and send transaction',
                );

                return false;
            }

            const network = getNetwork(sendAccount.symbol);
            const decimals = tokenDecimals ?? network.decimals;

            try {
                if (tradeType === 'exchange') {
                    await dispatch(
                        exchangeThunks.sendTransactionThunk({
                            account: sendAccount,
                            trade: selectedQuote as ExchangeTrade,
                            returnUrl: returnUrl || '',
                            setMaxOutputId: draft?.setMaxOutputId,
                            decimals,
                            shouldSendInSats,
                            isSlip24Active,
                            nextStep,
                            processResponseData: processResponseData || (() => {}),
                            triggerAnalyticsTradeConfirmation:
                                triggerAnalyticsTradeConfirmation || (() => {}),
                            signAndPushSendFormTransaction,
                        }),
                    ).unwrap();

                    return true;
                }

                await dispatch(
                    sellThunks.sendTransactionThunk({
                        account: sendAccount,
                        trade: selectedQuote as SellFiatTrade,
                        formValues: draft as TradingSellFormProps,
                        decimals,
                        shouldSendInSats,
                        isSlip24Active,
                        nextStep,
                        signAndPushSendFormTransaction,
                    }),
                ).unwrap();

                return true;
            } catch (e) {
                onError(e as TradingSendRejectedProps<TxKeyPath>);

                return false;
            }
        },
        [
            selectedQuote,
            sendAccount,
            tokenDecimals,
            tradeType,
            dispatch,
            draft,
            shouldSendInSats,
            isSlip24Active,
            signAndPushSendFormTransaction,
            returnUrl,
            processResponseData,
            triggerAnalyticsTradeConfirmation,
        ],
    );

    useEffect(() => {
        if (selectedFee && networkFeeInfo) {
            composeRequest({
                selectedFeeLevel: selectedFee as FeeLevelLabel,
                feePerUnit: feePerUnitDraft,
                feeLimit: feeLimitDraft,
                maxFeePerGas: maxFeePerGasDraft,
                maxPriorityFeePerGas: maxPriorityFeePerGasDraft,
            });
        }
    }, [
        selectedFee,
        composeRequest,
        feePerUnitDraft,
        feeLimitDraft,
        networkFeeInfo,
        selectedQuote,
        maxFeePerGasDraft,
        maxPriorityFeePerGasDraft,
    ]);

    return {
        txnErrorString,
        composeRequest,
        fetchFeesAndCompose,
        signAndSendTransaction,
        signAndPushSendFormTransaction,
        serializedTx,
        resolveTransactionSendConsent,
        isTransactionSendConsentRequested,
        waitForTransactionSendConsent,
        tokenDecimals,
        shouldSendInSats,
        isSlip24Active,
    };
};
