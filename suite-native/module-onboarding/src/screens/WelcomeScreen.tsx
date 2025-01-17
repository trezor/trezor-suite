import { ImageBackground, StyleSheet } from 'react-native';

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

const GRADIENT_HEIGHT = getWindowHeight() / 3;

const gradientBackgroundBottomStyle = prepareNativeStyle(() => ({
    width: '100%',
    height: GRADIENT_HEIGHT,
}));

const buttonWrapperStyle = prepareNativeStyle(() => ({
    width: '100%',
    paddingBottom: 50,
}));

const textColorStyle = prepareNativeStyle(() => ({
    // the text needs to be white to be visible on image background, ignoring the theme
    color: colorVariants.dark.textDefault,
}));

export const WelcomeScreen = ({
    navigation,
}: StackProps<OnboardingStackParamList, OnboardingStackRoutes.Welcome>) => {
    const { applyStyle } = useNativeStyles();

    // 'transparent' color is not working in context of LinearGradient on iOS. RGBA has to be used instead.
    const transparentColor = hexToRgba('#000000', 0.01);

    const navigateToAnalyticsConsent = () => {
        navigation.navigate(OnboardingStackRoutes.AnalyticsConsent);
    };

    return (
        <>
            <ImageBackground
                source={require('../assets/welcomeScreenBackground.jpeg')}
                style={StyleSheet.absoluteFillObject}
                resizeMode="cover"
            >
                <Box flex={1} justifyContent="space-between">
                    <LinearGradient
                        colors={['#000000', transparentColor]}
                        style={applyStyle(gradientBackgroundBottomStyle)}
                    />
                    <LinearGradient
                        colors={[transparentColor, '#000000']}
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
                        <Button
                            onPress={navigateToAnalyticsConsent}
                            testID="@onboarding/Welcome/nextBtn"
                        >
                            <Translation id="moduleOnboarding.welcomeScreen.button" />
                        </Button>
                    </Box>
                </VStack>
            </Screen>
        </>
    );
};
