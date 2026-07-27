import { selectDevices, selectSelectedDevice } from '@suite-common/device';
import { createThunk } from '@suite-common/redux-utils';
import { type TrezorDevice } from '@suite-common/suite-types';
import { forgetDeviceThunk } from '@suite-common/wallet-core';

import * as storageActions from 'src/actions/suite/storageActions';

import { SUITE_FORGET_DEVICE } from './constants/suiteConstants';

export type ForgetDeviceThunkParams = {
    isOsUnpairingFinished?: boolean;
    skipToggleModalConnection?: boolean;
    skipDisconnect?: boolean;
    deviceId?: TrezorDevice['id'];
};

export const suiteForgetDeviceThunk = createThunk(
    SUITE_FORGET_DEVICE,
    async (
        {
            skipToggleModalConnection,
            isOsUnpairingFinished,
            skipDisconnect,
            deviceId,
        }: ForgetDeviceThunkParams | undefined = {},
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

        await dispatch(storageActions.savePersistentDeviceData());
        if (device?.state) {
            await dispatch(storageActions.forgetDevice(device));
        }
    },
);
