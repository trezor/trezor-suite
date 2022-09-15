import { createThunk } from '@suite-common/redux-utils';
import { accountsActions, selectDeviceNetworkAccounts } from '@suite-common/wallet-core';
import { AccountInfo } from '@trezor/connect';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { createDevice, selectDeviceById } from '@suite-native/module-devices';

import { setAccountName, actionPrefix } from './accountsImportSlice';

type ImportAssetThunkPayload = {
    deviceId: string;
    deviceTitle: string;
    accountInfo: AccountInfo;
    accountName: string;
    coin: NetworkSymbol;
};

// This is temporary solution for MVP purposes. We have one hidden device and all imported accounts belongs to it.
export const HIDDEN_DEVICE_ID = 'hiddenDeviceWithImportedAccounts';

export const getMockedDeviceState = (deviceId: string) => `state@${deviceId}:1`;

export const importAccountThunk = createThunk(
    `${actionPrefix}/importAccountThunk`,
    (
        { deviceId, deviceTitle, accountInfo, accountName, coin }: ImportAssetThunkPayload,
        { dispatch, getState },
    ) => {
        const device = selectDeviceById(deviceId)(getState());
        const deviceState = getMockedDeviceState(deviceId);

        if (!device) {
            dispatch(
                createDevice({
                    type: 'imported',
                    id: deviceId,
                    status: 'available',
                    mode: 'normal',
                    state: deviceState,
                    label: deviceTitle,
                }),
            );
        }

        const deviceNetworkAccounts = selectDeviceNetworkAccounts(deviceState, coin)(getState());
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
                        networkType: 'bitcoin',
                        coin,
                    },
                    accountInfo,
                ),
            );
        }

        dispatch(
            setAccountName({
                descriptor: accountInfo.descriptor,
                name: accountName,
            }),
        );
    },
);
