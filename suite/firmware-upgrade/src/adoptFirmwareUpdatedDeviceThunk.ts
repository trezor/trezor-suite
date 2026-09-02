import { type DeviceRootState, selectDeviceThunk } from '@suite-common/device';
import {
    type FirmwareRootState,
    selectFirmwareDevice,
    selectIsFirmwareUpdateFinished,
} from '@suite-common/firmware';
import { createThunk } from '@suite-common/redux-utils';
import {
    type AcquireDeviceThunkDeps,
    type AcquireDeviceThunkState,
    acquireDeviceThunk,
} from '@suite-common/wallet-core';

const FIRMWARE_UPGRADE_MODULE_PREFIX = '@suite/firmware-upgrade';

export type AdoptFirmwareUpdatedDeviceThunkState = AcquireDeviceThunkState &
    DeviceRootState &
    FirmwareRootState;

export type AdoptFirmwareUpdatedDeviceThunkDeps = AcquireDeviceThunkDeps;

/**
 * Makes the device that a finished firmware update left us with the selected one again.
 *
 * The update reboots the device several times and it comes back under a new path (and, after a
 * wipe, a new device id), so by the time it is done the globally selected device may be stale or
 * gone. `selectFirmwareDevice` resolves it through the ref the firmware flow has been tracking.
 *
 * Must only be dispatched once the update has finished: while it runs, `@trezor/connect` owns the
 * device and acquires each reconnected one itself.
 *
 * This composes `@suite-common/device` and `@suite-common/wallet-core` pieces for one app flow, so
 * it lives here rather than in the shared device module those flows all import.
 */
export const adoptFirmwareUpdatedDeviceThunk = createThunk<
    void,
    void,
    {
        state: AdoptFirmwareUpdatedDeviceThunkState;
        extra: AdoptFirmwareUpdatedDeviceThunkDeps;
    }
>(`${FIRMWARE_UPGRADE_MODULE_PREFIX}/adoptFirmwareUpdatedDevice`, (_, { dispatch, getState }) => {
    // Both conditions have to hold, and the callers cannot check either one on their own: the
    // update finishing does not mean the device is back, and the device coming back does not mean
    // the update is over — `@trezor/connect` still owns it until then.
    if (!selectIsFirmwareUpdateFinished(getState())) {
        return;
    }

    const firmwareUpdateDevice = selectFirmwareDevice(getState());

    if (!firmwareUpdateDevice) {
        return;
    }

    dispatch(selectDeviceThunk({ device: firmwareUpdateDevice }));

    if (firmwareUpdateDevice.status !== 'available') {
        dispatch(acquireDeviceThunk({ requestedDevice: firmwareUpdateDevice }));
    }
});
