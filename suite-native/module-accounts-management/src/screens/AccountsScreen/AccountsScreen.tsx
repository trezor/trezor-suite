import { useState } from 'react';

import { useNavigation } from '@react-navigation/native';

import {
    AccountsList,
    type OnSelectAccount,
    SearchableAccountsListHeader,
} from '@suite-native/accounts';
import { Box } from '@suite-native/atoms';
import { DeviceManagerScreenHeader } from '@suite-native/device-manager';
import { AccountsRediscoveryNeededWarning } from '@suite-native/discovery';
import { Translation } from '@suite-native/intl';
import { useStakingDetailNavigation, useStakingNavigateAnalytics } from '@suite-native/module-earn';
import {
    type RootStackParamList,
    RootStackRoutes,
    Screen,
    type StackNavigationProps,
} from '@suite-native/navigation';

export const AccountsScreen = () => {
    const navigation =
        useNavigation<StackNavigationProps<RootStackParamList, RootStackRoutes.AccountDetail>>();
    const { navigateToStakingDetail } = useStakingDetailNavigation();
    const reportStakingNavigate = useStakingNavigateAnalytics();

    const [accountsFilterValue, setAccountsFilterValue] = useState<string>('');

    const handleSelectAccount: OnSelectAccount = ({ account, tokenAddress, isStaking }) => {
        if (isStaking) {
            reportStakingNavigate(account);
            navigateToStakingDetail({
                accountKey: account.key,
                symbol: account.symbol,
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
