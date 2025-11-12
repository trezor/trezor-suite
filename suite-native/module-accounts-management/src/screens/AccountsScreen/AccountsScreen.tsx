import { useState } from 'react';

import { useNavigation } from '@react-navigation/native';

import {
    AccountsList,
    OnSelectAccount,
    SearchableAccountsListHeader,
} from '@suite-native/accounts';
import { Box } from '@suite-native/atoms';
import { DeviceManagerScreenHeader } from '@suite-native/device-manager';
import { AccountsRediscoveryNeededWarning } from '@suite-native/discovery';
import { Translation } from '@suite-native/intl';
import {
    RootStackParamList,
    RootStackRoutes,
    Screen,
    StackNavigationProps,
} from '@suite-native/navigation';

export const AccountsScreen = () => {
    const navigation =
        useNavigation<StackNavigationProps<RootStackParamList, RootStackRoutes.AccountDetail>>();

    const [accountsFilterValue, setAccountsFilterValue] = useState<string>('');

    const handleSelectAccount: OnSelectAccount = ({ account, tokenAddress, isStaking }) => {
        if (isStaking) {
            navigation.navigate(RootStackRoutes.StakingDetail, {
                accountKey: account.key,
            });

            return;
        }
        navigation.navigate(RootStackRoutes.AccountDetail, {
            accountKey: account.key,
            tokenContract: tokenAddress,
            closeActionType: 'back',
        });
    };

    const handleFilterChange = (value: string) => {
        setAccountsFilterValue(value);
    };

    return (
        <Screen header={<DeviceManagerScreenHeader />}>
            <SearchableAccountsListHeader
                title={<Translation id="moduleAccountManagement.accountsScreen.title" />}
                onSearchInputChange={handleFilterChange}
                flowType="accounts"
            />
            <Box marginTop="sp12">
                <AccountsRediscoveryNeededWarning />
            </Box>
            <AccountsList
                onSelectAccount={handleSelectAccount}
                filterValue={accountsFilterValue}
                hideTokensIntoModal
                isStakingPressable
            />
        </Screen>
    );
};
