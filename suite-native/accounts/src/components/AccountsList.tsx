import React from 'react';
import { useSelector } from 'react-redux';

import { D } from '@mobily/ts-belt';

import { Text } from '@suite-native/atoms';
import { AccountsRootState } from '@suite-common/wallet-core';
import { AccountKey, TokenAddress } from '@suite-common/wallet-types';

import { AccountsListGroup } from './AccountsListGroup';
import { selectFilteredAccountsGroupedByNetwork } from '../selectors';

type AccountsListProps = {
    onSelectAccount: (accountKey: AccountKey, tokenContract?: TokenAddress) => void;
    filterValue?: string | null;
};

export const AccountsList = ({ onSelectAccount, filterValue }: AccountsListProps) => {
    const accounts = useSelector((state: AccountsRootState) =>
        selectFilteredAccountsGroupedByNetwork(state, filterValue),
    );

    // FIXME: In case the filter does not match any account, this ugly message is displayed.
    //        Let's create a proper component for this.
    //        See issue: https://github.com/trezor/trezor-suite/issues/9092
    if (D.isEmpty(accounts)) return <Text>No accounts found.</Text>;

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
