import { createThunk } from '@suite-common/redux-utils';
import { accountsActions, selectAccountsByNetworkAndDevice } from '@suite-common/wallet-core';
import { AccountInfo } from '@trezor/connect';
import { networks, NetworkSymbol } from '@suite-common/wallet-config';
import {
    createDevice,
    hiddenDevice,
    HIDDEN_DEVICE_ID,
    HIDDEN_DEVICE_STATE,
    selectDeviceById,
} from '@suite-native/module-devices';

const actionPrefix = '@accountsImport';

type ImportAssetThunkPayload = {
    accountInfo: AccountInfo;
    accountLabel: string;
    coin: NetworkSymbol;
};

export const importAccountThunk = createThunk(
    `${actionPrefix}/importAccountThunk`,
    ({ accountInfo, accountLabel, coin }: ImportAssetThunkPayload, { dispatch, getState }) => {
        const device = selectDeviceById(HIDDEN_DEVICE_ID)(getState());
        const deviceState = HIDDEN_DEVICE_STATE;

        if (!device) {
            dispatch(createDevice(hiddenDevice));
        }

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
            dispatch(
                accountsActions.createAccount(
                    deviceState,
                    {
                        index: deviceNetworkAccounts.length, // indexed from 0
                        path: accountInfo?.path ?? '',
                        accountType: 'imported',
                        networkType: networks[coin].networkType,
                        coin,
                    },
                    accountInfo,
                    accountLabel,
                ),
            );
        }
    },
);
