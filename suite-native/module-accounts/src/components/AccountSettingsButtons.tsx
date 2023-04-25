import React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { Button, VStack } from '@suite-native/atoms';
import {
    accountsActions,
    AccountsRootState,
    selectAccountByKey,
    selectNumberOfAccounts,
} from '@suite-common/wallet-core';
import {
    AccountsImportStackRoutes,
    HomeStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';
import { AccountKey } from '@suite-common/wallet-types';

import { AccountSettingsShowXpub } from './AccountSettingsShowXpub';

export const AccountSettingsButtons = ({ accountKey }: { accountKey: AccountKey }) => {
    const dispatch = useDispatch();
    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );
    const accountsLength = useSelector(selectNumberOfAccounts);

    const navigation =
        useNavigation<
            StackToStackCompositeNavigationProps<
                RootStackParamList,
                RootStackRoutes.AccountSettings,
                RootStackParamList
            >
        >();

    if (!account) return null;

    const handleRemoveAccount = () => {
        dispatch(accountsActions.removeAccount([account]));

        const isLastAccount = accountsLength === 1;
        if (isLastAccount) {
            navigation.reset({
                index: 0,
                routes: [
                    {
                        name: RootStackRoutes.AccountsImport,
                        params: { screen: AccountsImportStackRoutes.SelectNetwork },
                    },
                ],
            });
        } else {
            navigation.reset({
                index: 0,
                routes: [
                    {
                        name: RootStackRoutes.AppTabs,
                        params: {
                            screen: HomeStackRoutes.Home,
                        },
                    },
                ],
            });
        }
    };

    return (
        <VStack spacing="small">
            <AccountSettingsShowXpub accountKey={account.key} />
            <Button onPress={handleRemoveAccount} colorScheme="dangerElevation0">
                Remove coin
            </Button>
        </VStack>
    );
};
