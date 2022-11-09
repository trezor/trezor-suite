import React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import {
    AccountsStackParamList,
    AccountsStackRoutes,
    Screen,
    ScreenHeader,
    StackNavigationProps,
    StackProps,
} from '@suite-native/navigation';
import { Box, Button, Text } from '@suite-native/atoms';
import {
    accountsActions,
    AccountsRootState,
    selectAccountByKey,
    selectAccountLabel,
} from '@suite-common/wallet-core';

export const AccountDetailSettings = ({
    route,
}: StackProps<AccountsStackParamList, AccountsStackRoutes.AccountDetail>) => {
    const { accountKey } = route.params;
    const navigation =
        useNavigation<
            StackNavigationProps<AccountsStackParamList, AccountsStackRoutes.AccountDetailSettings>
        >();
    const dispatch = useDispatch();
    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );
    const accountName = useSelector((state: AccountsRootState) =>
        selectAccountLabel(state, accountKey),
    );

    if (!account) return null;

    const handleRemoveAccount = () => {
        dispatch(accountsActions.removeAccount([account]));
        navigation.navigate(AccountsStackRoutes.Accounts, { currencySymbol: account.symbol });
    };

    return (
        <Screen header={<ScreenHeader />}>
            <Box marginBottom="large">
                <Text variant="titleMedium">{accountName}</Text>
            </Box>
            <Button onPress={handleRemoveAccount} colorScheme="gray">
                Remove Account
            </Button>
        </Screen>
    );
};
