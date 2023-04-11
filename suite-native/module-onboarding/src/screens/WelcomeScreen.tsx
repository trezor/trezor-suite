import React, { ReactNode } from 'react';

import { useNavigation } from '@react-navigation/native';

import { Box, Text, Image } from '@suite-native/atoms';
import {
    OnboardingStackParamList,
    OnboardingStackRoutes,
    Screen,
    StackNavigationProps,
} from '@suite-native/navigation';
import { Icon } from '@trezor/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Color } from '@trezor/theme';

import { OnboardingFooter } from '../components/OnboardingFooter';

const titleStyle = prepareNativeStyle(utils => ({
    maxWidth: '60%',
    textAlign: 'center',
    marginBottom: 12,
    ...utils.typography.titleMedium,
}));

const imageStyle = prepareNativeStyle(() => ({
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
}));

const TitleText = ({ children, color }: { children: ReactNode; color: Color }) => (
    <Text variant="titleMedium" color={color} style={{ textAlign: 'center' }}>
        {children}
    </Text>
);

export const WelcomeScreen = () => {
    const navigation =
        useNavigation<
            StackNavigationProps<OnboardingStackParamList, OnboardingStackRoutes.Welcome>
        >();
    const { applyStyle } = useNativeStyles();

    const handleRedirect = () => {
        navigation.navigate(OnboardingStackRoutes.TrackBalances);
    };

    return (
        <>
            <Screen>
                <Box flex={1} justifyContent="space-between" alignItems="center">
                    <Box flex={2} />
                    <Box alignItems="center" flex={1}>
                        <Box alignItems="center">
                            <Box marginBottom="large">
                                <Icon size="large" name="trezor" color="backgroundPrimaryDefault" />
                            </Box>
                            <Text style={applyStyle(titleStyle)}>
                                <TitleText color="textDefault">Welcome to</TitleText>
                                <TitleText color="textSecondaryHighlight"> Trezor Suite</TitleText>
                                <TitleText color="textSubdued"> Lite</TitleText>
                            </Text>
                        </Box>
                        <Text color="textSubdued">Simple and secure portfolio tracker</Text>
                    </Box>
                    <OnboardingFooter redirectTarget={handleRedirect} />
                </Box>
            </Screen>
            <Box style={applyStyle(imageStyle)}>
                <Image
                    // eslint-disable-next-line global-require
                    source={require('../assets/rectangles.png')}
                />
            </Box>
        </>
    );
};
