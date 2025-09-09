import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';
import { isFulfilled } from '@reduxjs/toolkit';
import type { ExchangeTrade, FormResponse } from 'invity-api';

import {
    TradingFulfillValue,
    TradingSendRejectedProps,
    TradingSignAndPushSendFormTransactionProps,
    cryptoIdToNetworkAndContractAddress,
    exchangeThunks,
    selectTradingExchangeSelectedQuote,
} from '@suite-common/trading';
import { getNetwork } from '@suite-common/wallet-config';
import {
    FeesRootState,
    FormDraftRootState,
    WalletSettingsRootState,
    selectConvertedNetworkFeeInfo,
    selectDeepCopyOfFormDraft,
    selectIsAmountInSats,
    selectSendSerializedTx,
    updateFeeInfoThunk,
} from '@suite-common/wallet-core';
import { TokenAddress } from '@suite-common/wallet-types';
import { getFormDraftKey } from '@suite-common/wallet-utils';
import { Translation } from '@suite-native/intl';
import {
    RootStackParamList,
    RootStackRoutes,
    StackNavigationProps,
} from '@suite-native/navigation';
import { useToast } from '@suite-native/toasts';
import { TokensRootState, selectAccountTokenDecimals } from '@suite-native/tokens';
import {
    NativeSupportedFeeLevel,
    selectFeeLevels,
    useFeesFetching,
    usePrecomposedTransactionError,
} from '@suite-native/transaction-management';
import TrezorConnect from '@trezor/connect';

import { selectExchangeSelectedSendAccount } from '../../selectors/exchangeSelectors';
import { composeTradingTransactionThunk, signAndPushSendFormTransactionThunk } from '../../thunks';
import { buildTradingUrl, getSourceForForm } from '../../utils/general/formUtils';
import { useConsent } from '../general/useConsent';

type TradingExchangeConfirmTradeProps = {
    receiveAddress: string;
    extraField?: string;
    trade?: ExchangeTrade;
    approvalFlow?: boolean;
};

