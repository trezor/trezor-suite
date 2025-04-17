import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';
import { BuyTrade, BuyTradeResponse, FormResponse } from 'invity-api';

import { buyThunks, selectTradingBuyIsLoading, tradingBuyActions } from '@suite-common/trading';
import { EventType, analytics } from '@suite-native/analytics';
import {
    RootStackParamList,
    RootStackRoutes,
    StackNavigationProps,
    StackToStackCompositeNavigationProps,
    TradingStackParamList,
    TradingStackRoutes,
} from '@suite-native/navigation';
import { useTimer } from '@trezor/react-utils';

import { TradingBuyForm } from '../types';
import { clearTradingBuyFormQuoteData } from './useTradingBuyForm';
import { buildTradingUrl, getSourceForForm } from '../utils/tradeFormUtils';
import { getSelectedSymbolFromBuyForm } from '../utils/tradeableAssetUtils';

type NavigationProps = StackToStackCompositeNavigationProps<
    TradingStackParamList,
    TradingStackRoutes.ReceiveAccounts,
    RootStackParamList
>;

let consentResolver: ((confirmed: boolean) => void) | null = null;

const waitForConsent = (): Promise<boolean> =>
    new Promise(resolve => {
        consentResolver = resolve;
    });

const resolveConsent = (confirmed: boolean) => {
    consentResolver?.(confirmed);
    consentResolver = null;
};

const reportTradeConfirmation = () => {
    analytics.report({
        type: EventType.TradingConfirmTrade,
        payload: {
            type: 'buy',
        },
    });
};

export const useTradingBuyFlow = (form: TradingBuyForm) => {
    const dispatch = useDispatch();
    const isLoading = useSelector(selectTradingBuyIsLoading);

    const timer = useTimer();
    const navigation = useNavigation<NavigationProps>();
    const rootNavigation =
        useNavigation<StackNavigationProps<RootStackParamList, RootStackRoutes>>();
    const [isConsentRequested, setIsConsentRequested] = useState(false);

    const [candidateQuote, receiveAccount] = form.watch(['quote', 'receiveAccount']);

    const canProceed = !isLoading && !!candidateQuote;

    const selectReceiveAccount = () => {
        const selectedNetworkSymbol = getSelectedSymbolFromBuyForm(form);
        if (selectedNetworkSymbol) {
            navigation.navigate(TradingStackRoutes.ReceiveAccounts, {
                symbol: selectedNetworkSymbol,
            });
        }
    };

    const handleConsent = {
        give: () => {
            resolveConsent(true);
            setIsConsentRequested(false);
        },
        cancel: () => {
            resolveConsent(false);
            setIsConsentRequested(false);
        },
        request: async (_provider: string, _cryptoCurrency: string) => {
            setIsConsentRequested(true);

            return await waitForConsent();
        },
    };

    const handleWebview = (formData: FormResponse['form'], returnUrl: string) => {
        const source = getSourceForForm(formData);
        if (!source) {
            return;
        }

        rootNavigation.navigate(RootStackRoutes.TradingWebView, {
            closeCallbackUrl: returnUrl,
            source,
        });
    };

    const handleTradeResponse = (response: BuyTradeResponse, returnUrl: string) => {
        if (response.trade.paymentId) {
            dispatch(tradingBuyActions.saveTransactionId(response.trade.paymentId));
        }

        if (response.tradeForm) {
            handleWebview(response.tradeForm.form, returnUrl);
        }

        clearTradingBuyFormQuoteData(form);
    };

    const confirmTrade = async (quote: BuyTrade, address: string) => {
        if (!receiveAccount) {
            return;
        }

        const returnUrl = buildTradingUrl({
            actionType: 'trade',
            tradeType: 'buy',
            orderId: quote.orderId,
        });

        await dispatch(
            buyThunks.confirmTradeThunk({
                address,
                returnUrl,
                account: receiveAccount.account,
                processResponseData: response => handleTradeResponse(response, returnUrl),
                triggerAnalyticsTradeConfirmation: reportTradeConfirmation,
            }),
        );
    };

    const selectQuote = async () => {
        if (!candidateQuote || isLoading) {
            return;
        }

        if (!receiveAccount || (!!receiveAccount.account.addresses && !receiveAccount.address)) {
            selectReceiveAccount();

            return;
        }

        setIsConsentRequested(false);

        const returnUrl = buildTradingUrl({
            actionType: 'quote',
            tradeType: 'buy',
            orderId: candidateQuote.orderId,
        });

        await dispatch(
            buyThunks.selectQuoteThunk({
                quote: candidateQuote,
                timer,
                returnUrl,
                loginRequest: formResponse => handleWebview(formResponse, returnUrl),
                userConsent: handleConsent.request,
                nextStep: () => {
                    confirmTrade(
                        candidateQuote,
                        receiveAccount.address?.address ?? receiveAccount.account.descriptor,
                    );
                },
            }),
        );
    };

    return {
        canProceed,
        selectQuote,
        isConsentRequested,
        giveConsent: handleConsent.give,
        cancelConsent: handleConsent.cancel,
    };
};
