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
        <VStack paddingTop="sp16">
            <Text variant="body" color="textDefault">
                Trading deeplinks
            </Text>
            <HStack>
                <Button
                    colorScheme="tertiaryElevation0"
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
                    colorScheme="tertiaryElevation0"
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
