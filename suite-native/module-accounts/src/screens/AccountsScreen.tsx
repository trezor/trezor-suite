import { useMemo } from 'react';

import {
    AccountsListWithFilter,
    type OnSelectAccount,
    useNavigateToAccount,
} from '@suite-native/accounts';
import { DeviceManagerScreenHeader } from '@suite-native/device-manager';
import { AccountsRediscoveryNeededWarning } from '@suite-native/discovery';
import { Translation } from '@suite-native/intl';
import {
    type AccountsStackParamList,
    type AccountsStackRoutes,
    type RootStackParamList,
    Screen,
    type StackToStackCompositeScreenProps,
} from '@suite-native/navigation';

type ScreenNavigationProps = StackToStackCompositeScreenProps<
    AccountsStackParamList,
    AccountsStackRoutes.Accounts,
    RootStackParamList
>;

export const AccountsScreen = ({ route }: ScreenNavigationProps) => {
    const navigateToAccount = useNavigateToAccount();
    const networksFilter = useMemo(
        () => route.params?.networksFilter ?? [],
        [route.params?.networksFilter],
    );

    const handleSelectAccount: OnSelectAccount = ({ account }) => {
        navigateToAccount({
            accountKey: account.key,
            networkSymbol: account.symbol,
        });
    };

    return (
        // noBottomPadding: SearchableAccountsListHeader owns the top spacing to accommodate filter badge overflow.
        <Screen header={<DeviceManagerScreenHeader noBottomPadding />} isScrollable={false}>
            <AccountsListWithFilter
                title={<Translation id="moduleAccountManagement.accountsScreen.accountsTitle" />}
                onSelectAccount={handleSelectAccount}
                flowType="accounts"
                networksFilter={networksFilter}
                isScrollDividerEnabled
            >
                <AccountsRediscoveryNeededWarning />
            </AccountsListWithFilter>
        </Screen>
    );
};
