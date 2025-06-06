import { useDispatch } from 'react-redux';

import { CommonActions } from '@react-navigation/core';

import { EventType, analytics } from '@suite-native/analytics';
import { Box, Button, HStack, Text, VStack } from '@suite-native/atoms';
import { BiometricsSvg, useBiometricsSettings } from '@suite-native/biometrics';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import {
    HomeStackRoutes,
    OnboardingStackParamList,
    OnboardingStackRoutes,
    RootStackRoutes,
    Screen,
    ScreenHeader,
    StackProps,
} from '@suite-native/navigation';
import { setIsOnboardingFinished } from '@suite-native/settings';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

const titleStyle = prepareNativeStyle(_ => ({
    // this title should have smaller letter spacing by design.
    letterSpacing: -1.4,
}));

export const BiometricsScreen = ({
    navigation,
}: StackProps<OnboardingStackParamList, OnboardingStackRoutes.Biometrics>) => {
    const { applyStyle } = useNativeStyles();
    const { toggleBiometricsOption } = useBiometricsSettings();

    const dispatch = useDispatch();

    const enableBiometrics = async () => {
        const result = await toggleBiometricsOption();
        if (result === 'enabled') {
            analytics.report({
                type: EventType.BiometricsChange,
                payload: {
                    enabled: true,
                    origin: 'bottomSheet',
                },
            });
        }
    };

    const exitOnboardingFlow = () => {
        dispatch(setIsOnboardingFinished());

        // TODO: COSMETIC IMPROVEMENT: redirect to home only if there is no device connected. In case of device connected,
        // the redirect is handled in useHandleDeviceConnection hook. in reaction to the `setIsOnboardingFinished` call.
        navigation.dispatch(
            CommonActions.reset({
                index: 0,
                routes: [
                    {
                        name: RootStackRoutes.AppTabs,
                        params: {
                            screen: HomeStackRoutes.Home,
                        },
                    },
                ],
            }),
        );
    };

    const handleEnableButtonPress = async () => {
        await enableBiometrics();
        exitOnboardingFlow();
    };

    const handleNotNowButtonPress = () => {
        exitOnboardingFlow();
    };

    return (
        <Screen header={<ScreenHeader />}>
            <VStack justifyContent="space-between" flex={1}>
                <Box flex={1} alignItems="center" justifyContent="center">
                    <BiometricsSvg />
                </Box>
                <VStack spacing="sp40">
                    <VStack spacing="sp16">
                        <HStack spacing="sp8" alignItems="center">
                            <Icon
                                name="fingerprint"
                                color="textSecondaryHighlight"
                                size="mediumLarge"
                            />
                            <Text color="textSecondaryHighlight">
                                <Translation id="moduleOnboarding.biometricsScreen.title" />
                            </Text>
                        </HStack>
                        <Text style={applyStyle(titleStyle)} variant="titleMedium">
                            <Translation id="moduleOnboarding.biometricsScreen.description" />
                        </Text>
                    </VStack>
                    <VStack spacing="sp12">
                        <Button
                            testID="@onboarding/UserDataConsent/enableBtn"
                            onPress={handleEnableButtonPress}
                        >
                            <Translation id="generic.buttons.enable" />
                        </Button>
                        <Button
                            colorScheme="tertiaryElevation0"
                            testID="@onboarding/Biometrics/skipBtn"
                            onPress={handleNotNowButtonPress}
                        >
                            <Translation id="moduleOnboarding.biometricsScreen.button.notNow" />
                        </Button>
                    </VStack>
                </VStack>
            </VStack>
        </Screen>
    );
};
