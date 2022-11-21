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
    ScreenHeader,
    StackToTabCompositeProps,
} from '@suite-native/navigation';

type AccountImportHeaderProps = {
    activeStep: 1 | 2 | 3;
};

const closeButtonStyle = prepareNativeStyle(_ => ({
    position: 'absolute',
    right: 0,
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
        <ScreenHeader
            rightIcon={
                isOnboardingFinished && (
                    <Box style={applyStyle(closeButtonStyle)}>
                        <IconButton
                            iconName="close"
                            colorScheme="gray"
                            onPress={handleCloseOnboarding}
                            size="large"
                            isRounded
                        />
                    </Box>
                )
            }
            titleComponent={<StepsProgressBar activeStep={activeStep} numberOfSteps={3} />}
            hasGoBackIcon={false}
        />
    );
};
