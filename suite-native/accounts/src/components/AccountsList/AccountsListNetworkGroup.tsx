import React from 'react';
import { useSelector } from 'react-redux';

import { A } from '@mobily/ts-belt';

import { type NetworkSymbol } from '@suite-common/wallet-config';

import { AccountsListAccountTypeGroup } from './AccountsListAccountTypeGroup';
import {
    type NativeAccountsRootState,
    selectFilteredDeviceAccountTypesByNetworkSymbol,
} from '../../selectors';
import { type OnSelectAccount } from '../../types';

type AccountsListNetworkGroupProps = {
    networkSymbol: NetworkSymbol;
    searchValue: string;
    isSendFlow: boolean;
    onSelectAccount: OnSelectAccount;
};

const AccountsListNetworkGroupComponent = ({
    networkSymbol,
    searchValue,
    isSendFlow,
    onSelectAccount,
}: AccountsListNetworkGroupProps) => {
    const accountTypes = useSelector((state: NativeAccountsRootState) =>
        selectFilteredDeviceAccountTypesByNetworkSymbol(
            state,
            searchValue,
            isSendFlow,
            networkSymbol,
        ),
    );

    if (A.isEmpty(accountTypes)) return null;

    return (
        <>
            {accountTypes.map(accountType => (
                <AccountsListAccountTypeGroup
                    key={accountType}
                    networkSymbol={networkSymbol}
                    accountType={accountType}
                    searchValue={searchValue}
                    isSendFlow={isSendFlow}
                    onSelectAccount={onSelectAccount}
                />
            ))}
        </>
    );
};

export const AccountsListNetworkGroup = React.memo(AccountsListNetworkGroupComponent);

AccountsListNetworkGroup.displayName = 'AccountsListNetworkGroup';
