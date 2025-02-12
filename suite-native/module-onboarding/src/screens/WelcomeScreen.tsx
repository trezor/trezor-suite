import { ImageBackground, StyleSheet } from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';

import { hexToRgba } from '@suite-common/suite-utils';
import { Box, Button, Text, VStack } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import {
    OnboardingStackParamList,
    OnboardingStackRoutes,
    Screen,
    StackProps,
} from '@suite-native/navigation';
import { getWindowHeight } from '@trezor/env-utils';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { colorVariants } from '@trezor/theme';

import { E2ESkipOnboardingButton } from '../components/E2ESkipOnboardingButton';

const GRADIENT_HEIGHT = getWindowHeight() / 3;
const BLACK_BACKGROUND_COLOR = '#000000';

const gradientBackgroundBottomStyle = prepareNativeStyle(() => ({
    width: '100%',
    height: GRADIENT_HEIGHT,
}));

const buttonWrapperStyle = prepareNativeStyle(utils => ({
    width: '100%',
    paddingBottom: utils.spacings.sp16,
}));

const textColorStyle = prepareNativeStyle(() => ({
    // the text needs to be white to be visible on image background, ignoring the theme
    color: colorVariants.dark.textDefault,
}));

const screenContainerStyle = prepareNativeStyle(() => ({
    // Black background is needed to keep screen dark and prevent flashing while is the image still loading.
    backgroundColor: BLACK_BACKGROUND_COLOR,
}));

export const WelcomeScreen = ({
    navigation,
}: StackProps<OnboardingStackParamList, OnboardingStackRoutes.Welcome>) => {
    const { applyStyle, utils } = useNativeStyles();

    const transparentColor = hexToRgba(utils.colors.transparent, 0.01);
    const navigateToAnalyticsConsent = () => {
        navigation.navigate(OnboardingStackRoutes.AnalyticsConsent);
    };

    return (
        <Box flex={1} style={applyStyle(screenContainerStyle)}>
            <ImageBackground
                source={require('../assets/welcomeScreenBackground.jpeg')}
                style={StyleSheet.absoluteFillObject}
                resizeMode="cover"
                fadeDuration={0}
            >
                <Box flex={1} justifyContent="space-between">
                    <LinearGradient
                        colors={[BLACK_BACKGROUND_COLOR, transparentColor]}
                        style={applyStyle(gradientBackgroundBottomStyle)}
                    />
                    <LinearGradient
                        colors={[transparentColor, BLACK_BACKGROUND_COLOR]}
                        style={applyStyle(gradientBackgroundBottomStyle)}
                    />
                </Box>
            </ImageBackground>
            <Screen isScrollable={false} backgroundColor="transparent">
                <VStack flex={1} justifyContent="flex-end" alignItems="center" spacing={48}>
                    <VStack alignItems="center" spacing="sp16">
                        <Icon name="trezorLogo" color={colorVariants.dark.textDefault} size={50} />
                        <Box alignItems="center">
                            <Text variant="titleLarge" style={applyStyle(textColorStyle)}>
                                <Translation id="generic.trezorSuite" />
                            </Text>
                            <Text variant="titleSmall" style={applyStyle(textColorStyle)}>
                                <Translation id="moduleOnboarding.welcomeScreen.subtitle" />
                            </Text>
                        </Box>
                    </VStack>
                    <Box style={applyStyle(buttonWrapperStyle)}>
                        <E2ESkipOnboardingButton />
                        <Button
                            onPress={navigateToAnalyticsConsent}
                            testID="@onboarding/Welcome/nextBtn"
                        >
                            <Translation id="moduleOnboarding.welcomeScreen.button" />
                        </Button>
                    </Box>
                </VStack>
            </Screen>
        </Box>
    );
};
