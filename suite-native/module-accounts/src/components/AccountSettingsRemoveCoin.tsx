import React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { Button } from '@suite-native/atoms';
import {
    accountsActions,
    AccountsRootState,
    selectAccountByKey,
    selectNumberOfAccounts,
} from '@suite-common/wallet-core';
import { AccountKey } from '@suite-common/wallet-types';
import {
    AccountsImportStackRoutes,
    AppTabsRoutes,
    HomeStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    StackNavigationProps,
} from '@suite-native/navigation';
import { useAlert } from '@suite-native/alerts';

export const AccountSettingsRemoveCoin = ({ accountKey }: { accountKey: AccountKey }) => {
    const dispatch = useDispatch();
    const { showAlert, hideAlert } = useAlert();
    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );
    const accountsLength = useSelector(selectNumberOfAccounts);

    const navigation =
        useNavigation<StackNavigationProps<RootStackParamList, RootStackRoutes.AccountSettings>>();

    if (!account) return null;

    const handleRemoveAccount = () => {
        dispatch(accountsActions.removeAccount([account]));

        const isLastAccount = accountsLength === 1;
        if (isLastAccount) {
            navigation.navigate(RootStackRoutes.AccountsImport, {
                screen: AccountsImportStackRoutes.SelectNetwork,
            });
        } else {
            navigation.navigate(RootStackRoutes.AppTabs, {
                screen: AppTabsRoutes.HomeStack,
                params: {
                    screen: HomeStackRoutes.Home,
                },
            });
        }
    };

    const handleShowAlert = () => {
        showAlert({
            icon: 'shieldWarning',
            pictogramVariant: 'red',
            title: 'Do you really want to remove this coin from Trezor Suite Lite?',
            description:
                'Your coins remain intact and safe. Import this coin again using your public key (XPUB) or receive address at any time.',
            primaryButtonTitle: 'Remove coin',
            primaryButtonVariant: 'dangerElevation0',
            onPressPrimaryButton: handleRemoveAccount,
            secondaryButtonTitle: 'Cancel',
            onPressSecondaryButton: () => hideAlert(),
        });
    };

    return (
        <Button onPress={handleShowAlert} colorScheme="dangerElevation0">
            Remove coin
        </Button>
    );
};
