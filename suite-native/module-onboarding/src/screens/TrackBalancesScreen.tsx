import React from 'react';

import { useNavigation } from '@react-navigation/native';

import {
    OnboardingStackParamList,
    OnboardingStackRoutes,
    StackNavigationProps,
} from '@suite-native/navigation';
import { Box } from '@suite-native/atoms';

import { OnboardingFooter } from '../components/OnboardingFooter';
import { OnboardingScreen } from '../components/OnboardingScreen';
import { GraphSvg } from '../components/GraphSvg';

export const TrackBalancesScreen = () => {
    const navigation =
        useNavigation<
            StackNavigationProps<OnboardingStackParamList, OnboardingStackRoutes.TrackBalances>
        >();

    const handleRedirect = () => {
        navigation.navigate(OnboardingStackRoutes.AboutReceiveCoinsFeature);
    };

    return (
        <OnboardingScreen
            title="Track balances"
            subtitle="Easily sync your coin addresses and keep up with the crypto on your hardware wallet."
            activeStep={1}
        >
            <Box alignSelf="center" flex={2} justifyContent="center">
                <GraphSvg />
            </Box>
            <OnboardingFooter redirectTarget={handleRedirect} />
        </OnboardingScreen>
    );
};
