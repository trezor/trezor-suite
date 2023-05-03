import React from 'react';

import { useNavigation } from '@react-navigation/native';

import { Button, VStack } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import {
    AccountsImportStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    StackNavigationProps,
} from '@suite-native/navigation';

const importStyle = prepareNativeStyle(_ => ({
    marginTop: 12,
}));

export const DashboardNavigationButtons = () => {
    const navigation = useNavigation<StackNavigationProps<RootStackParamList, RootStackRoutes>>();
    const { applyStyle } = useNativeStyles();

    const handleImportAssets = () => {
        navigation.navigate(RootStackRoutes.AccountsImport, {
            screen: AccountsImportStackRoutes.SelectNetwork,
        });
    };

    const handleReceive = () => {
        navigation.navigate(RootStackRoutes.ReceiveModal, {});
    };

    return (
        <VStack style={applyStyle(importStyle)} spacing="small">
            <Button
                data-testID="@home/portfolio/sync-coins-button"
                colorScheme="tertiaryElevation0"
                size="large"
                onPress={handleImportAssets}
            >
                Sync my coins
            </Button>
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
