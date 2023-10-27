import { createThunk } from '@suite-common/redux-utils';
import {
    accountsActions,
    PORTFOLIO_TRACKER_DEVICE_STATE,
    selectAccountsByNetworkAndDevice,
} from '@suite-common/wallet-core';
import { AccountInfo } from '@trezor/connect';
import { networks, NetworkSymbol, AccountType } from '@suite-common/wallet-config';
import { getXpubOrDescriptorInfo } from '@trezor/utxo-lib';

import { paymentTypeToAccountType } from './constants';

const actionPrefix = '@accountsImport';

type ImportAssetThunkPayload = {
    accountInfo: AccountInfo;
    accountLabel: string;
    coin: NetworkSymbol;
};

const getAccountTypeFromDescriptor = (
    descriptor: string,
    networkSymbol: NetworkSymbol,
): AccountType => {
    // account type supported only for btc and ltc
    if (networkSymbol !== 'btc' && networkSymbol !== 'ltc' && networkSymbol !== 'test')
        return 'imported';
    const { paymentType } = getXpubOrDescriptorInfo(descriptor);
    return paymentTypeToAccountType[paymentType];
};

export const importAccountThunk = createThunk(
    `${actionPrefix}/importAccountThunk`,
    ({ accountInfo, accountLabel, coin }: ImportAssetThunkPayload, { dispatch, getState }) => {
        const deviceState = PORTFOLIO_TRACKER_DEVICE_STATE;

        const deviceNetworkAccounts = selectAccountsByNetworkAndDevice(
            getState(),
            deviceState,
            coin,
        );
        const existingAccount = deviceNetworkAccounts.find(
            account => account.descriptor === accountInfo.descriptor,
        );

        if (existingAccount) {
            dispatch(accountsActions.updateAccount(existingAccount, accountInfo));
        } else {
            const accountType = getAccountTypeFromDescriptor(accountInfo.descriptor, coin);
            const imported = true;
            dispatch(
                accountsActions.createAccount({
                    deviceState,
                    discoveryItem: {
                        index: deviceNetworkAccounts.length, // indexed from 0
                        path: accountInfo?.path ?? '',
                        accountType,
                        networkType: networks[coin].networkType,
                        coin,
                    },
                    accountInfo,
                    imported,
                    accountLabel,
                }),
            );
        }
    },
);
