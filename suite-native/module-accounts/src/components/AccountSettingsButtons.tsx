import React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { Button, VStack } from '@suite-native/atoms';
import { accountsActions, AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import {
    HomeStackParamList,
    HomeStackRoutes,
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
    const navigation =
        useNavigation<
            StackToStackCompositeNavigationProps<
                HomeStackParamList,
                RootStackRoutes.AccountSettings,
                HomeStackParamList
            >
        >();

    if (!account) return null;

    const handleRemoveAccount = () => {
        dispatch(accountsActions.removeAccount([account]));
        navigation.navigate(HomeStackRoutes.Home);
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
