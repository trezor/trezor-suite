import React from 'react';

import { Screen, StackProps } from '@suite-native/navigation';
import { Button, Text } from '@suite-native/atoms';

import { OnboardingStackParamList, OnboardingStackRoutes } from '../navigation/routes';

export const OnboardingAssets = ({
    navigation,
    route,
}: StackProps<OnboardingStackParamList, OnboardingStackRoutes.OnboardingAssets>) => {
    const { accountInfo } = route.params;

    return (
        <Screen>
            <Text variant="titleMedium" color="black">
                {JSON.stringify(accountInfo, null, 2)}
            </Text>
            <Button
                onPress={() => {
                    console.log('LALALA');
                }}
                size="large"
            >
                Confirm
            </Button>
        </Screen>
    );
};
