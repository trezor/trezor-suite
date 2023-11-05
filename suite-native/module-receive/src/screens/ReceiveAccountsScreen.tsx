import { useState } from 'react';

import { useNavigation } from '@react-navigation/native';

import { DeviceManager } from '@suite-native/device-manager';
import { AccountsList, SearchableAccountsListScreenHeader } from '@suite-native/accounts';
import {
    Screen,
    ReceiveStackParamList,
    ReceiveStackRoutes,
    StackNavigationProps,
} from '@suite-native/navigation';
import { AccountKey, TokenAddress } from '@suite-common/wallet-types';

export const ReceiveAccountsScreen = () => {
    const navigation =
        useNavigation<
            StackNavigationProps<ReceiveStackParamList, ReceiveStackRoutes.ReceiveAccounts>
        >();

    const navigateToReceiveScreen = (accountKey: AccountKey, tokenContract?: TokenAddress) =>
        navigation.navigate(ReceiveStackRoutes.Receive, { accountKey, tokenContract });

    const [accountsFilterValue, setAccountsFilterValue] = useState<string>('');

    const handleFilterChange = (value: string) => {
        setAccountsFilterValue(value);
    };

    return (
        <Screen
            screenHeader={
                <ScreenHeader>
                    <DeviceManager />
                </ScreenHeader>
            }
            subheader={
                <SearchableAccountsListScreenHeader
                    title="Receive to"
                    onSearchInputChange={handleFilterChange}
                />
            }
        >
            <AccountsList
                onSelectAccount={navigateToReceiveScreen}
                filterValue={accountsFilterValue}
            />
        </Screen>
    );
};
