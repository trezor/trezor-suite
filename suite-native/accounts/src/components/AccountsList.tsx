import React from 'react';
import { useSelector } from 'react-redux';

import { D } from '@mobily/ts-belt';

import { AccountsRootState } from '@suite-common/wallet-core';
import { AccountKey, TokenAddress } from '@suite-common/wallet-types';
import { FiatRatesRootState } from '@suite-native/fiat-rates';
import { SettingsSliceRootState } from '@suite-native/module-settings';

import { AccountsListGroup } from './AccountsListGroup';
import { selectFilteredAccountsGroupedByNetwork } from '../selectors';
import { AccountListPlaceholder } from './AccountListPlaceholder';

type AccountsListProps = {
    onSelectAccount: (accountKey: AccountKey, tokenContract?: TokenAddress) => void;
    filterValue?: string;
};

export const AccountsList = ({ onSelectAccount, filterValue = '' }: AccountsListProps) => {
    const accounts = useSelector(
        (state: AccountsRootState & FiatRatesRootState & SettingsSliceRootState) =>
            selectFilteredAccountsGroupedByNetwork(state, filterValue),
    );

    if (D.isEmpty(accounts)) return <AccountListPlaceholder />;

    return (
        <>
            {Object.entries(accounts).map(([networkSymbol, networkAccounts]) => (
                <AccountsListGroup
                    key={networkSymbol}
                    accounts={networkAccounts}
                    onSelectAccount={onSelectAccount}
                />
            ))}
        </>
    );
};
