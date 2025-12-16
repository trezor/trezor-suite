import { useCallback, useEffect } from 'react';
import { ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { useDispatch, useSelector } from 'react-redux';

import { useNavigation, useRoute } from '@react-navigation/native';
import { useLinkingURL } from 'expo-linking';
import { WebViewSource } from 'react-native-webview/lib/WebViewTypes';

import { TradingRootState, selectTradingTradeByOrderId } from '@suite-common/trading';
import { AccountsRootState, DeviceRootState, selectAccountByKey } from '@suite-common/wallet-core';
import { Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    RootStackParamList,
    RootStackRoutes,
    Screen,
    ScreenHeader,
    StackProps,
} from '@suite-native/navigation';
import { DebugModeCopyableText } from '@suite-native/trading-debug';
import { tradingActions } from '@suite-native/trading-state';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { useTradingAnalyticReportCallback } from '../hooks/general/useTradingAnalyticReportCallback';
import { useWatchTrade } from '../hooks/general/useWatchTrade';
import { doesUrlContainCloseCallbackUrl } from '../utils/general/utils';

type RouteProps = StackProps<RootStackParamList, RootStackRoutes.TradingWebView>['route'];

const webViewStyle = prepareNativeStyle(_ => ({ flex: 1 }));

export const TradingWebViewScreen = () => {
    const {
        params: { source, tradingType, closeCallbackUrl, orderId },
    } = useRoute<RouteProps>();
    const navigation = useNavigation();
    const { applyStyle } = useNativeStyles();
    const dispatch = useDispatch();
    const receivedDeeplinkUrl = useLinkingURL();
    const trade = useSelector((state: TradingRootState) =>
        selectTradingTradeByOrderId(state, orderId ?? ''),
    );
    const account = useSelector((state: AccountsRootState & DeviceRootState) =>
        selectAccountByKey(
            state,
            trade &&
                ('selectedAccountKey' in trade ? trade.selectedAccountKey : trade.sendAccountKey),
        ),
    );

    const reportToAnalytics = useTradingAnalyticReportCallback(trade?.tradeType);

    useEffect(() => {
        reportToAnalytics('webview', 'visit');
    }, [reportToAnalytics]);

    useWatchTrade({
        accountKey: account?.key ?? undefined,
        orderId: trade?.data.orderId ?? undefined,
        isInProgress: true,
    });

    // when url contains closeCallbackUrl or TRADING_URL_DEFAULT_BACK, go back and mark the trade to be opened for buy
    const checkForGoBackOnUrl = useCallback(
        (url: string | null) => {
            const urlString = url ?? '';
            if (doesUrlContainCloseCallbackUrl(urlString, closeCallbackUrl)) {
                if (orderId && tradingType === 'buy') {
                    dispatch(tradingActions.setTradeOrderIdToBeOpened(orderId));
                }
                navigation.goBack();

                return false;
            }

            return true;
        },
        [closeCallbackUrl, dispatch, navigation, orderId, tradingType],
    );

    useEffect(() => {
        checkForGoBackOnUrl(receivedDeeplinkUrl);
    }, [checkForGoBackOnUrl, receivedDeeplinkUrl]);

    if (!source?.uri && !source?.html) {
        return (
            <Screen
                header={<ScreenHeader closeActionType="close" />}
                noHorizontalPadding
                noBottomPadding
            >
                <Text>
                    <Translation id="generic.unknownError" />
                </Text>
            </Screen>
        );
    }

    const sourceData: WebViewSource = source.uri ? { uri: source.uri } : { html: source.html! };

    return (
        <Screen
            header={<ScreenHeader closeActionType="close" />}
            noHorizontalPadding
            noBottomPadding
        >
            <DebugModeCopyableText text={source.uri || 'no URI'} title="URI:" />
            <WebView
                style={applyStyle(webViewStyle)}
                source={{ ...sourceData }}
                onShouldStartLoadWithRequest={(request: { url: string }) =>
                    checkForGoBackOnUrl(request.url)
                }
                startInLoadingState={true}
                renderLoading={() => <ActivityIndicator size="large" />}
            />
        </Screen>
    );
};
