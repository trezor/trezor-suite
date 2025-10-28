import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';
import type { BuyTrade, BuyTradeResponse, FormResponse } from 'invity-api';

import { invariant } from '@suite-common/suite-utils';
import {
    TradingRootState,
    buyThunks,
    selectTradingBuyIsLoading,
    selectTradingCoinInfoByCryptoId,
    tradingBuyActions,
} from '@suite-common/trading';
import { EventType, analytics } from '@suite-native/analytics';
import {
    RootStackParamList,
    RootStackRoutes,
    StackNavigationProps,
    StackToStackCompositeNavigationProps,
    TradingStackParamList,
    TradingStackRoutes,
} from '@suite-native/navigation';
import { getSymbolFromTradeableAsset } from '@suite-native/trading-atoms';
import { BuyFormType } from '@suite-native/trading-types';
import { useNullTimer } from '@trezor/react-utils';

import { clearBuyFormQuoteData } from './useBuyForm';
import { getAnalyticsTradingBuyPayload } from '../../utils/buy/quotesUtils';
import { buildTradingUrl, getSourceForForm } from '../../utils/general/formUtils';
import {
    getReceiveAccountAddressText,
    isFullySelectedReceiveAccount,
} from '../../utils/general/receiveAccountUtils';
import { useConsent } from '../general/useConsent';
import { useConsentDenier } from '../general/useConsentDenier';

type NavigationProps = StackToStackCompositeNavigationProps<
    TradingStackParamList,
    TradingStackRoutes.ReceiveAccounts,
    RootStackParamList
>;

const reportTradeConfirmation = () => {
    analytics.report({
        type: EventType.TradingConfirmTrade,
        payload: {
            type: 'buy',
        },
    });
};

export const useBuyFlow = (form: BuyFormType) => {
    const dispatch = useDispatch();
    const isLoading = useSelector(selectTradingBuyIsLoading);
    const [asset, candidateQuote, receiveAccount] = form.watch([
        'asset',
        'quote',
        'receiveAccount',
    ]);

    const timer = useNullTimer();
    const navigation = useNavigation<NavigationProps>();
    const rootNavigation =
        useNavigation<StackNavigationProps<RootStackParamList, RootStackRoutes>>();

    const { isConsentRequested, waitForConsent, resolveConsent } = useConsent();
    useConsentDenier(candidateQuote?.exchange, resolveConsent);

    const coinInfo = useSelector((state: TradingRootState) =>
        selectTradingCoinInfoByCryptoId(state, candidateQuote?.receiveCurrency),
    );

    const canProceed = !isLoading && !!candidateQuote;

    const quoteAnalyticsData = getAnalyticsTradingBuyPayload({
        quote: candidateQuote,
        coinInfo,
    });

    const selectReceiveAccount = () => {
        const selectedNetworkSymbol = getSymbolFromTradeableAsset(asset);
        if (selectedNetworkSymbol) {
            navigation.navigate(TradingStackRoutes.ReceiveAccounts, {
                symbol: selectedNetworkSymbol,
                tradingType: 'buy',
            });
        }
    };

    const giveConsent = useCallback(() => {
        resolveConsent(true);

        analytics.report({
            type: EventType.TradingBuy,
            payload: {
                step: 'buy-terms-modal',
                action: 'continue',
                ...quoteAnalyticsData,
            },
        });
    }, [resolveConsent, quoteAnalyticsData]);

    const cancelConsent = useCallback(() => {
        resolveConsent(false);

        analytics.report({
            type: EventType.TradingBuy,
            payload: {
                step: 'buy-terms-modal',
                action: 'cancel',
                ...quoteAnalyticsData,
            },
        });
    }, [resolveConsent, quoteAnalyticsData]);

    const handleWebview = (formData: FormResponse['form'], returnUrl: string) => {
        const source = getSourceForForm(formData);
        if (!source) {
            return;
        }

        rootNavigation.navigate(RootStackRoutes.TradingWebView, {
            closeCallbackUrl: returnUrl,
            tradingType: 'buy',
            source,
            orderId: candidateQuote?.orderId,
        });
    };

    const handleTradeResponse = (response: BuyTradeResponse, returnUrl: string) => {
        if (response.trade.paymentId) {
            dispatch(tradingBuyActions.saveTransactionId(response.trade.paymentId));
        }

        if (response.tradeForm) {
            handleWebview(response.tradeForm.form, returnUrl);
        }

        clearBuyFormQuoteData(form);
    };

    const confirmTrade = async (quote: BuyTrade, address: string) => {
        if (!receiveAccount) {
            return;
        }

        const returnUrl = buildTradingUrl({
            actionType: 'trade',
            tradeType: 'buy',
            orderId: quote.orderId,
            exchange: quote.exchange,
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

        analytics.report({
            type: EventType.TradingBuy,
            payload: {
                step: 'buy-form',
                action: 'continue',
                ...quoteAnalyticsData,
            },
        });

        if (!isFullySelectedReceiveAccount(receiveAccount)) {
            selectReceiveAccount();

            analytics.report({
                type: EventType.TradingBuy,
                payload: {
                    step: 'account-selection',
                    action: 'continue',
                    ...quoteAnalyticsData,
                },
            });

            return;
        }

        const addressText = getReceiveAccountAddressText(receiveAccount);
        invariant(addressText, 'addressText is not defined');

        const returnUrl = buildTradingUrl({
            actionType: 'quote',
            tradeType: 'buy',
            orderId: candidateQuote.orderId,
            exchange: candidateQuote.exchange,
        });

        await dispatch(
            buyThunks.selectQuoteThunk({
                quote: candidateQuote,
                timer,
                returnUrl,
                loginRequest: formResponse => handleWebview(formResponse, returnUrl),
                userConsent: waitForConsent,
                nextStep: () => {
                    confirmTrade(candidateQuote, addressText);
                },
            }),
        );
    };

    return {
        canProceed,
        selectQuote,
        isConsentRequested,
        giveConsent,
        cancelConsent,
    };
};
