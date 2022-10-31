import React from 'react';
import { View } from 'react-native';

import {
    AccountsImportStackRoutes,
    OnboardingStackParamList,
    OnboardingStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    Screen,
    StackToStackCompositeScreenProps,
} from '@suite-native/navigation';
import { Button, Text } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

const introStyle = prepareNativeStyle(_ => ({
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
}));

const introHeadlineStyle = prepareNativeStyle(utils => ({
    alignSelf: 'center',
    marginBottom: utils.spacings.large,
}));

export const OnboardingIntroScreen = ({
    navigation,
}: StackToStackCompositeScreenProps<
    OnboardingStackParamList,
    OnboardingStackRoutes.Onboarding,
    RootStackParamList
>) => {
    const { applyStyle } = useNativeStyles();

    const handleNavigateToAccountsImport = () => {
        navigation.navigate(RootStackRoutes.AccountsImport, {
            screen: AccountsImportStackRoutes.XpubScan,
            params: {},
        });
    };

    return (
        <Screen>
            <View style={applyStyle(introStyle)}>
                <Text variant="titleMedium" style={applyStyle(introHeadlineStyle)}>
                    Onboarding
                </Text>
                <Button
                    style={{ width: '100%' }}
                    onPress={handleNavigateToAccountsImport}
                    size="large"
                >
                    Start
                </Button>
            </View>
        </Screen>
    );
};
