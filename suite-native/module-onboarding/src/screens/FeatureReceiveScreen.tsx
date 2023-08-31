import { useNavigation } from '@react-navigation/native';

import {
    OnboardingStackParamList,
    OnboardingStackRoutes,
    StackNavigationProps,
} from '@suite-native/navigation';
import { Box } from '@suite-native/atoms';

import { OnboardingFooter } from '../components/OnboardingFooter';
import { OnboardingScreen } from '../components/OnboardingScreen';
import { CoinsSvg } from '../components/CoinsSvg';

export const FeatureReceiveScreen = () => {
    const navigation =
        useNavigation<
            StackNavigationProps<
                OnboardingStackParamList,
                OnboardingStackRoutes.AboutReceiveCoinsFeature
            >
        >();

    const handleRedirect = () => {
        navigation.navigate(OnboardingStackRoutes.AnalyticsConsent);
    };

    return (
        <OnboardingScreen
            title="Receive coins"
            subtitle="Generate addresses and QR codes to receive crypto."
            activeStep={2}
        >
            <Box alignItems="center" flex={1} justifyContent="center">
                <CoinsSvg />
            </Box>
            <OnboardingFooter redirectTarget={handleRedirect} />
        </OnboardingScreen>
    );
};
