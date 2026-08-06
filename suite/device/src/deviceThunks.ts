import { type LocksRootState, selectIsDeviceLocked } from '@suite/locks';
import { type DeviceRootState, selectSelectedDevice } from '@suite-common/device';
import { createThunk } from '@suite-common/redux-utils';
import TrezorConnect from '@trezor/connect';

const DEVICE_MODULE_PREFIX = '@suite';

/**
 * Connect call to rerun FW authenticity checks (getFeatures used as the most basic no-op device call).
 */
type RerunFwAuthenticityChecksThunkState = DeviceRootState & LocksRootState;

export const rerunFwAuthenticityChecksThunk = createThunk<
    void,
    void,
    { state: RerunFwAuthenticityChecksThunkState }
>(`${DEVICE_MODULE_PREFIX}/rerunFwAuthenticityChecksThunk`, (_, { getState }) => {
    const device = selectSelectedDevice(getState());
    if (device === undefined) return;
    if (selectIsDeviceLocked(getState())) return;
    void TrezorConnect.getFeatures({ device: { path: device.path } });
});
