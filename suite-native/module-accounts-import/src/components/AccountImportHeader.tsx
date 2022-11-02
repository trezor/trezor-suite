import React from 'react';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/core';

import { Box, IconButton, StepsProgressBar } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { selectIsOnboardingFinished } from '@suite-native/module-settings';
import {
    AccountsImportStackParamList,
    AccountsImportStackRoutes,
    AppTabsRoutes,
    HomeStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    StackToTabCompositeProps,
} from '@suite-native/navigation';

type AccountImportHeaderProps = {
    activeStep: 1 | 2 | 3;
};
const accountImportHeaderStyle = prepareNativeStyle(_ => ({
    width: '100%',
}));

const closeButtonSizeStyle = prepareNativeStyle(_ => ({
    width: 48,
    height: 48,
}));

type NavigationProp = StackToTabCompositeProps<
    AccountsImportStackParamList,
    AccountsImportStackRoutes.AccountImport,
    RootStackParamList
>;

export const AccountImportHeader = ({ activeStep }: AccountImportHeaderProps) => {
    const { applyStyle } = useNativeStyles();
    const navigation = useNavigation<NavigationProp>();
    const isOnboardingFinished = useSelector(selectIsOnboardingFinished);

    const handleCloseOnboarding = () =>
        navigation.navigate(RootStackRoutes.AppTabs, {
            screen: AppTabsRoutes.HomeStack,
            params: {
                screen: HomeStackRoutes.Home,
            },
        });

    return (
        <Box
            flexDirection="row"
            justifyContent={isOnboardingFinished ? 'space-between' : 'center'}
            alignItems="center"
            marginBottom="small"
            style={applyStyle(accountImportHeaderStyle)}
        >
            {isOnboardingFinished && <Box style={applyStyle(closeButtonSizeStyle)} />}
            <StepsProgressBar activeStep={activeStep} numberOfSteps={3} />
            {isOnboardingFinished && (
                <Box style={applyStyle(closeButtonSizeStyle)}>
                    <IconButton
                        iconName="close"
                        colorScheme="gray"
                        onPress={handleCloseOnboarding}
                        size="large"
                        isRounded
                    />
                </Box>
            )}
        </Box>
    );
};
