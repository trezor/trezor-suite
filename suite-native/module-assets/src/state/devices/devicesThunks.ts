import { createThunk } from '@suite-common/redux-utils';
import { testMocks } from '@suite-common/test-utils';
import { accountsActions, selectAccounts } from '@suite-common/wallet-core';
import { AccountInfo } from '@trezor/connect';
import { NetworkSymbol } from '@suite-common/wallet-config';

import { actionPrefix, devicesActions } from './devicesActions';
import { selectDeviceById } from './devicesReducer';

type importAssetThunkPayload = {
    deviceId: string;
    deviceTitle: string;
    accountInfo: AccountInfo;
    coin: NetworkSymbol;
};

const getDeviceState = (deviceId: string) => `state@${deviceId}:1`;

export const importAssetThunk = createThunk(
    `${actionPrefix}/createAssetThunk`,
    (
        { deviceId, deviceTitle, accountInfo, coin }: importAssetThunkPayload,
        { dispatch, getState },
    ) => {
        const device = selectDeviceById(deviceId)(getState());
        const deviceState = getDeviceState(deviceId);

        if (!device) {
            const mockedSuiteDevice = testMocks.getSuiteDevice({
                type: 'acquired',
                connected: true,
                useEmptyPassphrase: true,
                instance: 1,
            });
            dispatch(
                devicesActions.createDevice({
                    ...mockedSuiteDevice,
                    id: deviceId,
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
                        index: deviceNetworkAccounts.length + 1,
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
