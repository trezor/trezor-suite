import React from 'react';
import { useSelector } from 'react-redux';
import { TouchableOpacity } from 'react-native';

import { useNavigation } from '@react-navigation/native';

import { AccountsRootState, selectAccountLabel } from '@suite-common/wallet-core';
import { Box, Text } from '@suite-native/atoms';
import {
    AccountsStackParamList,
    AccountsStackRoutes,
    StackNavigationProps,
} from '@suite-native/navigation';
import { Account } from '@suite-common/wallet-types';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { CryptoIcon } from '@trezor/icons';

type AccountListItemProps = {
    account: Account;
};

const accountListItemStyle = prepareNativeStyle(utils => ({
    backgroundColor: utils.colors.gray0,
    padding: utils.spacings.medium,
    borderRadius: 12,
    marginBottom: utils.spacings.small,
}));

export const AccountListItem = ({ account }: AccountListItemProps) => {
    const navigation =
        useNavigation<StackNavigationProps<AccountsStackParamList, AccountsStackRoutes.Accounts>>();
    const { applyStyle } = useNativeStyles();
    const accountName = useSelector((state: AccountsRootState) =>
        selectAccountLabel(state, account.key),
    );

    const handleSelectAccount = (key: string) => {
        navigation.navigate(AccountsStackRoutes.AccountDetail, {
            accountKey: key,
        });
    };

    return (
        <TouchableOpacity onPress={() => handleSelectAccount(account.key)}>
            <Box
                flexDirection="row"
                justifyContent="space-between"
                alignItems="center"
                style={applyStyle(accountListItemStyle)}
            >
                <Box flexDirection="row">
                    <Box marginRight="small">
                        <CryptoIcon name="btc" />
                    </Box>
                    <Text color="gray800">{accountName}</Text>
                </Box>
                <Box alignItems="flex-end">
                    <Text color="gray800" variant="hint">
                        $ {account.formattedBalance}
                    </Text>
                    <Text variant="hint" color="gray600">
                        {account.balance} BTC
                    </Text>
                </Box>
            </Box>
        </TouchableOpacity>
    );
};
