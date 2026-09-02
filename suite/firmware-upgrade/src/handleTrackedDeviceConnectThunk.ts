import { type DeviceRootState, selectConnectedDevices } from '@suite-common/device';
import {
    type FirmwareRootState,
    firmwareActions,
    getIsOnlyFirmwareDeviceRefCandidate,
    selectFirmwareDeviceRef,
} from '@suite-common/firmware';
import { createThunk } from '@suite-common/redux-utils';
import { type Device } from '@trezor/connect';

import {
    type AdoptFirmwareUpdatedDeviceThunkDeps,
    type AdoptFirmwareUpdatedDeviceThunkState,
    adoptFirmwareUpdatedDeviceThunk,
} from './adoptFirmwareUpdatedDeviceThunk';

const FIRMWARE_UPGRADE_MODULE_PREFIX = '@suite/firmware-upgrade';

export type HandleTrackedDeviceConnectThunkState = AdoptFirmwareUpdatedDeviceThunkState &
    DeviceRootState &
    FirmwareRootState;

export type HandleTrackedDeviceConnectThunkDeps = AdoptFirmwareUpdatedDeviceThunkDeps;

/**
 * Feeds a connect device event into the tracking state machine, and takes the device back if it
 * turns out to be the one being updated.
 *
 * The ambiguity guard needs to know what else is plugged in, and that lives in the store, so it is
 * resolved here rather than being handed in by the caller. Disconnect needs nothing from the store,
 * so it stays a plain action.
 */
export const handleTrackedDeviceConnectThunk = createThunk<
    void,
    Device,
    {
        state: HandleTrackedDeviceConnectThunkState;
        extra: HandleTrackedDeviceConnectThunkDeps;
    }
>(
    `${FIRMWARE_UPGRADE_MODULE_PREFIX}/handleTrackedDeviceConnect`,
    (device, { dispatch, getState }) => {
        const ref = selectFirmwareDeviceRef(getState());

        if (!ref) {
            return;
        }

        dispatch(
            firmwareActions.trackedDeviceConnected({
                device,
                isOnlyCandidate: getIsOnlyFirmwareDeviceRefCandidate({
                    device,
                    connectedDevices: selectConnectedDevices(getState()),
                    ref,
                }),
            }),
        );

        // The machine rewrites `currentRef` onto whatever it adopts, so the ref pointing at this
        // device is exactly "it decided this is ours".
        const isTrackedDevice = selectFirmwareDeviceRef(getState())?.path === device.path;

        if (!isTrackedDevice) {
            return;
        }

        // The recovery path: our device came back after the update had already ended, which is what
        // a failed update looks like once the user replugs. During a running update this is a no-op
        // — `@trezor/connect` still owns the device, and it is the update call returning that
        // re-selects it.
        dispatch(adoptFirmwareUpdatedDeviceThunk());
    },
);
