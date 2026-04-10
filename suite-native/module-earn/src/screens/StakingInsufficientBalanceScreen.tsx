import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';

import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { getStakingLimitsByNetworkSymbol, parseAccountKey } from '@suite-common/wallet-utils';
import { Box, Button, Pictogram, Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    AppTabsRoutes,
    type RootStackParamList,
    RootStackRoutes,
    Screen,
    ScreenHeader,
    type StackNavigationProps,
    TradingStackRoutes,
} from '@suite-native/navigation';

type NavigationProp = StackNavigationProps<
    RootStackParamList,
    RootStackRoutes.StakingInsufficientBalance
>;

export const StakingInsufficientBalanceScreen = () => {
    const route =
        useRoute<RouteProp<RootStackParamList, RootStackRoutes.StakingInsufficientBalance>>();
    const navigation = useNavigation<NavigationProp>();
    const { accountKey } = route.params;
    const { networkSymbol } = parseAccountKey(accountKey);
    const displaySymbol = getNetworkDisplaySymbol(networkSymbol);
    const limits = getStakingLimitsByNetworkSymbol(networkSymbol);
    const minAmount = limits?.MIN_AMOUNT_FOR_STAKING?.toString() ?? '0';

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
        <Screen header={<ScreenHeader closeActionType="back" />}>
            <VStack flex={1} justifyContent="space-between">
                <Box flex={1} justifyContent="center" alignItems="center">
                    <VStack spacing="sp24" alignItems="center">
                        <Pictogram variant="success" icon="coinSlash" />
                        <VStack spacing="sp12" alignItems="center">
                            <Text variant="headline-md" textAlign="center">
                                <Translation
                                    id="earn.stakingInsufficientBalance.title"
                                    values={{ displaySymbol }}
                                />
                            </Text>
                            <Text variant="body-md" color="textSubdued" textAlign="center">
                                <Translation
                                    id="earn.stakingInsufficientBalance.subtitle"
                                    values={{ minAmount, displaySymbol }}
                                />
                            </Text>
                        </VStack>
                    </VStack>
                </Box>
                <VStack spacing="sp12">
                    <Button onPress={handleGetCoin}>
                        <Translation
                            id="earn.stakingInsufficientBalance.getButton"
                            values={{ displaySymbol }}
                        />
                    </Button>
                    <Button intent="neutral" priority="secondary" onPress={handleCancel}>
                        <Translation id="generic.buttons.cancel" />
                    </Button>
                </VStack>
            </VStack>
        </Screen>
    );
};
