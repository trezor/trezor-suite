import { useNavigation } from '@react-navigation/native';

import { Button, HStack, Text, VStack } from '@suite-native/atoms';
import {
    type AppTabsParamList,
    AppTabsRoutes,
    type DevUtilsStackParamList,
    type DevUtilsStackRoutes,
    type StackToTabCompositeProps,
    TradingStackRoutes,
} from '@suite-native/navigation';

type NavigationProp = StackToTabCompositeProps<
    DevUtilsStackParamList,
    DevUtilsStackRoutes.DevUtils,
    AppTabsParamList
>;

export const TradingDeeplinks = () => {
    const { navigate } = useNavigation<NavigationProp>();

    return (
        <VStack>
            <Text variant="body-md" color="textDefault">
                Deeplinks
            </Text>
            <HStack>
                <Button
                    intent="neutral"
                    priority="secondary"
                    size="small"
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
                    size="small"
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
