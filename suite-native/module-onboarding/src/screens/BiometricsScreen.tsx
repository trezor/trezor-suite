import { useSelector } from 'react-redux';

import { events } from '@suite-native/analytics';
import { Box, Button, HStack, Text, VStack } from '@suite-native/atoms';
import { BiometricsSvg, useBiometricsSettings } from '@suite-native/biometrics';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import {
    type OnboardingStackParamList,
    OnboardingStackRoutes,
    Screen,
    ScreenHeader,
    type StackProps,
} from '@suite-native/navigation';
import { useAnalytics } from '@suite-native/services';
import { selectIsTradingResidenceCheckEnabled } from '@suite-native/trading-state';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { useExitOnboardingFlow } from '../hooks/useExitOnboardingFlow';

export type BiometricsScreenProps = StackProps<
    OnboardingStackParamList,
    OnboardingStackRoutes.Biometrics
>;

const titleStyle = prepareNativeStyle(_ => ({
    // this title should have smaller letter spacing by design.
    letterSpacing: -1.4,
}));

export const BiometricsScreen = ({ navigation }: BiometricsScreenProps) => {
    const { applyStyle } = useNativeStyles();
    const analytics = useAnalytics();
    const { toggleBiometricsOption } = useBiometricsSettings();
    const exitOnboardingFlow = useExitOnboardingFlow();

    const shouldDisplayTradingLocationScreen = useSelector(selectIsTradingResidenceCheckEnabled);

    const enableBiometrics = async () => {
        const result = await toggleBiometricsOption();
        if (result === 'enabled') {
            analytics.report({
                type: events.biometricsChangeEvent.name,
                payload: {
                    enabled: true,
                    origin: 'bottomSheet',
                },
            });
        }
    };

    const handleRedirect = () => {
        if (shouldDisplayTradingLocationScreen) {
            navigation.navigate(OnboardingStackRoutes.TradingLocation);
        } else {
            exitOnboardingFlow();
        }
    };

    const handleEnableButtonPress = async () => {
        await enableBiometrics();
        handleRedirect();
    };

    const handleNotNowButtonPress = () => {
        handleRedirect();
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
                        <Text style={applyStyle(titleStyle)} variant="headline-md">
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
