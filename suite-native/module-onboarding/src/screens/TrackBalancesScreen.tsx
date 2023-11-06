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
import { GraphSvg } from '../components/GraphSvg';

const TrackBalancesScreenWithDevice = () => {
    const { translate } = useTranslate();

    const navigation =
        useNavigation<
            StackNavigationProps<OnboardingStackParamList, OnboardingStackRoutes.TrackBalances>
        >();

    return (
        <OnboardingScreen
            title={translate('moduleOnboarding.trackBalancesScreen.usb.title')}
            subtitle={translate('moduleOnboarding.trackBalancesScreen.usb.subtitle')}
            activeStep={3}
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
            <Box alignSelf="center" flex={2} justifyContent="center" paddingHorizontal="s">
                <GraphSvg />
            </Box>
        </OnboardingScreen>
    );
};

const TrackBalancesScreenNoDevice = () => {
    const { translate } = useTranslate();

    const navigation =
        useNavigation<
            StackNavigationProps<OnboardingStackParamList, OnboardingStackRoutes.TrackBalances>
        >();

    return (
        <OnboardingScreen
            title={translate('moduleOnboarding.trackBalancesScreen.noUsb.title')}
            subtitle={translate('moduleOnboarding.trackBalancesScreen.noUsb.subtitle')}
            activeStep={1}
            footer={
                <OnboardingFooter
                    redirectTarget={() =>
                        navigation.navigate(OnboardingStackRoutes.AboutReceiveCoinsFeature)
                    }
                    onBack={navigation.goBack}
                    backButtonTitle={translate('generic.buttons.back')}
                    nextButtonTitle={translate('generic.buttons.next')}
                />
            }
        >
            <GraphSvg />
        </OnboardingScreen>
    );
};

export const TrackBalancesScreen = () => {
    const { isUsbDeviceConnectFeatureEnabled } = useIsUsbDeviceConnectFeatureEnabled();

    return isUsbDeviceConnectFeatureEnabled ? (
        <TrackBalancesScreenWithDevice />
    ) : (
        <TrackBalancesScreenNoDevice />
    );
};
