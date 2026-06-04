import { useState } from 'react';
import Animated, { LinearTransition, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { useDispatch } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { useServices } from '@suite-common/dependency-injection';
import { changeCoinVisibility } from '@suite-common/wallet-core';
import { events, selectNativeAnalyticsDep } from '@suite-native/analytics';
import {
    AnimatedBox,
    AnimatedInlineAlertBox,
    Box,
    Button,
    ScreenFooterGradient,
    VStack,
} from '@suite-native/atoms';
import { Form, type UseFormReturn, useForm, useWatch } from '@suite-native/forms';
import { Translation } from '@suite-native/intl';
import {
    type AuthorizeDeviceStackParamList,
    AuthorizeDeviceStackRoutes,
    DynamicScreenHeader,
    type RootStackParamList,
    RootStackRoutes,
    Screen,
    type StackToStackCompositeNavigationProps,
    useInterceptNativeNavigation,
} from '@suite-native/navigation';

import {
    type CoinEnablingFormValues,
    coinEnablingFormValidationSchema,
    getNetworkSymbolsFromEnabledCoins,
} from '../coinEnablingSchema';
import { DiscoveryCoinsFilter } from '../components/DiscoveryCoinsFilter';

type NavigationProps = StackToStackCompositeNavigationProps<
    AuthorizeDeviceStackParamList,
    AuthorizeDeviceStackRoutes.CoinEnablingInit,
    RootStackParamList
>;

type CoinEnablingInitFooterProps = {
    onSubmit: () => void;
};

const useHasEnabledCoin = (control: UseFormReturn<CoinEnablingFormValues>['control']) =>
    useWatch({
        control,
        name: 'enabledCoins',
        defaultValue: {},
        compute: (enabledCoins: CoinEnablingFormValues['enabledCoins']) =>
            Object.values(enabledCoins ?? {}).some(Boolean),
    });

const CoinEnablingInitFooter = ({ onSubmit }: CoinEnablingInitFooterProps) => (
    <Animated.View entering={SlideInDown} exiting={SlideOutDown}>
        <ScreenFooterGradient />
        <Box marginHorizontal="sp16" marginBottom="sp16">
            <Button onPress={onSubmit} testID="@coin-enabling/button-save">
                <Translation id="generic.buttons.confirm" />
            </Button>
        </Box>
    </Animated.View>
);

export const CoinEnablingInitScreen = () => {
    const dispatch = useDispatch();
    const { analytics } = useServices(selectNativeAnalyticsDep);
    const navigation = useNavigation<NavigationProps>();
    useInterceptNativeNavigation();

    const [isAlertDismissed, setIsAlertDismissed] = useState(false);

    const form = useForm<CoinEnablingFormValues>({
        defaultValues: {
            enabledCoins: {},
        },
        validation: coinEnablingFormValidationSchema,
    });
    const hasEnabledCoin = useHasEnabledCoin(form.control);

    const handleSubmit = form.handleSubmit((values: CoinEnablingFormValues) => {
        const enabledCoins = getNetworkSymbolsFromEnabledCoins(values.enabledCoins);

        enabledCoins.forEach(symbol => {
            dispatch(changeCoinVisibility({ symbol, shouldBeVisible: true }));
        });

        analytics.report({
            type: events.coinEnablingInitStateEvent.name,
            payload: { enabledNetworks: enabledCoins },
        });

        navigation.popTo(RootStackRoutes.AuthorizeDeviceStack, {
            screen: AuthorizeDeviceStackRoutes.ConnectingDevice,
        });
    });

    return (
        <Screen
            header={
                <DynamicScreenHeader
                    title={<Translation id="networks.initialSetup.title" />}
                    subtitle={<Translation id="networks.initialSetup.subtitle" />}
                    closeActionType="close"
                />
            }
            footer={hasEnabledCoin && <CoinEnablingInitFooter onSubmit={handleSubmit} />}
        >
            <VStack spacing="sp16">
                {!isAlertDismissed && (
                    <AnimatedInlineAlertBox
                        title={<Translation id="networks.initialSetup.banner" />}
                        variant="neutral"
                        buttonIcon="x"
                        onButtonPress={() => setIsAlertDismissed(true)}
                    />
                )}
                <AnimatedBox layout={LinearTransition}>
                    <Form form={form}>
                        <DiscoveryCoinsFilter />
                    </Form>
                </AnimatedBox>
            </VStack>
        </Screen>
    );
};
