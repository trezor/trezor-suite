import { useDispatch } from 'react-redux';

import { CommonActions } from '@react-navigation/core';

import { setIsOnboardingFinished } from '@suite-native/settings';
import {
    HomeStackRoutes,
    OnboardingStackParamList,
    OnboardingStackRoutes,
    RootStackRoutes,
    Screen,
    ScreenHeader,
    StackProps,
} from '@suite-native/navigation';
import { Box, Button, HStack, Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { EventType, analytics } from '@suite-native/analytics';
import { BiometricsSvg, useBiometricsSettings } from '@suite-native/biometrics';
import { Icon } from '@suite-native/icons';

export const BiometricsScreen = ({
    navigation,
}: StackProps<OnboardingStackParamList, OnboardingStackRoutes.Biometrics>) => {
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
                <Box flex={1} alignItems="center" paddingTop="sp32">
                    <BiometricsSvg />
                </Box>
                <VStack spacing={40}>
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
                        <Text variant="titleMedium">
                            <Translation id="moduleOnboarding.biometricsScreen.description" />
                        </Text>
                    </VStack>
                    <VStack spacing="sp12">
                        <Button
                            testID="@onboarding/UserDataConsent/enable"
                            onPress={handleEnableButtonPress}
                        >
                            <Translation id="generic.buttons.enable" />
                        </Button>
                        <Button
                            colorScheme="tertiaryElevation0"
                            testID="@onboarding/Biometrics/skip"
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
