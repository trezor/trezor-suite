import React from 'react';

import { useNavigation } from '@react-navigation/native';

import {
    AccountsImportStackRoutes,
    AppTabsParamList,
    AppTabsRoutes,
    RootStackParamList,
    RootStackRoutes,
    ScreenHeader,
    TabToStackCompositeNavigationProp,
} from '@suite-native/navigation';
import { IconButton } from '@suite-native/atoms';

type NavigationProp = TabToStackCompositeNavigationProp<
    AppTabsParamList,
    AppTabsRoutes.HomeStack,
    RootStackParamList
>;

export const AccountsScreenHeader = () => {
    const navigation = useNavigation<NavigationProp>();

    const handleImportAsset = () => {
        navigation.navigate(RootStackRoutes.AccountsImport, {
            screen: AccountsImportStackRoutes.SelectNetwork,
        });
    };

    return (
        <ScreenHeader
            title="My Assets"
            leftIcon={
                <IconButton
                    iconName="plus"
                    onPress={handleImportAsset}
                    colorSchemeName="tertiary"
                    size="medium"
                />
            }
        />
    );
};
