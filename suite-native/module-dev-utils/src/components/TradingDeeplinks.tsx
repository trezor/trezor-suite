import { useNavigation } from '@react-navigation/native';

import { Button, HStack, Text, VStack } from '@suite-native/atoms';
import {
    type AppTabsParamList,
    AppTabsRoutes,
    type RootStackParamList,
    type RootStackRoutes,
    type StackToTabCompositeNavigationProp,
    TradingStackRoutes,
} from '@suite-native/navigation';

type NavigationProp = StackToTabCompositeNavigationProp<
    RootStackParamList,
    RootStackRoutes.DevUtils,
    AppTabsParamList
>;

export const TradingDeeplinks = () => {
    const { navigate } = useNavigation<NavigationProp>();

    return (
        <VStack>
            <Text variant="body-md" color="contentPrimary">
                Deeplinks
            </Text>
            <HStack>
                <Button
                    intent="neutral"
                    priority="secondary"
                    size="medium"
                    onPress={() => {
                        navigate(AppTabsRoutes.TradeStack, {
                            screen: TradingStackRoutes.Trading,
                            params: { tradingType: 'buy' },
                        });
                    }}
                >
                    Go to Buy
                </Button>
                <Button
                    intent="neutral"
                    priority="secondary"
                    size="medium"
                    onPress={() => {
                        navigate(AppTabsRoutes.TradeStack, {
                            screen: TradingStackRoutes.Trading,
                            params: { tradingType: 'exchange' },
                        });
                    }}
                >
                    Go to Swap
                </Button>
            </HStack>
        </VStack>
    );
};
