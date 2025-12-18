import { useNavigation, useRoute } from '@react-navigation/native';

import { Button, Text, VStack } from '@suite-native/atoms';
import {
    RootStackParamList,
    RootStackRoutes,
    Screen,
    ScreenHeader,
    StackProps,
} from '@suite-native/navigation';

import { useProviderWebViewLifecycle } from '../hooks/general/providerConfirmation/useProviderWebViewLifecycle';

type RouteProps = StackProps<RootStackParamList, RootStackRoutes.TradingWebView>['route'];

const CLOSE_WEBVIEW_TEST_ID = '@trading/webview/close';

export const TradingWebViewScreen = () => {
    const {
        params: { tradingType },
    } = useRoute<RouteProps>();
    useProviderWebViewLifecycle(tradingType);
    const navigation = useNavigation();

    return (
        <Screen
            header={<ScreenHeader closeActionType="close" />}
            noHorizontalPadding
            noBottomPadding
        >
            <VStack flex={1} justifyContent="center" alignItems="center" spacing="sp24">
                <Text variant="titleMedium">E2E:Webview content</Text>
                <Button
                    onPress={() => {
                        navigation.goBack();
                    }}
                    testID={CLOSE_WEBVIEW_TEST_ID}
                >
                    E2E:Close webview
                </Button>
            </VStack>
        </Screen>
    );
};
