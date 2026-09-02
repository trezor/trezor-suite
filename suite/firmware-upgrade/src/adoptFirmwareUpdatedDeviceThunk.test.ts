import { deviceInitialState } from '@suite-common/device';
import {
    createFirmwareDeviceRef,
    firmwareDeviceTrackingInitialState,
    firmwareInitialState,
} from '@suite-common/firmware';
import { createMockDispatch } from '@suite-common/redux-utils/mocks';
import { type FirmwareStatus, type TrezorDevice } from '@suite-common/suite-types';
import { asDeviceUniquePath } from '@trezor/connect';
import { DeviceModelInternal } from '@trezor/device-utils';

import {
    type AdoptFirmwareUpdatedDeviceThunkDeps,
    type AdoptFirmwareUpdatedDeviceThunkState,
    adoptFirmwareUpdatedDeviceThunk,
} from './adoptFirmwareUpdatedDeviceThunk';

const deviceBeingUpdated = {
    type: 'acquired',
    id: 'DEVICE_A',
    path: asDeviceUniquePath('1'),
    descriptor: { id: null, apiType: 'usb' },
    features: { internal_model: DeviceModelInternal.T2T1 },
    connected: true,
    status: 'available',
} as TrezorDevice;

const createState = (status: FirmwareStatus | 'error') =>
    ({
        ...deviceInitialState,
        device: { ...deviceInitialState, devices: [deviceBeingUpdated] },
        firmware: {
            ...firmwareInitialState,
            status,
            deviceTracking: {
                ...firmwareDeviceTrackingInitialState,
                phase: 'tracking',
                initialRef: createFirmwareDeviceRef(deviceBeingUpdated),
                currentRef: createFirmwareDeviceRef(deviceBeingUpdated),
            },
        },
    }) as unknown as AdoptFirmwareUpdatedDeviceThunkState;

const runThunk = async (status: FirmwareStatus | 'error') => {
    const getState = () => createState(status);
    const extra = {} as AdoptFirmwareUpdatedDeviceThunkDeps;
    const { actions, dispatch } = createMockDispatch<
        AdoptFirmwareUpdatedDeviceThunkState,
        AdoptFirmwareUpdatedDeviceThunkDeps
    >({ getState, extra });

    await adoptFirmwareUpdatedDeviceThunk()(dispatch, getState, extra);

    return actions.map(action => (action as { type: string }).type);
};

const SELECT_DEVICE_ACTION = '@suite/device/selectDevice';

describe('adoptFirmwareUpdatedDeviceThunk', () => {
    it.each(['initial', 'started', 'check-seed', 'thp-pairing'] as const)(
        'does not touch the selection while the update is at %s',
        async status => {
            // The device reconnects several times mid-update — into the bootloader to start, and
            // back to normal to finish. `@trezor/connect` owns it throughout, so those reconnects
            // must not make us select or acquire it.
            expect(await runThunk(status)).not.toContain(SELECT_DEVICE_ACTION);
        },
    );

    it.each(['done', 'error'] as const)(
        'selects the tracked device once the update is %s',
        async status => {
            // Failure included: a failed update leaves the device somewhere the user has to act on,
            // and the retry button acts on whatever is selected.
            expect(await runThunk(status)).toContain(SELECT_DEVICE_ACTION);
        },
    );
});
