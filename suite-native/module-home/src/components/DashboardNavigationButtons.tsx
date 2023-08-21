import React from 'react';

import { useNavigation } from '@react-navigation/native';

import { Button, Divider, VStack } from '@suite-native/atoms';
import {
    AccountsImportStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    StackNavigationProps,
} from '@suite-native/navigation';

export const DashboardNavigationButtons = () => {
    const navigation = useNavigation<StackNavigationProps<RootStackParamList, RootStackRoutes>>();

    const handleImportAssets = () => {
        navigation.navigate(RootStackRoutes.AccountsImport, {
            screen: AccountsImportStackRoutes.SelectNetwork,
        });
    };

    const handleReceive = () => {
        navigation.navigate(RootStackRoutes.ReceiveModal, {});
    };

    return (
        <VStack spacing="large">
            <Button
                data-testID="@home/portfolio/sync-coins-button"
                colorScheme="tertiaryElevation0"
                size="large"
                onPress={handleImportAssets}
            >
                Sync my coins
            </Button>
            <Divider />
            <Button
                data-testID="@home/portolio/recieve-button"
                size="large"
                onPress={handleReceive}
                iconLeft="receive"
            >
                Receive
            </Button>
        </VStack>
    );
};
