import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';
import type { BankAccount, FormResponse, SellFiatTrade, SellFiatTradeResponse } from 'invity-api';

import {
    selectTradingSellInfo,
    selectTradingSellIsLoading,
    selectTradingSellSelectedQuote,
    sellThunks,
    sellUtils,
} from '@suite-common/trading';
import {
    RootStackParamList,
    RootStackRoutes,
    StackNavigationProps,
} from '@suite-native/navigation';
import { useTimer } from '@trezor/react-utils';

import { selectSellSelectedSendAccount } from '../../selectors/sellSelectors';
import { SellFormType } from '../../types/sell';
import { buildTradingUrl, getSourceForForm } from '../../utils/general/formUtils';
import { useConsent } from '../general/useConsent';
import { useConsentDenier } from '../general/useConsentDenier';

type SellFlowReturn = {
    canProceed: boolean;
    isConsentRequested: boolean;
    selectQuote: () => Promise<void>;
    giveConsent: () => void;
    cancelConsent: () => void;
    doSellTrade: (trade: SellFiatTrade) => Promise<void>;
    confirmTrade: (bankAccount: BankAccount) => Promise<void>;
};

export const useSellFlow = ({ watch }: SellFormType): SellFlowReturn => {
    const dispatch = useDispatch();
    const rootNavigation =
        useNavigation<StackNavigationProps<RootStackParamList, RootStackRoutes>>();
    const timer = useTimer();
    const candidateQuote = watch('quote');
    const isLoading = useSelector(selectTradingSellIsLoading);
    const sellInfo = useSelector(selectTradingSellInfo);
    const { isConsentRequested, waitForConsent, resolveConsent } = useConsent();
    useConsentDenier(candidateQuote?.exchange, resolveConsent);

    const selectedQuote = useSelector(selectTradingSellSelectedQuote);

    const sendAccount = useSelector(selectSellSelectedSendAccount);

    const canProceed = !!candidateQuote && !!sendAccount && !isLoading;

    const giveConsent = useCallback(() => {
        resolveConsent(true);
    }, [resolveConsent]);

    const cancelConsent = useCallback(() => {
        resolveConsent(false);
    }, [resolveConsent]);

    // whenever we get a form from the webview, we need to navigate to the webview screen
    const handleWebview = useCallback(
        (trade: SellFiatTrade, formData: FormResponse['form'], returnUrl: string) => {
            const source = getSourceForForm(formData);
            if (!source) {
                return;
            }

            rootNavigation.navigate(RootStackRoutes.TradingWebView, {
                closeCallbackUrl: returnUrl,
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

    const doSellTrade = useCallback(
        async (trade: SellFiatTrade) => {
            const commonFunctions = getCommonFunctions(trade);
            if (!commonFunctions || !sendAccount) {
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
                return;
            }

            const quote = { ...selectedQuote, bankAccount };

            const commonFunctions = getCommonFunctions(quote);
            if (!commonFunctions || !sendAccount) {
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

    const selectQuote = useCallback(async () => {
        if (!candidateQuote || isLoading) {
            return;
        }

        const nextStep = () => {
            // empty quoteId means the partner requests login first, requestTrade to get login screen
            if (
                (sellInfo &&
                    sellUtils.needToRegisterOrVerifyBankAccount({
                        quote: candidateQuote,
                        sellInfo,
                    })) ||
                !candidateQuote.quoteId
            ) {
                doSellTrade(candidateQuote);
            }
        };

        await dispatch(
            sellThunks.selectQuoteThunk({
                quote: candidateQuote,
                timer,
                userConsent: waitForConsent,
                nextStep,
                onCancel: () => {},
            }),
        );
    }, [candidateQuote, isLoading, sellInfo, doSellTrade, dispatch, timer, waitForConsent]);

    return {
        canProceed,
        isConsentRequested,
        giveConsent,
        cancelConsent,
        doSellTrade,
        confirmTrade,
        selectQuote,
    };
};
