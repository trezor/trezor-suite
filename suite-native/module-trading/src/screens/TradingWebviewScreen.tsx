import { ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';

import { useNavigation, useRoute } from '@react-navigation/native';
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

type RouteProps = StackProps<RootStackParamList, RootStackRoutes.TradingWebView>['route'];

const webViewStyle = prepareNativeStyle(_ => ({ flex: 1 }));

export const TradingWebViewScreen = () => {
    const {
        params: { source, closeCallbackUrl },
    } = useRoute<RouteProps>();
    const navigation = useNavigation();
    const { applyStyle } = useNativeStyles();

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
                // go back on closeCallbackUrl
                onShouldStartLoadWithRequest={(request: { url: string }) => {
                    if (closeCallbackUrl && request.url.startsWith(closeCallbackUrl)) {
                        navigation.goBack();

                        return false; // Prevent WebView from loading the URL
                    }

                    return true; // Allow navigation
                }}
                startInLoadingState={true}
                renderLoading={() => <ActivityIndicator size="large" />}
            />
        </Screen>
    );
};
