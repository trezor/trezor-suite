import React from 'react';
import { useSelector } from 'react-redux';

import {
    AccountsRootState,
    selectAccountByDescriptor,
    selectIsAccountImported,
} from '@suite-common/wallet-core';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { AccountInfo } from '@trezor/connect';

import { AccountImportSummaryForm } from './AccountImportSummaryForm';
import { AccountImportImportedAccount } from './AccountImportImportedAccount';

type AccountImportDetailProps = {
    networkSymbol: NetworkSymbol;
    accountInfo: AccountInfo;
};

export const AccountImportSummary = ({ networkSymbol, accountInfo }: AccountImportDetailProps) => {
    const account = useSelector((state: AccountsRootState) =>
        selectAccountByDescriptor(state, accountInfo.descriptor),
    );
    const isAccountImportedAlready = useSelector((state: AccountsRootState) =>
        selectIsAccountImported(state, accountInfo.descriptor),
    );

    return (
        <>
            {isAccountImportedAlready ? (
                account && <AccountImportImportedAccount account={account} />
            ) : (
                <AccountImportSummaryForm networkSymbol={networkSymbol} accountInfo={accountInfo} />
            )}
        </>
    );
};
