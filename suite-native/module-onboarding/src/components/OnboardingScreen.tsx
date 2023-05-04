import React, { ReactNode } from 'react';

import { Screen } from '@suite-native/navigation';
import { Box } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { OnboardingScreenHeader } from './OnboardingScreenHeader';

type OnboardingScreenProps = {
    children: ReactNode;
    title: string;
    subtitle?: string;
    activeStep: number;
    isScrollable?: boolean;
};

const contentStyle = prepareNativeStyle(() => ({
    width: '100%',
}));

export const OnboardingScreen = ({
    children,
    title,
    subtitle,
    activeStep,
    isScrollable = false,
}: OnboardingScreenProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <Screen isScrollable={isScrollable}>
            <OnboardingScreenHeader title={title} subtitle={subtitle} activeStep={activeStep} />
            <Box
                alignItems="center"
                flex={1}
                justifyContent="space-between"
                style={applyStyle(contentStyle)}
            >
                {children}
            </Box>
        </Screen>
    );
};
