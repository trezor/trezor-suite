import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { changeCoinVisibility } from '@suite-common/wallet-core';
import { events } from '@suite-native/analytics';
import { Box, Button, ScreenFooterGradient, Text, VStack } from '@suite-native/atoms';
import { selectDiscoveryNetworkSymbols } from '@suite-native/discovery';
import { Form, useForm } from '@suite-native/forms';
import { Translation } from '@suite-native/intl';
import {
    type AuthorizeDeviceStackParamList,
    AuthorizeDeviceStackRoutes,
    type RootStackParamList,
    RootStackRoutes,
    Screen,
    type StackToStackCompositeNavigationProps,
    useInterceptNativeNavigation,
} from '@suite-native/navigation';
import { useAnalytics } from '@suite-native/services';

import {
    type CoinEnablingFormValues,
    coinEnablingFormValidationSchema,
} from '../coinEnablingSchema';
import { DiscoveryCoinsFilter } from '../components/DiscoveryCoinsFilter';

type NavigationProps = StackToStackCompositeNavigationProps<
    AuthorizeDeviceStackParamList,
    AuthorizeDeviceStackRoutes.CoinEnablingInit,
    RootStackParamList
>;

export const CoinEnablingInitScreen = () => {
    const dispatch = useDispatch();
    const analytics = useAnalytics();
    const navigation = useNavigation<NavigationProps>();
    useInterceptNativeNavigation();

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

        analytics.report({
            type: events.coinEnablingInitStateEvent.name,
            payload: { enabledNetworks: values.enabledCoins },
        });

        navigation.popTo(RootStackRoutes.AuthorizeDeviceStack, {
            screen: AuthorizeDeviceStackRoutes.ConnectingDevice,
        });
    });

    return (
        <Screen
            header={
                <VStack paddingHorizontal="sp16" paddingVertical="sp16">
                    <Text variant="headline-sm">
                        <Translation id="moduleSettings.coinEnabling.initialSetup.title" />
                    </Text>
                    <Text color="contentSecondary">
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
