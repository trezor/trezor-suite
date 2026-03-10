import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import type { BankAccount, SellFiatTrade, SellFiatTradeResponse } from 'invity-api';

import {
    selectTradingSellInfo,
    selectTradingSellSelectedQuote,
    sellThunks,
    sellUtils,
} from '@suite-common/trading';
import { buildTradingUrl, useBrowserAuth } from '@suite-native/trading-browser-auth';
import { selectSellSelectedSendAccount } from '@suite-native/trading-state';

import { useTradingTransaction } from '../general/useTradingTransaction';

export const useSellFlow = () => {
    const dispatch = useDispatch();
    const sellInfo = useSelector(selectTradingSellInfo);

    const selectedQuote = useSelector(selectTradingSellSelectedQuote);

    const sendAccount = useSelector(selectSellSelectedSendAccount);

    const { openBrowserForFormData } = useBrowserAuth('sell');

    const getCommonFunctions = useCallback(
        (trade?: SellFiatTrade) => {
            const tradeToUse = trade ?? selectedQuote;

            if (!tradeToUse) {
                console.warn('No trade to use for get common functions');

                return;
            }

            const returnUrl = buildTradingUrl({
                actionType: 'trade',
                tradeType: 'sell',
                orderId: tradeToUse.orderId,
            });

            const triggerAnalyticsTradeConfirmation = () => {
                // TODO: add analytics
            };

            const processResponseData = (response: SellFiatTradeResponse) =>
                openBrowserForFormData(response.tradeForm?.form, returnUrl);

            return {
                returnUrl,
                triggerAnalyticsTradeConfirmation,
                processResponseData,
            };
        },
        [openBrowserForFormData, selectedQuote],
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
        tradeType: 'sell',
        returnUrl: getCommonFunctions(selectedQuote)?.returnUrl,
        processResponseData: getCommonFunctions(selectedQuote)?.processResponseData,
        triggerAnalyticsTradeConfirmation:
            getCommonFunctions(selectedQuote)?.triggerAnalyticsTradeConfirmation,
    });

    const doSellTrade = useCallback(
        async (trade: SellFiatTrade) => {
            const commonFunctions = getCommonFunctions(trade);
            if (!commonFunctions || !sendAccount) {
                console.warn('No common functions or send account for do sell trade');

                return;
            }

            const { processResponseData, returnUrl } = commonFunctions;

            await dispatch(
                sellThunks.handleTradeThunk({
                    account: sendAccount,
                    trade,
                    returnUrl,
                    processResponseData,
                }),
            );
        },
        [dispatch, getCommonFunctions, sendAccount],
    );

    const confirmTrade = useCallback(
        async (bankAccount: BankAccount) => {
            if (!selectedQuote) {
                console.warn('No selected quote for confirm trade');

                return;
            }

            const quote = { ...selectedQuote, bankAccount };

            const commonFunctions = getCommonFunctions(quote);
            if (!commonFunctions || !sendAccount) {
                console.warn('No common functions or send account for confirm trade');

                return;
            }

            const { processResponseData, triggerAnalyticsTradeConfirmation, returnUrl } =
                commonFunctions;

            await dispatch(
                sellThunks.confirmTradeThunk({
                    account: sendAccount,
                    bankAccount,
                    returnUrl,
                    triggerAnalyticsTradeConfirmation,
                    processResponseData,
                }),
            );
        },
        [dispatch, getCommonFunctions, selectedQuote, sendAccount],
    );

    const doBankAccountVerificationCheck = useCallback(async () => {
        if (!selectedQuote) {
            console.warn('No selected quote for bank account check');

            return;
        }

        // empty quoteId means the partner requests login first, requestTrade to get login screen
        if (
            (sellInfo &&
                sellUtils.needToRegisterOrVerifyBankAccount({
                    quote: selectedQuote,
                    sellInfo,
                })) ||
            !selectedQuote.quoteId
        ) {
            await doSellTrade(selectedQuote);
        }
    }, [selectedQuote, sellInfo, doSellTrade]);

    return {
        txnErrorString,
        composeRequest,
        fetchFeesAndCompose,
        signAndSendTransaction,
        serializedTx,
        resolveTransactionSendConsent,
        isTransactionSendConsentRequested,
        doSellTrade,
        confirmTrade,
        doBankAccountVerificationCheck,
    };
};
