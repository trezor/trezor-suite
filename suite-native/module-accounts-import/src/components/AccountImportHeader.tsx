import React from 'react';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/core';

import { Box, IconButton } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { selectIsOnboardingFinished } from '@suite-native/module-settings';
import {
    AccountsImportStackParamList,
    AccountsImportStackRoutes,
    AccountsStackRoutes,
    AppTabsRoutes,
    HomeStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    ScreenHeader,
    StackToTabCompositeProps,
} from '@suite-native/navigation';

type AccountImportHeaderProps = {
    activeStep: 1 | 2 | 3 | 4;
    origin?: string;
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

export const AccountImportHeader = ({ activeStep, origin }: AccountImportHeaderProps) => {
    const { applyStyle } = useNativeStyles();
    const navigation = useNavigation<NavigationProp>();
    const isOnboardingFinished = useSelector(selectIsOnboardingFinished);

    const handleCloseOnboarding = () => {
        if (origin === HomeStackRoutes.Home) {
            navigation.navigate(RootStackRoutes.AppTabs, {
                screen: AppTabsRoutes.HomeStack,
                params: {
                    screen: HomeStackRoutes.Home,
                },
            });
        } else if (origin === AccountsStackRoutes.Accounts) {
            navigation.navigate(RootStackRoutes.AppTabs, {
                screen: AppTabsRoutes.AccountsStack,
                params: {
                    screen: AccountsStackRoutes.Accounts,
                },
            });
        } else {
            navigation.goBack();
        }
    };

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
            activeStep={activeStep}
            numberOfSteps={4}
            title="XPUB Import"
            hasGoBackIcon={false}
        />
    );
};
