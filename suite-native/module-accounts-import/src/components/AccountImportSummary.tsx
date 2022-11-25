import React from 'react';
import { useSelector } from 'react-redux';

import {
    AccountsRootState,
    selectAccountByDescriptor,
    selectIsAccountImported,
} from '@suite-common/wallet-core';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { AccountInfo } from '@trezor/connect';
import { enabledNetworks } from '@suite-native/config';

import { AccountImportSummaryForm } from './AccountImportSummaryForm';
import { AccountAlreadyImported } from './AccountAlreadyImported';

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

    const isAccountImportSupported = enabledNetworks.some(network => network === networkSymbol);
    const isXpubWithSameDifferentSymbolbAlreadyImported =
        account && account.symbol !== networkSymbol;

    if (isAccountImportedAlready && isXpubWithSameDifferentSymbolbAlreadyImported)
        return <AccountAlreadyImported account={account} />;
    if (isAccountImportSupported)
        return <AccountImportSummaryForm networkSymbol={networkSymbol} accountInfo={accountInfo} />;
    return null;
};
