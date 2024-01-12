import { useSelector } from 'react-redux';

import { D } from '@mobily/ts-belt';

import { AccountsRootState, DeviceRootState } from '@suite-common/wallet-core';
import { AccountKey, TokenAddress } from '@suite-common/wallet-types';
import { FiatRatesRootState } from '@suite-native/fiat-rates';
import { SettingsSliceRootState } from '@suite-native/module-settings';

import { selectFilteredAccountsGroupedByNetworkAccountType } from '../selectors';
import { AccountListPlaceholder } from './AccountListPlaceholder';
import { GroupedAccountsList } from './GroupedAccountsList';

type AccountsListProps = {
    onSelectAccount: (accountKey: AccountKey, tokenContract?: TokenAddress) => void;
    filterValue?: string;
};

export const AccountsList = ({ onSelectAccount, filterValue = '' }: AccountsListProps) => {
    const groupedAccounts = useSelector(
        (
            state: AccountsRootState &
                FiatRatesRootState &
                SettingsSliceRootState &
                DeviceRootState,
        ) => selectFilteredAccountsGroupedByNetworkAccountType(state, filterValue),
    );

    if (D.isEmpty(groupedAccounts))
        return <AccountListPlaceholder isFilterEmpty={!filterValue?.length} />;

    return (
        <GroupedAccountsList groupedAccounts={groupedAccounts} onSelectAccount={onSelectAccount} />
    );
};
