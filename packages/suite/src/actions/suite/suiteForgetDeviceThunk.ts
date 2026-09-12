import { selectDevices, selectSelectedDevice } from '@suite-common/device';
import { type WithServices, createThunk } from '@suite-common/redux-utils';
import { type TrezorDevice } from '@suite-common/suite-types';
import {
    type ForgetDeviceThunkDeps,
    type ForgetDeviceThunkState,
    forgetDeviceThunk,
} from '@suite-common/wallet-core';

import * as storageActions from 'src/actions/suite/storageActions';
import { type DbDep } from 'src/storage/createDb';

import { SUITE_FORGET_DEVICE } from './constants/suiteConstants';

export type ForgetDeviceThunkParams = {
    isOsUnpairingFinished?: boolean;
    skipToggleModalConnection?: boolean;
    skipDisconnect?: boolean;
    deviceId?: TrezorDevice['id'];
};

type SuiteForgetDeviceThunkState = ForgetDeviceThunkState;

type SuiteForgetDeviceThunkDeps = ForgetDeviceThunkDeps & WithServices<DbDep>;

export const suiteForgetDeviceThunk = createThunk<
    void,
    ForgetDeviceThunkParams | undefined,
    { state: SuiteForgetDeviceThunkState; extra: SuiteForgetDeviceThunkDeps }
>(
    SUITE_FORGET_DEVICE,
    async (
        { skipToggleModalConnection, isOsUnpairingFinished, skipDisconnect, deviceId } = {},
        { dispatch, getState },
    ) => {
        const devices = selectDevices(getState());

        const explicitDevice = deviceId
            ? devices.find(candidateDevice => candidateDevice.id === deviceId)
            : undefined;
        const device = explicitDevice ?? selectSelectedDevice(getState());
        if (!device) return;

        await dispatch(
            forgetDeviceThunk({
                deviceId: device.id,
                skipToggleModalConnection,
                isOsUnpairingFinished,
                skipDisconnect,
            }),
        ).unwrap();

        await dispatch(storageActions.savePersistentDeviceDataThunk());
        if (device?.state) {
            await dispatch(storageActions.forgetDeviceThunk(device));
        }
    },
);
