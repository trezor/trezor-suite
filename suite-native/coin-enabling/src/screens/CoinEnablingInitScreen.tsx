import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { changeCoinVisibility } from '@suite-common/wallet-core';
import { EventType, analytics } from '@suite-native/analytics';
import { Box, Button, Text, VStack } from '@suite-native/atoms';
import { selectDiscoveryNetworkSymbols } from '@suite-native/discovery';
import { Form, useForm } from '@suite-native/forms';
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
import { setIsCoinEnablingInitFinished } from '@suite-native/settings';

import { CoinEnablingFormValues, coinEnablingFormValidationSchema } from '../coinEnablingSchema';
import { DiscoveryCoinsFilter } from '../components/DiscoveryCoinsFilter';

type NavigationProps = StackNavigationProps<RootStackParamList, RootStackRoutes.CoinEnablingInit>;

export const CoinEnablingInitScreen = () => {
    const dispatch = useDispatch();
    const navigation = useNavigation<NavigationProps>();
    useHandleHardwareBackNavigation();

    const networkSymbols = useSelector(selectDiscoveryNetworkSymbols);

    const form = useForm<CoinEnablingFormValues>({
        defaultValues: {
            enabledCoins: [],
        },
        validation: coinEnablingFormValidationSchema,
    });
    const {
        formState: { isValid },
    } = form;

    const handleSubmit = form.handleSubmit(values => {
        values.enabledCoins.forEach(symbol => {
            dispatch(changeCoinVisibility({ symbol, shouldBeVisible: true }));
        });

        dispatch(setIsCoinEnablingInitFinished(true));

        analytics.report({
            type: EventType.CoinEnablingInitState,
            payload: { enabledNetworks: values.enabledCoins },
        });

        navigation.popTo(RootStackRoutes.AppTabs, {
            screen: AppTabsRoutes.HomeStack,
            params: {
                screen: HomeStackRoutes.Home,
            },
        });
    });

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
                isValid && (
                    <Animated.View entering={SlideInDown} exiting={SlideOutDown}>
                        <ScreenFooterGradient />
                        <Box marginHorizontal="sp16" marginBottom="sp16">
                            <Button onPress={handleSubmit} testID="@coin-enabling/button-save">
                                <Translation id="generic.buttons.confirmSelection" />
                            </Button>
                        </Box>
                    </Animated.View>
                )
            }
        >
            <Form form={form}>
                <Box>
                    <DiscoveryCoinsFilter networkSymbols={networkSymbols} />
                </Box>
            </Form>
        </Screen>
    );
};