export const useExchangeFlow = () => {
    const dispatch = useDispatch();

    const { showToast } = useToast();

    const rootNavigation =
        useNavigation<StackNavigationProps<RootStackParamList, RootStackRoutes>>();

    const selectedQuote = useSelector(selectTradingExchangeSelectedQuote);

    const sendAccount = useSelector(selectExchangeSelectedSendAccount);

    const draft = useSelector((state: FormDraftRootState) =>
        selectDeepCopyOfFormDraft(state, getFormDraftKey('trading-exchange', '')),
    );

    const { selectedFee, feePerUnit: feePerUnitDraft, feeLimit: feeLimitDraft } = draft ?? {};

    const { contractAddress } = cryptoIdToNetworkAndContractAddress(selectedQuote?.send);

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

    const selectedLevel = feeLevels[(selectedFee as NativeSupportedFeeLevel) ?? 'normal'];
    const feeError = selectedLevel?.type === 'error' ? selectedLevel.error : null;

    const txnErrorString = usePrecomposedTransactionError({
        error: feeError,
        context: {
            networkSymbol: sendAccount?.symbol,
        },
    });

    const { isConsentRequested, waitForConsent, resolveConsent } = useConsent();

    useFeesFetching({
        accountKey: sendAccount?.key,
        isRefetchDisabled: selectedFee === 'custom',
    });

    // TODO: slip24 - not implemented in mobile
    const isSlip24Active = false;

    // cancel txn signing on unmount
    useEffect(() => () => TrezorConnect.cancel(), []);

    // whenever we get a form from the webview, we need to navigate to the webview screen
    const handleWebview = useCallback(
        (trade: ExchangeTrade, formData: FormResponse['form'], returnUrl: string) => {
            const source = getSourceForForm(formData);
            if (!source) {
                return;
            }

            rootNavigation.navigate(RootStackRoutes.TradingWebView, {
                closeCallbackUrl: returnUrl,
                source,
                orderId: trade?.orderId,
            });
        },
        [rootNavigation],
    );

    // this is called when we want to compose a transaction
    const composeRequest = useCallback(
        async ({
            selectedFeeLevel,
            feePerUnit,
            feeLimit,
        }: {
            selectedFeeLevel?: NativeSupportedFeeLevel;
            feePerUnit?: string;
            feeLimit?: string;
        }) => {
            if (!sendAccount || !networkFeeInfo) {
                console.error(
                    'Send account and networkFeeInfo are required for composing transaction',
                );

                return;
            }

            try {
                const levels = await dispatch(
                    composeTradingTransactionThunk({
                        tradeType: 'exchange',
                        account: sendAccount,
                        network: getNetwork(sendAccount.symbol),
                        feeInfo: networkFeeInfo,
                        selectedFeeLevel,
                        feePerUnit,
                        feeLimit,
                    }),
                ).unwrap();

                return levels;
            } catch (error) {
                console.error('Failed to compose trading transaction:', error);
            }
        },
        [dispatch, networkFeeInfo, sendAccount],
    );

    // this is called when we want to fetch fees and compose a transaction
    const fetchFeesAndCompose = useCallback(async () => {
        if (!sendAccount) {
            console.error('Send account is required to fetch fees and compose transaction');

            return;
        }

        await dispatch(updateFeeInfoThunk({ networkSymbol: sendAccount.symbol }));
        await composeRequest({
            selectedFeeLevel: selectedFee as NativeSupportedFeeLevel,
            feePerUnit: feePerUnitDraft,
            feeLimit: feeLimitDraft,
        });
    }, [dispatch, sendAccount, composeRequest, selectedFee, feePerUnitDraft, feeLimitDraft]);

    const getCommonFunctions = useCallback(
        (trade?: ExchangeTrade) => {
            const tradeToUse = trade ?? selectedQuote;

            if (!tradeToUse) {
                console.error('Trade or selectedQuote is required to getCommonFunctions');

                return null;
            }

            const returnUrl = buildTradingUrl({
                actionType: 'trade',
                tradeType: 'exchange',
                orderId: tradeToUse.orderId,
                exchange: tradeToUse.exchange,
            });

            const triggerAnalyticsTradeConfirmation = () => {
                // TODO: add analytics
            };

            const processResponseData = (response: ExchangeTrade) =>
                handleWebview(tradeToUse, response.tradeForm?.form, returnUrl);

            const nextStep = () => {
                // TODO: add next step
            };

            return {
                returnUrl,
                triggerAnalyticsTradeConfirmation,
                processResponseData,
                nextStep,
            };
        },
        [handleWebview, selectedQuote],
    );

    // changing trade state and initial confirmation
    const confirmTrade = useCallback(
        async ({
            receiveAddress,
            extraField,
            trade,
            approvalFlow,
        }: TradingExchangeConfirmTradeProps & { sendAccount: any }): Promise<boolean> => {
            const commonFunctions = getCommonFunctions(trade);

            if (!trade || !sendAccount || !commonFunctions) {
                console.error(
                    'Trade, send account and common functions are required to confirm trade',
                );

                return false;
            }

            const { returnUrl, triggerAnalyticsTradeConfirmation, processResponseData, nextStep } =
                commonFunctions;

            return !!(await dispatch(
                exchangeThunks.confirmTradeThunk({
                    returnUrl,
                    receiveAddress,
                    account: sendAccount,
                    extraField,
                    trade,
                    approvalFlow,
                    triggerAnalyticsTradeConfirmation,
                    processResponseData,
                    nextStep,
                }),
            ).unwrap());
        },
        [getCommonFunctions, sendAccount, dispatch],
    );

    // this is called when we want to sign and send a transaction
    // waitForPushApproval is used so that we can wait for the user to approve the transaction before sending it
    const signAndSendTransaction = useCallback(async () => {
        const commonFunctions = getCommonFunctions(selectedQuote);

        if (!commonFunctions || !sendAccount) {
            console.error(
                'Common functions and send account are required to sign and send transaction',
            );

            return false;
        }

        const network = getNetwork(sendAccount.symbol);
        const decimals = tokenDecimals ?? network.decimals;

        const { returnUrl, triggerAnalyticsTradeConfirmation, processResponseData, nextStep } =
            commonFunctions;

        const signAndPushSendFormTransaction = async ({
            formState,
            precomposedTransaction,
            selectedAccount,
            paymentRequests,
        }: TradingSignAndPushSendFormTransactionProps): Promise<TradingFulfillValue> => {
            resolveConsent(true);

            const result = await dispatch(
                signAndPushSendFormTransactionThunk({
                    formState,
                    precomposedTransaction,
                    selectedAccount,
                    paymentRequests,
                    waitForPushApprovalPromise: waitForConsent,
                }),
            );

            if (isFulfilled(result)) {
                return result.payload as TradingFulfillValue;
            }

            return result.error as TradingFulfillValue;
        };

        try {
            await dispatch(
                exchangeThunks.sendTransactionThunk({
                    account: sendAccount,
                    trade: selectedQuote,
                    returnUrl,
                    setMaxOutputId: undefined,
                    decimals,
                    shouldSendInSats,
                    isSlip24Active,
                    nextStep,
                    processResponseData,
                    triggerAnalyticsTradeConfirmation,
                    signAndPushSendFormTransaction,
                }),
            ).unwrap();

            return true;
        } catch (e) {
            const errorTyped = e as TradingSendRejectedProps;

            showToast({
                icon: 'warningCircle',
                variant: 'error',
                message:
                    errorTyped.type === 'sign-transaction-timeout' ? (
                        <Translation id="moduleSend.review.outputs.errorAlert.solana.description" />
                    ) : (
                        e.message
                    ),
            });

            return false;
        }
    }, [
        dispatch,
        getCommonFunctions,
        isSlip24Active,
        resolveConsent,
        selectedQuote,
        sendAccount,
        shouldSendInSats,
        showToast,
        tokenDecimals,
        waitForConsent,
    ]);

    useEffect(() => {
        if (selectedFee && networkFeeInfo) {
            composeRequest({
                selectedFeeLevel: selectedFee as NativeSupportedFeeLevel,
                feePerUnit: feePerUnitDraft,
                feeLimit: feeLimitDraft,
            });
        }
    }, [selectedFee, composeRequest, feePerUnitDraft, feeLimitDraft, networkFeeInfo]);

    return {
        txnErrorString,
        confirmTrade,
        composeRequest,
        fetchFeesAndCompose,
        signAndSendTransaction,
        serializedTx,
        resolveConsent,
        isConsentRequested,
    };
};
