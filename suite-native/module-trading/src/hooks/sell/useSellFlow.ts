import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';
import type { BankAccount, FormResponse, SellFiatTrade, SellFiatTradeResponse } from 'invity-api';

import {
    selectTradingSellInfo,
    selectTradingSellSelectedQuote,
    sellThunks,
    sellUtils,
} from '@suite-common/trading';
import {
    RootStackParamList,
    RootStackRoutes,
    StackNavigationProps,
} from '@suite-native/navigation';
import { selectSellSelectedSendAccount } from '@suite-native/trading-state';

import { buildTradingUrl, getSourceForForm } from '../../utils/general/formUtils';
import { useTradingTransaction } from '../general/useTradingTransaction';

export const useSellFlow = () => {
    const dispatch = useDispatch();
    const rootNavigation =
        useNavigation<StackNavigationProps<RootStackParamList, RootStackRoutes>>();
    const sellInfo = useSelector(selectTradingSellInfo);

    const selectedQuote = useSelector(selectTradingSellSelectedQuote);

    const sendAccount = useSelector(selectSellSelectedSendAccount);

    // whenever we get a form from the webview, we need to navigate to the webview screen
    const handleWebview = useCallback(
        (trade: SellFiatTrade, formData: FormResponse['form'], returnUrl: string) => {
            const source = getSourceForForm(formData);
            if (!source) {
                return;
            }

            rootNavigation.navigate(RootStackRoutes.TradingWebView, {
                closeCallbackUrl: returnUrl,
                tradingType: 'sell',
                source,
                orderId: trade.orderId,
            });
        },
        [rootNavigation],
    );

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
                exchange: tradeToUse.exchange,
            });

            const triggerAnalyticsTradeConfirmation = () => {
                // TODO: add analytics
            };

            const processResponseData = (response: SellFiatTradeResponse) =>
                handleWebview(tradeToUse, response.tradeForm?.form, returnUrl);

            return {
                returnUrl,
                triggerAnalyticsTradeConfirmation,
                processResponseData,
            };
        },
        [handleWebview, selectedQuote],
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

            const { returnUrl, processResponseData } = commonFunctions;

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

            const { returnUrl, processResponseData, triggerAnalyticsTradeConfirmation } =
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
