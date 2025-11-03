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
    tradingSellActions,
} from '@suite-common/trading';
import {
    RootStackParamList,
    RootStackRoutes,
    StackNavigationProps,
    StackToStackCompositeNavigationProps,
    TradingStackParamList,
    TradingStackRoutes,
} from '@suite-native/navigation';
import { selectSellSelectedSendAccount } from '@suite-native/trading-state';
import { SellFormType } from '@suite-native/trading-types';
import { useTimer } from '@trezor/react-utils';

import { buildTradingUrl, getSourceForForm } from '../../utils/general/formUtils';
import { useConsent } from '../general/useConsent';
import { useConsentDenier } from '../general/useConsentDenier';

type NavigationProps = StackToStackCompositeNavigationProps<
    TradingStackParamList,
    TradingStackRoutes.TradingSellPreview,
    RootStackParamList
>;

type SellFlowReturn = {
    canProceed: boolean;
    isLegalTermsConsentRequested: boolean;
    selectQuote: () => Promise<void>;
    giveLegalTermsConsent: () => void;
    cancelLegalTermsConsent: () => void;
    doSellTrade: (trade: SellFiatTrade) => Promise<void>;
    confirmTrade: (bankAccount: BankAccount) => Promise<void>;
};

export const useSellFlow = ({ watch }: SellFormType): SellFlowReturn => {
    const dispatch = useDispatch();
    const rootNavigation =
        useNavigation<StackNavigationProps<RootStackParamList, RootStackRoutes>>();
    const navigation = useNavigation<NavigationProps>();
    const timer = useTimer();
    const candidateQuote = watch('quote');
    const isLoading = useSelector(selectTradingSellIsLoading);
    const sellInfo = useSelector(selectTradingSellInfo);

    const selectedQuote = useSelector(selectTradingSellSelectedQuote);

    const sendAccount = useSelector(selectSellSelectedSendAccount);

    const {
        isConsentRequested: isLegalTermsConsentRequested,
        waitForConsent: waitForLegalTermsConsent,
        resolveConsent: resolveLegalTermsConsent,
    } = useConsent();
    useConsentDenier(candidateQuote?.exchange, resolveLegalTermsConsent);

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

    const canProceed = !!candidateQuote && !!sendAccount && !isLoading;

    const giveLegalTermsConsent = useCallback(() => {
        resolveLegalTermsConsent(true);
    }, [resolveLegalTermsConsent]);

    const cancelLegalTermsConsent = useCallback(() => {
        resolveLegalTermsConsent(false);
    }, [resolveLegalTermsConsent]);

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

        const provider = candidateQuote.exchange
            ? sellInfo?.providerInfos[candidateQuote.exchange]
            : undefined;

        if (provider?.flow === 'BANK_ACCOUNT') {
            dispatch(tradingSellActions.setFormStep('BANK_ACCOUNT'));
        } else {
            dispatch(tradingSellActions.setFormStep('SEND_TRANSACTION'));
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
            navigation.navigate(TradingStackRoutes.TradingSellPreview);
        };

        await dispatch(
            sellThunks.selectQuoteThunk({
                quote: candidateQuote,
                timer,
                userConsent: waitForLegalTermsConsent,
                nextStep,
                onCancel: () => {},
            }),
        );
    }, [
        candidateQuote,
        isLoading,
        navigation,
        dispatch,
        timer,
        waitForLegalTermsConsent,
        sellInfo,
        doSellTrade,
    ]);

    return {
        canProceed,
        isLegalTermsConsentRequested,
        giveLegalTermsConsent,
        cancelLegalTermsConsent,
        doSellTrade,
        confirmTrade,
        selectQuote,
    };
};
