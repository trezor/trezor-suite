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
            numberOfSteps={4}
            title="Sync my coins"
            hasGoBackIcon={false}
        />
    );
};
