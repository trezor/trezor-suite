import { useState } from 'react';

import { useNavigation } from '@react-navigation/native';

import {
    AccountsList,
    OnSelectAccount,
    SearchableAccountsListScreenHeader,
} from '@suite-native/accounts';
import { DeviceManagerScreenHeader } from '@suite-native/device-manager';
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
        <Screen
            screenHeader={<DeviceManagerScreenHeader />}
            subheader={
                <SearchableAccountsListScreenHeader
                    title="My assets"
                    onSearchInputChange={handleFilterChange}
                    flowType="accounts"
                />
            }
        >
            <AccountsList
                onSelectAccount={handleSelectAccount}
                filterValue={accountsFilterValue}
                hideTokensIntoModal
                isStakingPressable
            />
        </Screen>
    );
};
