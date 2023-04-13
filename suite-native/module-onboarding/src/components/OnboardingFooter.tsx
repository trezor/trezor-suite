import React from 'react';
import { useDispatch } from 'react-redux';

import { useRoute } from '@react-navigation/native';

import { Box, Button, Stack, Text } from '@suite-native/atoms';
import { Link } from '@suite-native/link';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { OnboardingStackRoutes } from '@suite-native/navigation';
import { setIsOnboardingFinished } from '@suite-native/module-settings';

const wrapperStyle = prepareNativeStyle(() => ({
    width: '90%',
}));

type OnboardigFooterProps = {
    redirectTarget: () => void;
    isLastStep?: boolean;
};

export const OnboardingFooter = ({ redirectTarget, isLastStep = false }: OnboardigFooterProps) => {
    const { applyStyle } = useNativeStyles();
    const route = useRoute();
    const dispatch = useDispatch();

    const buttonTitle = route.name === OnboardingStackRoutes.Welcome ? 'Get started' : 'Next';

    const handlePress = () => {
        if (isLastStep) {
            dispatch(setIsOnboardingFinished());
        }
        redirectTarget();
    };

    return (
        <Stack spacing="large" style={applyStyle(wrapperStyle)}>
            <Box flexDirection="row" alignItems="center" justifyContent="center">
                <Text variant="hint">
                    Don’t have a Trezor? <Link href="https://trezor.io/" label="Get one here." />
                </Text>
            </Box>
            <Button onPress={handlePress}>{buttonTitle}</Button>
        </Stack>
    );
};
