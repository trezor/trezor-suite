import { useState } from 'react';

import { useNavigation } from '@react-navigation/native';

import { isStakingSymbol } from '@suite-common/wallet-utils';
import {
    AccountsList,
    type OnSelectAccount,
    SearchableAccountsListHeader,
} from '@suite-native/accounts';
import { Box } from '@suite-native/atoms';
import { DeviceManagerScreenHeader } from '@suite-native/device-manager';
import { AccountsRediscoveryNeededWarning } from '@suite-native/discovery';
import { Translation } from '@suite-native/intl';
import {
    type RootStackParamList,
    RootStackRoutes,
    Screen,
    type StackNavigationProps,
} from '@suite-native/navigation';
import { isNetworkWithTokens } from '@suite-native/tokens';

export const AccountsScreen = () => {
    const navigation =
        useNavigation<StackNavigationProps<RootStackParamList, RootStackRoutes.AccountDetail>>();
    const [accountsFilterValue, setAccountsFilterValue] = useState<string>('');

    const handleSelectAccount: OnSelectAccount = ({ account }) => {
        const { key: accountKey, symbol } = account;

        if (isNetworkWithTokens(symbol) || isStakingSymbol(symbol)) {
            navigation.navigate(RootStackRoutes.AccountAssets, { accountKey });

            return;
        }
        navigation.navigate(RootStackRoutes.AccountDetail, {
            accountKey,
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
            <AccountsList onSelectAccount={handleSelectAccount} filterValue={accountsFilterValue} />
        </Screen>
    );
};
