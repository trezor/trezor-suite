import { useNavigation } from '@react-navigation/native';

import { useIsUsbDeviceConnectFeatureEnabled } from '@suite-native/feature-flags';
import {
    OnboardingStackParamList,
    OnboardingStackRoutes,
    StackNavigationProps,
} from '@suite-native/navigation';
import { Box } from '@suite-native/atoms';
import { useTranslate } from '@suite-native/intl';

import { OnboardingFooter } from '../components/OnboardingFooter';
import { OnboardingScreen } from '../components/OnboardingScreen';
import { CoinsSvg } from '../components/CoinsSvg';

const FeatureReceiveScreenWithDevice = () => {
    const { translate } = useTranslate();

    const navigation =
        useNavigation<
            StackNavigationProps<
                OnboardingStackParamList,
                OnboardingStackRoutes.AboutReceiveCoinsFeature
            >
        >();

    return (
        <OnboardingScreen
            title={translate('moduleOnboarding.featureReceiveScreen.usb.title')}
            subtitle={translate('moduleOnboarding.featureReceiveScreen.usb.subtitle')}
            activeStep={2}
            footer={
                <OnboardingFooter
                    redirectTarget={() => navigation.navigate(OnboardingStackRoutes.TrackBalances)}
                    onBack={navigation.goBack}
                    backButtonTitle={translate('generic.buttons.back')}
                    nextButtonTitle={translate('generic.buttons.next')}
                />
            }
        >
            <Box alignItems="center" flex={1} justifyContent="center">
                <CoinsSvg />
            </Box>
        </OnboardingScreen>
    );
};

const FeatureReceiveScreenNoDevice = () => {
    const { translate } = useTranslate();

    const navigation =
        useNavigation<
            StackNavigationProps<
                OnboardingStackParamList,
                OnboardingStackRoutes.AboutReceiveCoinsFeature
            >
        >();

    return (
        <OnboardingScreen
            title={translate('moduleOnboarding.featureReceiveScreen.noUsb.title')}
            subtitle={translate('moduleOnboarding.featureReceiveScreen.noUsb.subtitle')}
            activeStep={2}
            footer={
                <OnboardingFooter
                    redirectTarget={() =>
                        navigation.navigate(OnboardingStackRoutes.AnalyticsConsent)
                    }
                    onBack={navigation.goBack}
                    backButtonTitle={translate('generic.buttons.back')}
                    nextButtonTitle={translate('generic.buttons.continue')}
                />
            }
        >
            <CoinsSvg />
        </OnboardingScreen>
    );
};

export const FeatureReceiveScreen = () => {
    const { isUsbDeviceConnectFeatureEnabled } = useIsUsbDeviceConnectFeatureEnabled();

    return isUsbDeviceConnectFeatureEnabled ? (
        <FeatureReceiveScreenWithDevice />
    ) : (
        <FeatureReceiveScreenNoDevice />
    );
};
