import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import type { ExchangeTrade } from 'invity-api';

import {
    type TradingSendRejectedProps,
    exchangeThunks,
    selectTradingExchangePreselectedQuote,
    selectTradingExchangeSelectedQuote,
} from '@suite-common/trading';
import { events } from '@suite-native/analytics';
import { useAnalytics } from '@suite-native/services';
import { buildTradingUrl, useBrowserAuth } from '@suite-native/trading-browser-auth';
import { selectExchangeSelectedSendAccount } from '@suite-native/trading-state';

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
    const analytics = useAnalytics();
    const selectedQuote = useSelector(selectTradingExchangeSelectedQuote);
    const preSelectedQuote = useSelector(selectTradingExchangePreselectedQuote);
    const quote = selectedQuote ?? preSelectedQuote;

    const sendAccount = useSelector(selectExchangeSelectedSendAccount);

    const { openBrowserForFormData } = useBrowserAuth('exchange');

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
            });

            const triggerAnalyticsTradeConfirmation = () => {
                analytics.report({
                    type: events.tradingConfirmTradeEvent.name,
                    payload: {
                        type: 'exchange',
                    },
                });
            };

            const processResponseData = (response: ExchangeTrade) =>
                openBrowserForFormData(response.tradeForm?.form, returnUrl);

            return {
                returnUrl,
                triggerAnalyticsTradeConfirmation,
                processResponseData,
            };
        },
        [openBrowserForFormData, analytics, quote],
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
