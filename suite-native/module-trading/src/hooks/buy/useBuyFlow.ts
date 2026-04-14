import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';
import type { BuyTrade, BuyTradeResponse } from 'invity-api';

import { invariant } from '@suite-common/suite-utils';
import {
    type TradingRootState,
    buyThunks,
    selectTradingBuyIsLoading,
    selectTradingCoinInfoByCryptoId,
    tradingBuyActions,
} from '@suite-common/trading';
import { events } from '@suite-native/analytics';
import {
    type RootStackParamList,
    type StackToStackCompositeNavigationProps,
    type TradingStackParamList,
    TradingStackRoutes,
} from '@suite-native/navigation';
import { useAnalytics } from '@suite-native/services';
import { getSymbolFromTradeableAsset } from '@suite-native/trading-atoms';
import { buildTradingUrl, useBrowserAuth } from '@suite-native/trading-browser-auth';
import { type BuyFormType } from '@suite-native/trading-types';

import { clearBuyFormQuoteData } from './useBuyForm';
import { getAnalyticsTradingBuyPayload } from '../../utils/buy/quotesUtils';
import {
    getReceiveAccountAddressText,
    isFullySelectedReceiveAccount,
} from '../../utils/general/receiveAccountUtils';

type NavigationProps = StackToStackCompositeNavigationProps<
    TradingStackParamList,
    TradingStackRoutes.ReceiveAccounts,
    RootStackParamList
>;

export const useBuyFlow = (form: BuyFormType) => {
    const analytics = useAnalytics();
    const dispatch = useDispatch();
    const isLoading = useSelector(selectTradingBuyIsLoading);
    const [asset, candidateQuote, receiveAccount] = form.watch([
        'asset',
        'quote',
        'receiveAccount',
    ]);

    const navigation = useNavigation<NavigationProps>();

    const coinInfo = useSelector((state: TradingRootState) =>
        selectTradingCoinInfoByCryptoId(state, candidateQuote?.receiveCurrency),
    );

    const canProceed = !isLoading && !!candidateQuote;

    const quoteAnalyticsData = getAnalyticsTradingBuyPayload({
        quote: candidateQuote,
        coinInfo,
    });

    const { openBrowserForFormData } = useBrowserAuth('buy');

    const reportTradeConfirmation = () => {
        analytics.report({
            type: events.tradingConfirmTradeEvent.name,
            payload: {
                type: 'buy',
            },
        });
    };

    const selectReceiveAccount = () => {
        const selectedNetworkSymbol = getSymbolFromTradeableAsset(asset);
        if (selectedNetworkSymbol) {
            navigation.navigate(TradingStackRoutes.ReceiveAccounts, {
                symbol: selectedNetworkSymbol,
                tradingType: 'buy',
            });
        }
    };

    const handleTradeResponse = (response: BuyTradeResponse, returnUrl: string) => {
        if (response.trade.paymentId) {
            dispatch(tradingBuyActions.saveTransactionId(response.trade.paymentId));
        }

        if (response.tradeForm) {
            openBrowserForFormData(response.tradeForm.form, returnUrl, response.trade.orderId);
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
            type: events.tradingBuyEvent.name,
            payload: {
                step: 'buy-form',
                action: 'continue',
                ...quoteAnalyticsData,
            },
        });

        if (!isFullySelectedReceiveAccount(receiveAccount)) {
            selectReceiveAccount();

            analytics.report({
                type: events.tradingBuyEvent.name,
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
        });

        await dispatch(
            buyThunks.selectQuoteThunk({
                quote: candidateQuote,
                returnUrl,
                loginRequest: formResponse =>
                    openBrowserForFormData(formResponse, returnUrl, candidateQuote.orderId),
                nextStep: () => {
                    confirmTrade(candidateQuote, addressText);
                },
            }),
        );
    };

    return {
        canProceed,
        selectQuote,
    };
};
