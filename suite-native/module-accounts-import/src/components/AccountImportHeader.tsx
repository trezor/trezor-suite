import React from 'react';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/core';

import { Box, IconButton } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
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
import { selectUserHasAccounts } from '@suite-common/wallet-core';

type AccountImportHeaderProps = {
    activeStep: 1 | 2 | 3 | 4;
};

const NUMBER_OF_STEPS = 4;

const closeButtonStyle = prepareNativeStyle(_ => ({
    position: 'absolute',
    right: 0,
}));

type NavigationProp = StackToTabCompositeProps<
    AccountsImportStackParamList,
    AccountsImportStackRoutes.AccountImportSummary,
    RootStackParamList
>;

export const AccountImportHeader = ({ activeStep }: AccountImportHeaderProps) => {
    const { applyStyle } = useNativeStyles();
    const navigation = useNavigation<NavigationProp>();
    const userHasAccounts = useSelector(selectUserHasAccounts);

    const handleCloseOnboarding = () => {
        navigation.navigate(RootStackRoutes.AppTabs, {
            screen: AppTabsRoutes.HomeStack,
            params: {
                screen: HomeStackRoutes.Home,
            },
        });
    };

    // Screen title is hidden in the last screen.
    const screenTitle = activeStep !== NUMBER_OF_STEPS ? 'Sync my coins' : null;

    return (
        <ScreenHeader
            rightIcon={
                userHasAccounts && (
                    <Box style={applyStyle(closeButtonStyle)}>
                        <IconButton
                            iconName="close"
                            colorScheme="tertiaryElevation0"
                            onPress={handleCloseOnboarding}
                            size="medium"
                        />
                    </Box>
                )
            }
            activeStep={activeStep}
            numberOfSteps={NUMBER_OF_STEPS}
            content={screenTitle}
            hasGoBackIcon={false}
        />
    );
};
