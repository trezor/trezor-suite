import React from 'react';

import { useNavigation } from '@react-navigation/native';

import { Button, VStack } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import {
    AccountsImportStackRoutes,
    AppTabsParamList,
    AppTabsRoutes,
    RootStackParamList,
    RootStackRoutes,
    SendReceiveStackRoutes,
    TabToStackCompositeNavigationProp,
} from '@suite-native/navigation';

const importStyle = prepareNativeStyle(_ => ({
    marginTop: 12,
}));

type DashboardNavigationProp = TabToStackCompositeNavigationProp<
    AppTabsParamList,
    AppTabsRoutes.HomeStack,
    RootStackParamList
>;

export const DashboardNavigationButtons = () => {
    const navigation = useNavigation<DashboardNavigationProp>();
    const { applyStyle } = useNativeStyles();

    const handleReceive = () => {
        navigation.navigate(AppTabsRoutes.SendReceiveStack, {
            screen: SendReceiveStackRoutes.ReceiveAccounts,
        });
    };

    const handleImportAssets = () => {
        navigation.navigate(RootStackRoutes.AccountsImport, {
            screen: AccountsImportStackRoutes.SelectNetwork,
        });
    };

    return (
        <VStack style={applyStyle(importStyle)} spacing="small">
            <Button colorScheme="tertiaryElevation0" size="large" onPress={handleImportAssets}>
                Sync my coins
            </Button>
            <Button size="large" onPress={handleReceive} iconLeft="receive">
                Receive
            </Button>
        </VStack>
    );
};
