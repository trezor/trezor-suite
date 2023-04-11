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

import { OnboardingFooter } from '../components/OnboardingFooter';
import { OnboardingScreen } from '../components/OnboardingScreen';

type NavigationProps = StackToStackCompositeNavigationProps<
    OnboardingStackParamList,
    OnboardingStackRoutes.GetStarted,
    RootStackParamList
>;

export const GetStartedScreen = () => {
    const navigation = useNavigation<NavigationProps>();

    const handleRedirect = () => {
        navigation.navigate(RootStackRoutes.AccountsImport, {
            screen: AccountsImportStackRoutes.SelectNetwork,
        });
    };

    return (
        <OnboardingScreen
            title="Get started"
            subtitle="Click below, sync your coin addresses, and view your portfolio balance."
            activeStep={4}
        >
            <Box />
            <Box alignItems="center" marginBottom="extraLarge">
                <Image
                    //  eslint-disable-next-line global-require
                    source={require('../assets/dashboard.png')}
                />
            </Box>
            <AlertBox title="This requires your Trezor hardware wallet and access to the Trezor Suite desktop app." />

            <OnboardingFooter redirectTarget={handleRedirect} isLastStep />
        </OnboardingScreen>
    );
};
