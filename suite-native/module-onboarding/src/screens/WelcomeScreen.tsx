import { useMemo } from 'react';
import { Dimensions, ImageBackground } from 'react-native';

import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

import { useIsUsbDeviceConnectFeatureEnabled } from '@suite-native/feature-flags';
import { Link } from '@suite-native/link';
import { Box, Text, TrezorSuiteLiteHeader } from '@suite-native/atoms';
import {
    OnboardingStackParamList,
    OnboardingStackRoutes,
    Screen,
    StackNavigationProps,
} from '@suite-native/navigation';
import { useTranslate, Translation } from '@suite-native/intl';
import { Icon } from '@suite-common/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { useActiveColorScheme } from '@suite-native/theme';

import { OnboardingFooter } from '../components/OnboardingFooter';

const titleStyle = prepareNativeStyle(_ => ({
    textAlign: 'center',
    marginBottom: 12,
    alignItems: 'center',
}));

const imageContainerStyle = prepareNativeStyle(() => ({
    position: 'absolute',
    left: 0,
    top: 0,
    width: '100%',
    aspectRatio: 390 / 296,
}));

const contentStyle = prepareNativeStyle(utils => ({
    width: '100%',
    height: '100%',
    backgroundColor: utils.colors.backgroundSurfaceElevation0,
    alignItems: 'center',
}));

const cardStyle = prepareNativeStyle(utils => ({
    marginTop: utils.spacings.medium,
    padding: utils.spacings.large,
    borderRadius: 20,
    borderColor: utils.colors.borderSubtleInverted,
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: utils.borders.widths.s,
    width: Dimensions.get('window').width - 48,
}));

export const WelcomeScreen = () => {
    const { translate } = useTranslate();

    const { isUsbDeviceConnectFeatureEnabled } = useIsUsbDeviceConnectFeatureEnabled();

    const navigation =
        useNavigation<
            StackNavigationProps<OnboardingStackParamList, OnboardingStackRoutes.Welcome>
        >();

    const { applyStyle, utils } = useNativeStyles();

    const colorScheme = useActiveColorScheme();

    const handleRedirect = () => {
        navigation.navigate(
            isUsbDeviceConnectFeatureEnabled
                ? OnboardingStackRoutes.ConnectTrezor
                : OnboardingStackRoutes.TrackBalances,
        );
    };

    const isDarkMode = colorScheme === 'dark';

    const getImageSource = useMemo(() => {
        if (isDarkMode) {
            return require('../assets/darkRectangles.png');
        }
        return require('../assets/rectangles.png');
    }, [isDarkMode]);

    return (
        <Box style={applyStyle(contentStyle)}>
            <ImageBackground
                source={getImageSource}
                resizeMode="cover"
                style={applyStyle(imageContainerStyle)}
            />
            <Screen isScrollable={false} backgroundColor="transparent" isHeaderDisplayed={false}>
                <LinearGradient
                    style={applyStyle(cardStyle)}
                    colors={[
                        utils.colors.gradientNeutralBottomFadeSurfaceElevation1Start,
                        utils.colors.gradientNeutralBottomFadeSurfaceElevation1End,
                    ]}
                >
                    <Box flex={0.7} />
                    <Box alignItems="center" flex={1}>
                        <Box alignItems="center">
                            <Box marginBottom="large">
                                <Icon size="extraLarge" name="trezor" color="iconDefault" />
                            </Box>
                            <Box style={applyStyle(titleStyle)}>
                                <Text variant="titleMedium" textAlign="center">
                                    <Translation id="moduleOnboarding.welcomeScreen.welcome" />
                                </Text>
                                <TrezorSuiteLiteHeader textVariant="titleMedium" />
                            </Box>
                        </Box>
                        <Text color="textSubdued" textAlign="center">
                            {translate('moduleOnboarding.welcomeScreen.subtitle')}
                        </Text>
                    </Box>
                    <Text variant="hint" textAlign="center">
                        <Translation
                            id="moduleOnboarding.welcomeScreen.trezorLink"
                            values={{
                                trezorLink: chunks => (
                                    <Link href="https://trezor.io" label={chunks} />
                                ),
                            }}
                        />
                    </Text>
                </LinearGradient>
                <Box alignItems="center" marginTop="large">
                    <OnboardingFooter
                        redirectTarget={handleRedirect}
                        nextButtonTitle={translate('moduleOnboarding.welcomeScreen.nextButton')}
                    />
                </Box>
            </Screen>
        </Box>
    );
};
