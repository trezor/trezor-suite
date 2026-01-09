import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';
import type { ExchangeTrade, FormResponse } from 'invity-api';

import {
    TradingSendRejectedProps,
    exchangeThunks,
    selectTradingExchangePreselectedQuote,
    selectTradingExchangeSelectedQuote,
} from '@suite-common/trading';
import { EventType } from '@suite-native/analytics';
import {
    RootStackParamList,
    RootStackRoutes,
    StackNavigationProps,
} from '@suite-native/navigation';
import { useLegacyAnalytics } from '@suite-native/services';
import { selectExchangeSelectedSendAccount } from '@suite-native/trading-state';

import { buildTradingUrl, getSourceForForm } from '../../utils/general/formUtils';
import { useTradingTransaction } from '../general/useTradingTransaction';

export type TradingExchangeConfirmTradeProps = {
    receiveAddress: string;
    extraField?: string;
    trade?: ExchangeTrade;
    approvalFlow?: boolean;
    nextStep: () => void;
};

export type TradingExchangeSignAndSendTransactionProps = {
    nextStep: () => void;
    onError: (error: TradingSendRejectedProps) => void;
};

export const useExchangeFlow = () => {
    const dispatch = useDispatch();
    const legacyAnalytics = useLegacyAnalytics();
    const rootNavigation =
        useNavigation<StackNavigationProps<RootStackParamList, RootStackRoutes>>();

    const selectedQuote = useSelector(selectTradingExchangeSelectedQuote);
    const preSelectedQuote = useSelector(selectTradingExchangePreselectedQuote);
    const quote = selectedQuote ?? preSelectedQuote;

    const sendAccount = useSelector(selectExchangeSelectedSendAccount);

    // whenever we get a form from the webview, we need to navigate to the webview screen
    const handleWebview = useCallback(
        (trade: ExchangeTrade, formData: FormResponse['form'], returnUrl: string) => {
            const source = getSourceForForm(formData);
            if (!source) {
                return;
            }

            rootNavigation.navigate(RootStackRoutes.TradingWebView, {
                closeCallbackUrl: returnUrl,
                tradingType: 'exchange',
                source,
                orderId: trade?.orderId,
            });
        },
        [rootNavigation],
    );

    const getCommonFunctions = useCallback(
        (trade?: ExchangeTrade) => {
            const tradeToUse = trade ?? quote;

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
                legacyAnalytics.report({
                    type: EventType.TradingConfirmTrade,
                    payload: {
                        type: 'exchange',
                    },
                });
            };

            const processResponseData = (response: ExchangeTrade) =>
                handleWebview(tradeToUse, response.tradeForm?.form, returnUrl);

            return {
                returnUrl,
                triggerAnalyticsTradeConfirmation,
                processResponseData,
            };
        },
        [handleWebview, legacyAnalytics, quote],
    );

    const {
        txnErrorString,
        composeRequest,
        fetchFeesAndCompose,
        signAndSendTransaction,
        serializedTx,
        resolveTransactionSendConsent,
        isTransactionSendConsentRequested,
    } = useTradingTransaction({
        tradeType: 'exchange',
        returnUrl: getCommonFunctions()?.returnUrl,
        processResponseData: getCommonFunctions()?.processResponseData,
        triggerAnalyticsTradeConfirmation: getCommonFunctions()?.triggerAnalyticsTradeConfirmation,
    });

    // changing trade state and initial confirmation
    const confirmTrade = useCallback(
        async ({
            receiveAddress,
            extraField,
            trade,
            approvalFlow,
            nextStep,
        }: TradingExchangeConfirmTradeProps): Promise<boolean> => {
            const commonFunctions = getCommonFunctions(trade);

            if (!trade || !sendAccount || !commonFunctions) {
                console.error(
                    'Trade, send account and common functions are required to confirm trade',
                );

                return false;
            }

            const { returnUrl, triggerAnalyticsTradeConfirmation, processResponseData } =
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

    return {
        txnErrorString,
        confirmTrade,
        composeRequest,
        fetchFeesAndCompose,
        signAndSendTransaction,
        serializedTx,
        resolveTransactionSendConsent,
        isTransactionSendConsentRequested,
    };
};
