import { type DeviceRootState, acquireDeviceThunk, selectDeviceThunk } from '@suite-common/device';
import { type FirmwareRootState, selectIsFirmwareUpdateFinished } from '@suite-common/firmware';
import { createThunk } from '@suite-common/redux-utils';
import { type TrezorDevice } from '@suite-common/suite-types';

const FIRMWARE_UPGRADE_MODULE_PREFIX = '@suite/firmware-upgrade';

export type AdoptFirmwareUpdatedDeviceThunkState = DeviceRootState & FirmwareRootState;

/**
 * Makes the device that a finished firmware update left us with the selected one again.
 *
 * The update reboots the device several times and it comes back under a new path (and, after a
 * wipe, a new device id), so by the time it is done the globally selected device may be stale or
 * gone — hence the caller naming the device rather than anything here guessing at it.
 *
 * Dispatching it before the update has finished is a no-op: while the update runs, `@trezor/connect`
 * owns the device and acquires each reconnected one itself.
 *
 * This composes `@suite-common/device` and `@suite-common/wallet-core` pieces for one app flow, so
 * it lives here rather than in the shared device module those flows all import.
 */
type AdoptFirmwareUpdatedDeviceParams = {
    /**
     * The device to take back. Always the caller's, never resolved here: both callers already know
     * which device they mean — one waited for the update to hand it over, the other was woken by
     * it connecting — and re-deriving it here could only disagree with them.
     */
    device: TrezorDevice;
};

export const adoptFirmwareUpdatedDeviceThunk = createThunk<
    void,
    AdoptFirmwareUpdatedDeviceParams,
    { state: AdoptFirmwareUpdatedDeviceThunkState }
>(
    `${FIRMWARE_UPGRADE_MODULE_PREFIX}/adoptFirmwareUpdatedDevice`,
    ({ device }, { dispatch, getState }) => {
        // The device coming back does not mean the update is over — `@trezor/connect` still owns
        // it until then, and a competing acquire would break the installation.
        if (!selectIsFirmwareUpdateFinished(getState())) {
            return;
        }

        dispatch(selectDeviceThunk({ device }));

        if (device.status !== 'available') {
            dispatch(acquireDeviceThunk({ requestedDevice: device }));
        }
    },
);
