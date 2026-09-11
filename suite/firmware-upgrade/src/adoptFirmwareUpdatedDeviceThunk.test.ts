import { deviceInitialState } from '@suite-common/device';
import { firmwareInitialState } from '@suite-common/firmware';
import { createMockDispatch } from '@suite-common/redux-utils/mocks';
import { type FirmwareStatus, type TrezorDevice } from '@suite-common/suite-types';
import { asDeviceUniquePath } from '@trezor/connect';
import { DeviceModelInternal } from '@trezor/device-utils';

import {
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
        firmware: { ...firmwareInitialState, status },
    }) as unknown as AdoptFirmwareUpdatedDeviceThunkState;

const runThunk = async (status: FirmwareStatus | 'error') => {
    const getState = () => createState(status);
    const extra = {};
    const { actions, dispatch } = createMockDispatch<AdoptFirmwareUpdatedDeviceThunkState, object>({
        getState,
        extra,
    });

    await adoptFirmwareUpdatedDeviceThunk({ device: deviceBeingUpdated })(
        dispatch,
        getState,
        extra,
    );

    return actions.map(action => (action as { type: string }).type);
};

const SELECT_DEVICE_ACTION = '@suite/device/selectDevice';

describe('adoptFirmwareUpdatedDeviceThunk', () => {
    it.each(['initial', 'started', 'check-seed', 'thp-pairing', 'error'] as const)(
        'does not touch the selection while the update is at %s',
        async status => {
            // The device reconnects several times mid-update — into the bootloader to start, and
            // back to normal to finish. `@trezor/connect` owns it throughout, so those reconnects
            // must not make us select or acquire it. 'error' is one of them: it is what the
            // reconnect prompt shows while asking the user to reboot the device by hand, so the
            // device coming back there is not the update ending. A retry does not need the
            // selection either — `firmwareUpdateThunk` resolves its own device from `cachedDevice`.
            expect(await runThunk(status)).not.toContain(SELECT_DEVICE_ACTION);
        },
    );

    it('selects the device the caller names once the update is done', async () => {
        expect(await runThunk('done')).toContain(SELECT_DEVICE_ACTION);
    });
});
