import { ReactNode } from 'react';

import { useNavigation } from '@react-navigation/native';

import { FeatureFlag, useFeatureFlag } from '@suite-native/feature-flags';
import {
    OnboardingStackParamList,
    OnboardingStackRoutes,
    StackNavigationProps,
} from '@suite-native/navigation';
import { Box } from '@suite-native/atoms';
import { TxKeyPath, useTranslate } from '@suite-native/intl';

import { OnboardingFooter } from '../components/OnboardingFooter';
import { OnboardingScreen } from '../components/OnboardingScreen';
import { GraphSvg } from '../components/GraphSvg';

type ScreenContent = {
    title: TxKeyPath;
    subtitle: TxKeyPath;
    redirectTarget: OnboardingStackRoutes;
};
const trackBalancesScreenContentMap = {
    device: {
        title: 'moduleOnboarding.trackBalancesScreen.device.title',
        subtitle: 'moduleOnboarding.trackBalancesScreen.device.subtitle',
        redirectTarget: OnboardingStackRoutes.AnalyticsConsent,
    },
    portfolioTracker: {
        title: 'moduleOnboarding.trackBalancesScreen.portfolioTracker.title',
        subtitle: 'moduleOnboarding.trackBalancesScreen.portfolioTracker.subtitle',
        redirectTarget: OnboardingStackRoutes.AboutReceiveCoinsFeature,
    },
} as const satisfies Record<'device' | 'portfolioTracker', ScreenContent>;

type NavigationProp = StackNavigationProps<
    OnboardingStackParamList,
    OnboardingStackRoutes.TrackBalances
>;

const IconWrapper = ({ children }: { children: ReactNode }) => {
    const [isUsbDeviceConnectFeatureEnabled] = useFeatureFlag(FeatureFlag.IsDeviceConnectEnabled);

    if (!isUsbDeviceConnectFeatureEnabled) return <>{children}</>;

    return (
        <Box alignSelf="center" flex={2} justifyContent="center" paddingHorizontal="small">
            {children}
        </Box>
    );
};

export const TrackBalancesScreen = () => {
    const { translate } = useTranslate();

    const [isUsbDeviceConnectFeatureEnabled] = useFeatureFlag(FeatureFlag.IsDeviceConnectEnabled);

    const navigation = useNavigation<NavigationProp>();

    const content =
        trackBalancesScreenContentMap[
            isUsbDeviceConnectFeatureEnabled ? 'device' : 'portfolioTracker'
        ];

    return (
        <OnboardingScreen
            title={translate(content.title)}
            subtitle={translate(content.subtitle)}
            activeStep={3}
            footer={
                <OnboardingFooter
                    redirectTarget={() => navigation.navigate(content.redirectTarget)}
                    onBack={navigation.goBack}
                    backButtonTitle={translate('generic.buttons.back')}
                    nextButtonTitle={translate('generic.buttons.continue')}
                />
            }
        >
            <IconWrapper>
                <GraphSvg />
            </IconWrapper>
        </OnboardingScreen>
    );
};
