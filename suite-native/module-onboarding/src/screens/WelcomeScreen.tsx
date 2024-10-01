import { useNavigation } from '@react-navigation/native';

import { FeatureFlag, useFeatureFlag } from '@suite-native/feature-flags';
import { Link } from '@suite-native/link';
import { Box, Text, TrezorSuiteLiteHeader } from '@suite-native/atoms';
import {
    OnboardingStackParamList,
    OnboardingStackRoutes,
    StackNavigationProps,
} from '@suite-native/navigation';
import { Translation } from '@suite-native/intl';
import { Icon } from '@suite-common/icons-deprecated';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { OnboardingFooter } from '../components/OnboardingFooter';
import { OnboardingScreen } from '../components/OnboardingScreen';

const titleStyle = prepareNativeStyle(_ => ({
    textAlign: 'center',
    marginBottom: 12,
    alignItems: 'center',
}));

const trezorLinkStyle = prepareNativeStyle(utils => ({
    paddingBottom: utils.spacings.sp24,
    justifyContent: 'flex-end',
}));

export const WelcomeScreen = () => {
    const [isUsbDeviceConnectFeatureEnabled] = useFeatureFlag(FeatureFlag.IsDeviceConnectEnabled);

    const navigation =
        useNavigation<
            StackNavigationProps<OnboardingStackParamList, OnboardingStackRoutes.Welcome>
        >();

    const { applyStyle } = useNativeStyles();

    const handleRedirect = () => {
        navigation.navigate(
            isUsbDeviceConnectFeatureEnabled
                ? OnboardingStackRoutes.ConnectTrezor
                : OnboardingStackRoutes.TrackBalances,
        );
    };

    return (
        <OnboardingScreen
            footer={
                <OnboardingFooter
                    redirectTarget={handleRedirect}
                    nextButtonTitle={<Translation id="moduleOnboarding.welcomeScreen.nextButton" />}
                />
            }
        >
            <Box flex={1} />
            <Box alignItems="center" justifyContent="center">
                <Box alignItems="center">
                    <Box marginBottom="sp24">
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
                    <Translation id="moduleOnboarding.welcomeScreen.subtitle" />
                </Text>
            </Box>
            <Box flex={1} style={applyStyle(trezorLinkStyle)}>
                <Text variant="hint" color="textSubdued" textAlign="center">
                    <Translation
                        id="moduleOnboarding.welcomeScreen.trezorLink"
                        values={{
                            trezorLink: chunks => (
                                <Link
                                    href="https://trezor.io"
                                    label={chunks}
                                    textColor="textSecondaryHighlight"
                                />
                            ),
                        }}
                    />
                </Text>
            </Box>
        </OnboardingScreen>
    );
};
