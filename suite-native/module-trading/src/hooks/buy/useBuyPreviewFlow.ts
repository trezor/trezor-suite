import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';
import type { BuyTradeResponse } from 'invity-api';

import { useServices } from '@suite-common/dependency-injection';
import { useDispatch } from '@suite-common/redux-utils';
import {
    type TradingRootState,
    buyThunks,
    selectTradingBuyIsLoading,
    selectTradingBuyReceiveAccountKey,
    selectTradingBuyReceiveAddress,
    selectTradingBuySelectedQuote,
    selectTradingCoinInfoByCryptoId,
    tradingBuyActions,
} from '@suite-common/trading';
import { type AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import { events, selectNativeAnalyticsDep } from '@suite-native/analytics';
import {
    type RootStackParamList,
    type StackToStackCompositeNavigationProps,
    type TradingStackParamList,
    type TradingStackRoutes,
} from '@suite-native/navigation';
import { buildTradingUrl, useBrowserAuth } from '@suite-native/trading-browser-auth';
import { tradingActions } from '@suite-native/trading-state';

import { getAnalyticsTradingBuyPayload } from '../../utils/buy/quotesUtils';

type NavigationProps = StackToStackCompositeNavigationProps<
    TradingStackParamList,
    TradingStackRoutes.Trading,
    RootStackParamList
>;

export const useBuyPreviewFlow = () => {
    const { analytics } = useServices(selectNativeAnalyticsDep);
    const dispatch = useDispatch();
    const navigation = useNavigation<NavigationProps>();

    const selectedQuote = useSelector(selectTradingBuySelectedQuote);
    const receiveAccountKey = useSelector(selectTradingBuyReceiveAccountKey);
    const receiveAddress = useSelector(selectTradingBuyReceiveAddress);
    const isLoading = useSelector(selectTradingBuyIsLoading);
    const receiveAccount = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, receiveAccountKey),
    );
    const coinInfo = useSelector((state: TradingRootState) =>
        selectTradingCoinInfoByCryptoId(state, selectedQuote?.receiveCurrency),
    );
    const quoteAnalyticsData = getAnalyticsTradingBuyPayload({
        quote: selectedQuote,
        coinInfo,
    });

    const { openBrowserForFormData } = useBrowserAuth('buy');

    const canProceed = !isLoading && !!selectedQuote && !!receiveAccount && !!receiveAddress;

    const reportTradeConfirmation = () => {
        analytics.report({
            type: events.tradingConfirmTradeEvent.name,
            payload: {
                type: 'buy',
            },
        });
    };

    const handleTradeResponse = async (response: BuyTradeResponse, returnUrl: string) => {
        if (response.trade.paymentId) {
            dispatch(tradingBuyActions.saveTransactionId(response.trade.paymentId));
        }

        if (response.tradeForm) {
            await openBrowserForFormData(response.tradeForm.form, returnUrl);
        }

        navigation.popToTop();
        dispatch(tradingBuyActions.clearQuotesAndParams());

        if (response.trade.orderId) {
            dispatch(tradingActions.setTradeOrderIdToBeOpened(response.trade.orderId));
        }
    };

    const confirmTrade = async () => {
        if (!canProceed || !selectedQuote || !receiveAccount || !receiveAddress) {
            return;
        }

        analytics.report({
            type: events.tradingBuyEvent.name,
            payload: {
                step: 'buy-preview',
                action: 'continue',
                ...quoteAnalyticsData,
            },
        });

        const returnUrl = buildTradingUrl({
            actionType: 'trade',
            tradeType: 'buy',
            orderId: selectedQuote.orderId,
        });

        await dispatch(
            buyThunks.confirmTradeThunk({
                address: receiveAddress,
                returnUrl,
                account: receiveAccount,
                processResponseData: response => handleTradeResponse(response, returnUrl),
                triggerAnalyticsTradeConfirmation: reportTradeConfirmation,
            }),
        );
    };

    return {
        canProceed,
        isLoading,
        confirmTrade,
    };
};
