import { useSelector } from 'react-redux';

import { D } from '@mobily/ts-belt';

import { AccountsRootState, DeviceRootState, FiatRatesRootState } from '@suite-common/wallet-core';
import { SettingsSliceRootState } from '@suite-native/settings';

import { selectFilteredDeviceAccountsGroupedByNetworkAccountType } from '../selectors';
import { AccountListPlaceholder } from './AccountListPlaceholder';
import { GroupedByTypeAccountsList } from './GroupedAccountsList';
import { OnSelectAccount } from '../types';

type AccountsListProps = {
    onSelectAccount: OnSelectAccount;
    filterValue?: string;
    hideTokens?: boolean;
};

export const AccountsList = ({
    onSelectAccount,
    filterValue = '',
    hideTokens = false,
}: AccountsListProps) => {
    const groupedAccounts = useSelector(
        (
            state: AccountsRootState &
                FiatRatesRootState &
                SettingsSliceRootState &
                DeviceRootState,
        ) => selectFilteredDeviceAccountsGroupedByNetworkAccountType(state, filterValue),
    );

    if (D.isEmpty(groupedAccounts))
        return <AccountListPlaceholder isFilterEmpty={!filterValue?.length} />;

    return (
        <GroupedByTypeAccountsList
            groupedAccounts={groupedAccounts}
            onSelectAccount={onSelectAccount}
            hideTokens={hideTokens}
        />
    );
};
