import { type DeviceRootState, deviceInitialState } from '@suite-common/device';
import { mockTrezorDevice } from '@suite-common/device/mocks';
import { type TrezorDevice } from '@suite-common/suite-types';

import {
    type FirmwareRootState,
    firmwareInitialState,
    selectFirmwareDevice,
    selectFirmwareOriginalDevice,
    selectIsFirmwareUpdateFinished,
} from './firmwareReducer';

type CreateStateParams = {
    devices: TrezorDevice[];
    selectedDevice: TrezorDevice | undefined;
    /** The device the flow started on, which is what pins it — see `firmwareActions.cacheDevice`. */
    cachedDevice?: TrezorDevice;
};

const createState = ({
    devices,
    selectedDevice,
    cachedDevice,
}: CreateStateParams): FirmwareRootState & DeviceRootState => ({
    firmware: { ...firmwareInitialState, cachedDevice },
    device: { ...deviceInitialState, devices, selectedDevice },
});

const deviceBeingUpdated = mockTrezorDevice({ path: '1' });

describe('selectFirmwareDevice', () => {
    it('resolves nothing while no device is pinned, whatever is selected', () => {
        const state = createState({
            devices: [deviceBeingUpdated],
            selectedDevice: deviceBeingUpdated,
        });

        expect(selectFirmwareDevice(state)).toBeUndefined();
        // The flow still has a device to render before it pins one.
        expect(selectFirmwareOriginalDevice(state)).toBe(deviceBeingUpdated);
    });

    it('never falls back to the selection once a device is pinned', () => {
        // The device is mid-reboot, so its entry is gone from the list and the selection has moved
        // to a remembered wallet of the same model. Reporting on that device would be wrong: it is
        // not the one being updated.
        const rememberedOtherDevice = mockTrezorDevice({
            path: '',
            deviceId: 'DEVICE_B',
            connected: false,
        });

        const state = createState({
            devices: [rememberedOtherDevice],
            selectedDevice: rememberedOtherDevice,
            cachedDevice: deviceBeingUpdated,
        });

        expect(selectFirmwareDevice(state)).toBeUndefined();
    });

    it('resolves the device at the pinned path even when another device is selected', () => {
        const otherDevice = mockTrezorDevice({ path: '9', deviceId: 'DEVICE_B' });

        const state = createState({
            devices: [otherDevice, deviceBeingUpdated],
            selectedDevice: otherDevice,
            cachedDevice: deviceBeingUpdated,
        });

        expect(selectFirmwareDevice(state)).toBe(deviceBeingUpdated);
    });

    // A reboot can bring the device back somewhere else, and after a wipe it reports a new id, so
    // the path it was pinned at is gone. It is still the only device we could be updating.
    it('resolves a device that came back on another path, when it is the only one', () => {
        const rebootedDevice = mockTrezorDevice({ path: '5', deviceId: undefined });

        const state = createState({
            devices: [rebootedDevice],
            selectedDevice: undefined,
            cachedDevice: deviceBeingUpdated,
        });

        expect(selectFirmwareDevice(state)).toBe(rebootedDevice);
    });

    it('resolves nothing when two devices make the answer ambiguous', () => {
        const state = createState({
            devices: [
                mockTrezorDevice({ path: '5', deviceId: undefined }),
                mockTrezorDevice({ path: '9', deviceId: 'DEVICE_B' }),
            ],
            selectedDevice: undefined,
            cachedDevice: deviceBeingUpdated,
        });

        expect(selectFirmwareDevice(state)).toBeUndefined();
    });

    it('ignores a device on another transport', () => {
        const bluetoothDevice = mockTrezorDevice({
            path: '5',
            deviceId: 'DEVICE_B',
            apiType: 'bluetooth',
        });

        const state = createState({
            devices: [bluetoothDevice],
            selectedDevice: undefined,
            cachedDevice: deviceBeingUpdated,
        });

        expect(selectFirmwareDevice(state)).toBeUndefined();
    });
});

describe('selectIsFirmwareUpdateFinished', () => {
    it('is finished at done', () => {
        expect(
            selectIsFirmwareUpdateFinished({
                firmware: { ...firmwareInitialState, status: 'done' },
            } as FirmwareRootState),
        ).toBe(true);
    });

    it.each(['initial', 'started', 'check-seed', 'thp-pairing', 'error'] as const)(
        // 'error' included: it is what the reconnect prompt shows for "reboot it by hand", so the
        // device turning up then is the user following instructions, not the update ending.
        'is not finished at %s',
        status => {
            expect(
                selectIsFirmwareUpdateFinished({
                    firmware: { ...firmwareInitialState, status },
                } as FirmwareRootState),
            ).toBe(false);
        },
    );
});
