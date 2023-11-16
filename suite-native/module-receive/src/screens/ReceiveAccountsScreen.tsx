import { useState } from 'react';

import { useNavigation } from '@react-navigation/native';

import { DeviceManagerScreenHeader } from '@suite-native/device-manager';
import { AccountsList, SearchableAccountsListScreenHeader } from '@suite-native/accounts';
import {
    Screen,
    ReceiveStackParamList,
    ReceiveStackRoutes,
    RootStackRoutes,
    StackToStackCompositeNavigationProps,
    RootStackParamList,
} from '@suite-native/navigation';
import { AccountKey, TokenAddress } from '@suite-common/wallet-types';

type NavigationProps = StackToStackCompositeNavigationProps<
    ReceiveStackParamList,
    ReceiveStackRoutes.ReceiveAccounts,
    RootStackParamList
>;

export const ReceiveAccountsScreen = () => {
    const navigation = useNavigation<NavigationProps>();

    const navigateToReceiveScreen = (accountKey: AccountKey, tokenContract?: TokenAddress) =>
        navigation.navigate(RootStackRoutes.ReceiveModal, { accountKey, tokenContract });

    const [accountsFilterValue, setAccountsFilterValue] = useState<string>('');

    const handleFilterChange = (value: string) => {
        setAccountsFilterValue(value);
    };

    return (
        <Screen
            screenHeader={<DeviceManagerScreenHeader />}
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
