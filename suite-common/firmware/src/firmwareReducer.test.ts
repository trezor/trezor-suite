import { type DeviceRootState, deviceInitialState } from '@suite-common/device';
import { type TrezorDevice } from '@suite-common/suite-types';
import { type Device } from '@trezor/connect';

import { mockTrezorDevice } from '../mocks';
import { createFirmwareDeviceRef } from './deviceRef/firmwareDeviceRef';
import {
    FirmwareDeviceTrackingPhase,
    type FirmwareDeviceTrackingState,
    firmwareDeviceTrackingInitialState,
    firmwareDeviceTrackingReducer,
} from './deviceRef/firmwareDeviceTracking';
import {
    type FirmwareRootState,
    firmwareInitialState,
    selectFirmwareDevice,
    selectFirmwareDeviceRef,
    selectFirmwareOriginalDevice,
    selectIsFirmwareUpdateFinished,
} from './firmwareReducer';

type CreateStateParams = {
    devices: TrezorDevice[];
    selectedDevice: TrezorDevice | undefined;
    deviceTracking?: FirmwareDeviceTrackingState;
};

const createState = ({
    devices,
    selectedDevice,
    deviceTracking = firmwareDeviceTrackingInitialState,
}: CreateStateParams): FirmwareRootState & DeviceRootState => ({
    firmware: { ...firmwareInitialState, deviceTracking },
    device: { ...deviceInitialState, devices, selectedDevice },
});

const deviceBeingUpdated = mockTrezorDevice({ path: '1' });

const armedTracking = (device: Device | TrezorDevice): FirmwareDeviceTrackingState => {
    const ref = createFirmwareDeviceRef(device);

    return {
        ...firmwareDeviceTrackingInitialState,
        phase: FirmwareDeviceTrackingPhase.Tracking,
        initialRef: ref,
        currentRef: ref,
    };
};

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
            deviceTracking: armedTracking(deviceBeingUpdated),
        });

        expect(selectFirmwareDevice(state)).toBeUndefined();
    });

    it('resolves the tracked device even when another device is selected', () => {
        const otherDevice = mockTrezorDevice({ path: '9', deviceId: 'DEVICE_B' });

        const state = createState({
            devices: [otherDevice, deviceBeingUpdated],
            selectedDevice: otherDevice,
            deviceTracking: armedTracking(deviceBeingUpdated),
        });

        expect(selectFirmwareDevice(state)).toBe(deviceBeingUpdated);
    });
});

describe('selectFirmwareDeviceRef', () => {
    it('points at the reconnected device once the machine has adopted it', () => {
        // What `handleFirmwareTrackedDeviceConnectThunk` compares against to answer
        // "is this the device we were waiting for".
        const reconnected = mockTrezorDevice({ path: '5' });
        const tracking = firmwareDeviceTrackingReducer(
            firmwareDeviceTrackingReducer(armedTracking(deviceBeingUpdated), {
                type: 'device-disconnect',
                device: deviceBeingUpdated,
            }),
            { type: 'device-connect', device: reconnected, isOnlyCandidate: false },
        );

        const state = createState({
            devices: [reconnected],
            selectedDevice: undefined,
            deviceTracking: tracking,
        });

        expect(selectFirmwareDeviceRef(state)?.path).toBe('5');
        expect(selectFirmwareDevice(state)).toBe(reconnected);
    });

    it('still points at the original device when an unrelated one connects', () => {
        const bystander = mockTrezorDevice({ path: '9', deviceId: 'DEVICE_B' });
        const tracking = firmwareDeviceTrackingReducer(
            firmwareDeviceTrackingReducer(armedTracking(deviceBeingUpdated), {
                type: 'device-disconnect',
                device: deviceBeingUpdated,
            }),
            { type: 'device-connect', device: bystander, isOnlyCandidate: false },
        );

        const state = createState({
            devices: [bystander],
            selectedDevice: bystander,
            deviceTracking: tracking,
        });

        expect(selectFirmwareDeviceRef(state)?.path).toBe('1');
        // Not resolvable, and deliberately not the selected bystander.
        expect(selectFirmwareDevice(state)).toBeUndefined();
    });
});

describe('selectIsFirmwareUpdateFinished', () => {
    it.each([
        ['initial', false],
        ['started', false],
        ['check-seed', false],
        ['thp-pairing', false],
        ['done', true],
        ['error', true],
    ] as const)('is %s -> %s', (status, expected) => {
        const state = createState({ devices: [], selectedDevice: undefined });

        expect(
            selectIsFirmwareUpdateFinished({ ...state, firmware: { ...state.firmware, status } }),
        ).toBe(expected);
    });
});
