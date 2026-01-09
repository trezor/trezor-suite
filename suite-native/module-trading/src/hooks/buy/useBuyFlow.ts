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
import { EventType } from '@suite-native/analytics';
import {
    RootStackParamList,
    RootStackRoutes,
    StackNavigationProps,
    StackToStackCompositeNavigationProps,
    TradingStackParamList,
    TradingStackRoutes,
} from '@suite-native/navigation';
import { useLegacyAnalytics } from '@suite-native/services';
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

type NavigationProps = StackToStackCompositeNavigationProps<
    TradingStackParamList,
    TradingStackRoutes.ReceiveAccounts,
    RootStackParamList
>;

export const useBuyFlow = (form: BuyFormType) => {
    const legacyAnalytics = useLegacyAnalytics();
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

    const coinInfo = useSelector((state: TradingRootState) =>
        selectTradingCoinInfoByCryptoId(state, candidateQuote?.receiveCurrency),
    );

    const canProceed = !isLoading && !!candidateQuote;

    const quoteAnalyticsData = getAnalyticsTradingBuyPayload({
        quote: candidateQuote,
        coinInfo,
    });

    const reportTradeConfirmation = () => {
        legacyAnalytics.report({
            type: EventType.TradingConfirmTrade,
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

        legacyAnalytics.report({
            type: EventType.TradingBuy,
            payload: {
                step: 'buy-form',
                action: 'continue',
                ...quoteAnalyticsData,
            },
        });

        if (!isFullySelectedReceiveAccount(receiveAccount)) {
            selectReceiveAccount();

            legacyAnalytics.report({
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
