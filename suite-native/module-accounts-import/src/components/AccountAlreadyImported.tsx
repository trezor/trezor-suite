import React from 'react';

import { useNavigation } from '@react-navigation/core';

import { Box, Button, Divider, Text } from '@suite-native/atoms';
import { AccountListItem } from '@suite-native/accounts';
import { Account } from '@suite-common/wallet-types';
import {
    AccountsImportStackParamList,
    AccountsImportStackRoutes,
    AppTabsRoutes,
    HomeStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    StackToTabCompositeProps,
} from '@suite-native/navigation';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { AccountImportSummarySection } from './AccountImportSummarySection';

type AccountImportImportedAccountProps = {
    account: Account;
};

const contentWrapperStyle = prepareNativeStyle(() => ({
    marginBottom: 114,
}));

export const AccountAlreadyImported = ({ account }: AccountImportImportedAccountProps) => {
    const { applyStyle } = useNativeStyles();
    const navigation = useNavigation<NavigationProp>();

    const handleImportAnotherAsset = () =>
        navigation.navigate(RootStackRoutes.AccountsImport, {
            screen: AccountsImportStackRoutes.XpubScan,
            params: {},
        });

    const handleNavigateToDashboard = () =>
        navigation.navigate(RootStackRoutes.AppTabs, {
            screen: AppTabsRoutes.HomeStack,
            params: {
                screen: HomeStackRoutes.Home,
            },
        });

    return (
        <AccountImportSummarySection title="Asset already imported">
            <Box flex={1} justifyContent="flex-end">
                <Box style={applyStyle(contentWrapperStyle)}>
                    <Box marginBottom="medium">
                        <Text>Here's what you've got in your account.</Text>
                    </Box>
                    {account && <AccountListItem account={account} />}
                </Box>
                <Box>
                    <Box marginBottom="large" marginTop="large">
                        <Divider />
                    </Box>
                    <Box>
                        <Box marginBottom="medium">
                            <Button
                                size="large"
                                colorScheme="gray"
                                onPress={handleImportAnotherAsset}
                            >
                                Import another asset
                            </Button>
                        </Box>
                        <Button size="large" onPress={handleNavigateToDashboard}>
                            Continue to app
                        </Button>
                    </Box>
                </Box>
            </Box>
        </AccountImportSummarySection>
    );
};
