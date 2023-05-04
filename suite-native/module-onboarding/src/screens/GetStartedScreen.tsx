import React from 'react';

import { useNavigation } from '@react-navigation/native';

import {
    AccountsImportStackRoutes,
    OnboardingStackParamList,
    OnboardingStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';
import { AlertBox, Box, Image } from '@suite-native/atoms';
import { useActiveColorScheme } from '@suite-native/theme';

import { OnboardingFooter } from '../components/OnboardingFooter';
import { OnboardingScreen } from '../components/OnboardingScreen';

type NavigationProps = StackToStackCompositeNavigationProps<
    OnboardingStackParamList,
    OnboardingStackRoutes.GetStarted,
    RootStackParamList
>;

export const GetStartedScreen = () => {
    const navigation = useNavigation<NavigationProps>();
    const colorScheme = useActiveColorScheme();

    const handleRedirect = () => {
        navigation.navigate(RootStackRoutes.AccountsImport, {
            screen: AccountsImportStackRoutes.SelectNetwork,
        });
    };

    const getImageSource = () => {
        if (colorScheme === 'dark') {
            // eslint-disable-next-line global-require
            return require('../assets/darkDashboard.png');
        }
        // eslint-disable-next-line global-require
        return require('../assets/dashboard.png');
    };

    return (
        <OnboardingScreen
            title="Get started"
            subtitle="Click below, sync your coin addresses, and view your portfolio balance."
            activeStep={4}
        >
            <Box />
            <Box alignItems="center" marginBottom="extraLarge">
                <Image source={getImageSource()} />
            </Box>
            <AlertBox title="This requires Trezor hardware wallet and access to the Trezor Suite app." />
            <OnboardingFooter redirectTarget={handleRedirect} isLastStep />
        </OnboardingScreen>
    );
};
