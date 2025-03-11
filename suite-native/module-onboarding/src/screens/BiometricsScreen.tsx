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

        // FIXME: Hotfix temporary solution.
        // Timeout is needed to ensure that navigation event already finishes before changing the redux state.
        // Situation when the onboarding screen was still focused but the state was already changed made `useHandleDeviceConnection`
        // to display the device disconnected alert even if it should not be displayed.
        setTimeout(() => {
            dispatch(setIsOnboardingFinished());
        }, 500);
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
