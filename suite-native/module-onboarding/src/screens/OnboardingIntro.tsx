import React from 'react';
import { View } from 'react-native';

import { Screen, StackProps } from '@suite-native/navigation';
import { Button, Text } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { OnboardingStackParamList, OnboardingStackRoutes } from '../navigation/routes';

const introStyle = prepareNativeStyle(_ => ({
    flex: 1,
    justifyContent: 'flex-end',
}));

const introHeadlineStyle = prepareNativeStyle(utils => ({
    paddingLeft: 71,
    paddingRight: 71,
    marginBottom: utils.spacings.large,
}));

const introDescriptionStyle = prepareNativeStyle(_ => ({
    paddingLeft: 79,
    paddingRight: 79,
    marginBottom: 52,
    alignItems: 'center',
}));

const introImagePreviewStyle = prepareNativeStyle(utils => ({
    width: 387,
    height: 297,
    backgroundColor: utils.colors.green,
    alignItems: 'center',
    justifyContent: 'center',
}));

const introButtonStyle = prepareNativeStyle(_ => ({
    position: 'relative',
    bottom: 10,
    paddingLeft: 29,
    paddingRight: 29,
    paddingBottom: 39,
}));

export const OnboardingIntro = ({
    navigation,
}: StackProps<OnboardingStackParamList, OnboardingStackRoutes.Onboarding>) => {
    const { applyStyle } = useNativeStyles();

    return (
        <Screen backgroundColor="black" hasStatusBar={false}>
            <View style={applyStyle(introStyle)}>
                <Text variant="titleMedium" color="white" style={applyStyle(introHeadlineStyle)}>
                    Import only shits
                </Text>
                <View style={applyStyle(introDescriptionStyle)}>
                    <Text variant="body" color="gray600">
                        To add that shit, navigate to:
                    </Text>
                    <Text variant="body" color="gray600">
                        Account {'>'} Details {'>'} Show xPUB
                    </Text>
                </View>
                <View style={applyStyle(introImagePreviewStyle)}>
                    <Text variant="body" color="white">
                        TODO screenshot from Suite
                    </Text>
                </View>
                <View style={applyStyle(introButtonStyle)}>
                    <Button
                        colorScheme="white"
                        onPress={() => {
                            navigation.navigate(OnboardingStackRoutes.OnboardingXPub);
                        }}
                        size="large"
                    >
                        Got em
                    </Button>
                </View>
            </View>
        </Screen>
    );
};
