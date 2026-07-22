import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { useServices } from '@suite-common/dependency-injection';
import { invariant } from '@suite-common/suite-utils';
import {
    type TradingRootState,
    buyThunks,
    selectTradingBuyIsLoading,
    selectTradingCoinInfoByCryptoId,
    tradingBuyActions,
} from '@suite-common/trading';
import { events, selectNativeAnalyticsDep } from '@suite-native/analytics';
import { useWatch } from '@suite-native/forms';
import {
    type RootStackParamList,
    RootStackRoutes,
    type StackToStackCompositeNavigationProps,
    type TradingStackParamList,
    type TradingStackRoutes,
} from '@suite-native/navigation';
import { getSymbolFromTradeableAsset } from '@suite-native/trading-atoms';
import { buildTradingUrl, useBrowserAuth } from '@suite-native/trading-browser-auth';
import { type BuyFormType } from '@suite-native/trading-types';

import { getAnalyticsTradingBuyPayload } from '../../utils/buy/quotesUtils';
import {
    getReceiveAccountAddressText,
    isFullySelectedReceiveAccount,
} from '../../utils/general/receiveAccountUtils';

type NavigationProps = StackToStackCompositeNavigationProps<
    TradingStackParamList,
    TradingStackRoutes.Trading,
    RootStackParamList
>;

export const useBuyFlow = (form: BuyFormType) => {
    const { analytics } = useServices(selectNativeAnalyticsDep);
    const dispatch = useDispatch();
    const isLoading = useSelector(selectTradingBuyIsLoading);
    const [asset, candidateQuote, receiveAccount] = useWatch({
        control: form.control,
        name: ['asset', 'quote', 'receiveAccount'],
    });

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

    const selectReceiveAccount = () => {
        const selectedNetworkSymbol = getSymbolFromTradeableAsset(asset);
        if (selectedNetworkSymbol) {
            navigation.navigate(RootStackRoutes.ReceiveAccounts, {
                symbol: selectedNetworkSymbol,
                tradingType: 'buy',
            });
        }
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

        dispatch(tradingBuyActions.setReceiveAddress(addressText));
        dispatch(tradingBuyActions.setReceiveAccountKey(receiveAccount.account.key));

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
                    navigation.navigate(RootStackRoutes.TradingBuyPreview);
                    form.reset();
                },
            }),
        );
    };

    return {
        canProceed,
        selectQuote,
    };
};
