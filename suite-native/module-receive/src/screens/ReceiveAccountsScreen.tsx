import { useState } from 'react';

import { useNavigation } from '@react-navigation/native';

import { AccountsList, SearchableAccountsListScreenHeader } from '@suite-native/accounts';
import {
    Screen,
    RootStackRoutes,
    RootStackParamList,
    TabToStackCompositeNavigationProp,
    AppTabsRoutes,
    AppTabsParamList,
} from '@suite-native/navigation';
import { AccountKey, TokenAddress } from '@suite-common/wallet-types';

type NavigationProps = TabToStackCompositeNavigationProp<
    AppTabsParamList,
    AppTabsRoutes.ReceiveAccounts,
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
