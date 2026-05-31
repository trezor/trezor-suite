import { type ReactNode } from 'react';

import { useNavigation } from '@react-navigation/native';

import { Box, Button, Pictogram, Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    AppTabsRoutes,
    type RootStackParamList,
    RootStackRoutes,
    type StackNavigationProps,
    TradingStackRoutes,
} from '@suite-native/navigation';

type EarnInsufficientBalanceContentProps = {
    title: ReactNode;
    subtitle: ReactNode;
    primaryButtonContent: ReactNode;
};

type NavigationProp = StackNavigationProps<RootStackParamList, RootStackRoutes>;

export const EarnInsufficientBalanceContent = ({
    title,
    subtitle,
    primaryButtonContent,
}: EarnInsufficientBalanceContentProps) => {
    const navigation = useNavigation<NavigationProp>();

    const handleGetCoin = () => {
        navigation.navigate(RootStackRoutes.AppTabs, {
            screen: AppTabsRoutes.TradeStack,
            params: {
                screen: TradingStackRoutes.Trading,
                params: { tradingType: 'exchange' },
            },
        });
    };

    const handleCancel = () => {
        navigation.goBack();
    };

    return (
        <VStack flex={1} justifyContent="space-between">
            <Box flex={1} justifyContent="center" alignItems="center">
                <VStack spacing="sp24" alignItems="center">
                    <Pictogram variant="success" icon="coinSlash" />
                    <VStack spacing="sp12" alignItems="center">
                        <Text variant="headline-md" textAlign="center">
                            {title}
                        </Text>
                        <Text variant="body-md" color="contentSecondary" textAlign="center">
                            {subtitle}
                        </Text>
                    </VStack>
                </VStack>
            </Box>
            <VStack spacing="sp12">
                <Button onPress={handleGetCoin}>{primaryButtonContent}</Button>
                <Button intent="neutral" priority="secondary" onPress={handleCancel}>
                    <Translation id="generic.buttons.cancel" />
                </Button>
            </VStack>
        </VStack>
    );
};
