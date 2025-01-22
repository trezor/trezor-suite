import { ImageBackground, StyleSheet, Image } from 'react-native';
import { useEffect, useState } from 'react';

import { LinearGradient } from 'expo-linear-gradient';

import {
    OnboardingStackParamList,
    OnboardingStackRoutes,
    Screen,
    StackProps,
} from '@suite-native/navigation';
import { Box, Button, Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { Icon } from '@suite-native/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { hexToRgba } from '@suite-common/suite-utils';
import { getWindowHeight } from '@trezor/env-utils';
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

const WELCOME_BACKGROUND = require('../assets/welcomeScreenBackground.jpeg');

export const WelcomeScreen = ({
    navigation,
}: StackProps<OnboardingStackParamList, OnboardingStackRoutes.Welcome>) => {
    const { applyStyle, utils } = useNativeStyles();
    const [isImageLoaded, setIsImageLoaded] = useState(false);

    const transparentColor = hexToRgba(utils.colors.transparent, 0.01);

    useEffect(() => {
        const prefetchImage = async () => {
            await Image.prefetch(Image.resolveAssetSource(WELCOME_BACKGROUND).uri);
            setIsImageLoaded(true);
        };
        prefetchImage();
    }, []);

    const navigateToAnalyticsConsent = () => {
        navigation.navigate(OnboardingStackRoutes.AnalyticsConsent);
    };

    return (
        <Box flex={1} style={applyStyle(screenContainerStyle)}>
            {isImageLoaded && (
                <ImageBackground
                    source={WELCOME_BACKGROUND}
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
            )}
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
