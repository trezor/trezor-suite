import { createThunk } from '@suite-common/redux-utils';
import { accountsActions, selectAccountsByNetworkAndDevice } from '@suite-common/wallet-core';
import { AccountInfo } from '@trezor/connect';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { createDevice, selectDeviceById } from '@suite-native/module-devices';

const actionPrefix = '@accountsImport';

type ImportAssetThunkPayload = {
    deviceId: string;
    deviceTitle: string;
    accountInfo: AccountInfo;
    accountLabel: string;
    coin: NetworkSymbol;
};

// This is temporary solution for MVP purposes. We have one hidden device and all imported accounts belongs to it.
export const HIDDEN_DEVICE_ID = 'hiddenDeviceWithImportedAccounts';
export const HIDDEN_DEVICE_STATE = `state@${HIDDEN_DEVICE_ID}:1`;

export const importAccountThunk = createThunk(
    `${actionPrefix}/importAccountThunk`,
    (
        { deviceId, deviceTitle, accountInfo, accountLabel, coin }: ImportAssetThunkPayload,
        { dispatch, getState },
    ) => {
        const device = selectDeviceById(deviceId)(getState());
        const deviceState = HIDDEN_DEVICE_STATE;

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
                        networkType: 'bitcoin',
                        coin,
                    },
                    accountInfo,
                    accountLabel,
                ),
            );
        }
    },
);
