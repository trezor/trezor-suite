import { createThunk } from '@suite-common/redux-utils';
import { accountsActions, selectAccounts } from '@suite-common/wallet-core';
import { AccountInfo } from '@trezor/connect';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { createDevice, selectDeviceById } from '@suite-native/module-devices';

const actionPrefix = '@accountImport';

type ImportAssetThunkPayload = {
    deviceId: string;
    deviceTitle: string;
    accountInfo: AccountInfo;
    coin: NetworkSymbol;
};

const getMockedDeviceState = (deviceId: string) => `state@${deviceId}:1`;

export const importAccountThunk = createThunk(
    `${actionPrefix}/importAccountThunk`,
    (
        { deviceId, deviceTitle, accountInfo, coin }: ImportAssetThunkPayload,
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

        const allAccounts = selectAccounts(getState());

        const deviceNetworkAccounts = allAccounts.filter(
            account => account.deviceState === deviceState && account.symbol === coin,
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
                        coin: 'btc',
                    },
                    accountInfo,
                ),
            );
        }
    },
);
