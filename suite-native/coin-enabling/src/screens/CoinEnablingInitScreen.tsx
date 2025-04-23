import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { useDispatch, useSelector } from 'react-redux';

import { A } from '@mobily/ts-belt';
import { useNavigation } from '@react-navigation/native';

import { EventType, analytics } from '@suite-native/analytics';
import { Box, Button, Text, VStack } from '@suite-native/atoms';
import {
    applyDiscoveryChangesThunk,
    selectDeviceEnabledDiscoveryNetworkSymbols,
    setIsCoinEnablingInitFinished,
} from '@suite-native/discovery';
import { Translation } from '@suite-native/intl';
import {
    AppTabsRoutes,
    HomeStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    Screen,
    ScreenFooterGradient,
    StackNavigationProps,
    useHandleHardwareBackNavigation,
} from '@suite-native/navigation';

import { DiscoveryCoinsFilter } from '../components/DiscoveryCoinsFilter';

type NavigationProps = StackNavigationProps<RootStackParamList, RootStackRoutes.CoinEnablingInit>;

export const CoinEnablingInitScreen = () => {
    const dispatch = useDispatch();
    const navigation = useNavigation<NavigationProps>();
    useHandleHardwareBackNavigation();

    const enabledNetworkSymbols = useSelector(selectDeviceEnabledDiscoveryNetworkSymbols);

    const handleSave = () => {
        dispatch(setIsCoinEnablingInitFinished(true));
        if (enabledNetworkSymbols.length > 0) {
            dispatch(setIsCoinEnablingInitFinished(true));
            dispatch(applyDiscoveryChangesThunk());
            analytics.report({
                type: EventType.CoinEnablingInitState,
                payload: { enabledNetworks: enabledNetworkSymbols },
            });

            navigation.navigate(RootStackRoutes.AppTabs, {
                screen: AppTabsRoutes.HomeStack,
                params: {
                    screen: HomeStackRoutes.Home,
                },
            });
        }
    };

    const canBeSaved = A.isNotEmpty(enabledNetworkSymbols);

    return (
        <Screen
            header={
                <VStack paddingHorizontal="sp16" paddingVertical="sp16">
                    <Text variant="titleSmall">
                        <Translation id="moduleSettings.coinEnabling.initialSetup.title" />
                    </Text>
                    <Text color="textSubdued">
                        <Translation id="moduleSettings.coinEnabling.initialSetup.subtitle" />
                    </Text>
                </VStack>
            }
            footer={
                canBeSaved && (
                    <Animated.View entering={SlideInDown} exiting={SlideOutDown}>
                        <ScreenFooterGradient />
                        <Box marginHorizontal="sp16" marginBottom="sp16">
                            <Button onPress={handleSave} testID="@coin-enabling/button-save">
                                <Translation id="moduleSettings.coinEnabling.initialSetup.button" />
                            </Button>
                        </Box>
                    </Animated.View>
                )
            }
        >
            <Box>
                <DiscoveryCoinsFilter allowDeselectLastCoin={true} allowChangeAnalytics={false} />
            </Box>
        </Screen>
    );
};
