import { useCallback, useEffect } from 'react';
import { ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { useDispatch } from 'react-redux';

import { useNavigation, useRoute } from '@react-navigation/native';
import { useURL } from 'expo-linking';
import { WebViewSource } from 'react-native-webview/lib/WebViewTypes';

import { Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    RootStackParamList,
    RootStackRoutes,
    Screen,
    ScreenHeader,
    StackProps,
} from '@suite-native/navigation';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { setTradeOrderIdToBeOpened } from '../tradingSlice';
import {
    TRADING_URL_DEFAULT_BACK,
    getTradeTypeActionAndOrderIdFromUrl,
} from '../utils/tradeFormUtils';

type RouteProps = StackProps<RootStackParamList, RootStackRoutes.TradingWebView>['route'];

const webViewStyle = prepareNativeStyle(_ => ({ flex: 1 }));

export const TradingWebViewScreen = () => {
    const {
        params: { source, closeCallbackUrl },
    } = useRoute<RouteProps>();
    const navigation = useNavigation();
    const { applyStyle } = useNativeStyles();
    const dispatch = useDispatch();
    const receivedDeeplinkUrl = useURL();

    // when url matches closeCallbackUrl or TRADING_URL_DEFAULT_BACK, go back and mark the trade to be opened
    const checkForGoBackOnUrl = useCallback(
        (url: string | null) => {
            const urlString = url ?? '';
            if ([closeCallbackUrl, TRADING_URL_DEFAULT_BACK].includes(urlString)) {
                const { orderId } = getTradeTypeActionAndOrderIdFromUrl(urlString);
                if (orderId) {
                    dispatch(setTradeOrderIdToBeOpened(orderId));
                }
                navigation.goBack();

                return false;
            }

            return true;
        },
        [closeCallbackUrl, dispatch, navigation],
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
