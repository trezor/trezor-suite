import { deviceActions } from '@suite-common/device';
import { asEncryptedHex } from '@suite-common/platform-encryption';
import { mockActionType, mockReducer } from '@suite-common/redux-utils/mocks';
import type { DelegatedIdentityKey } from '@suite-common/suite-types';
import { mockConnectDevice } from '@suite-common/suite-types/mocks';
import { DeviceModelInternal } from '@trezor/device-utils';

import { persistentDeviceDataActions } from './persistentDeviceDataActions';
import {
    type PersistentDeviceDataState,
    preparePersistentDeviceDataReducer,
} from './persistentDeviceDataReducer';

const persistentDeviceDataReducer = preparePersistentDeviceDataReducer({
    actionTypes: { storageLoad: mockActionType('storageLoad') },
    reducers: { storageLoadPersistentDeviceData: mockReducer() },
});

const usbDevice = mockConnectDevice(
    { path: 'usb-path', descriptor: { apiType: 'usb', id: 'usb-device' } },
    { device_id: 'device-id-1' },
);

const bluetoothDevice = mockConnectDevice(
    { path: 'bluetooth-path', descriptor: { apiType: 'bluetooth', id: 'bluetooth-device' } },
    { device_id: 'device-id-1', revision: 'asdf1234', label: 'My Trevor' },
);

const secondUsbDevice = mockConnectDevice(
    { path: 'usb-path-2', descriptor: { apiType: 'usb', id: 'usb-device-2' } },
    { device_id: 'device-id-2' },
);

const unacquiredDevice = mockConnectDevice({
    path: 'unacquired-path',
    type: 'unacquired',
});

const EMPTY_ACTION = { type: 'foo' };

const reduceMultipleActions = (...actions: { type: string; payload?: unknown }[]) =>
    actions.reduce<PersistentDeviceDataState>(
        (state, action) => persistentDeviceDataReducer(state, action),
        { devices: [] },
    );

describe('persistentDeviceDataReducer', () => {
    it('stores persistent device data on connectDevice', () => {
        const state = reduceMultipleActions(deviceActions.connectDevice({ device: usbDevice }));

        expect(state.devices).toHaveLength(1);
        expect(state.devices[0]).toEqual(
            expect.objectContaining({
                device_id: 'device-id-1',
                label: usbDevice.features?.label,
                revision: usbDevice.features?.revision,
                initialized: true,
                fw_vendor: null,
                internal_model: DeviceModelInternal.T2T1,
                delegatedIdentityKey: null,
                lastConnectedVia: 'usb',
                firmwareVersion: [2, 1, 1],
            }),
        );
        expect(state.devices[0]?.descriptor).toBeUndefined();
    });

    it('updates existing persistent device data on deviceChanged', () => {
        const state = reduceMultipleActions(
            deviceActions.connectDevice({ device: usbDevice }),
            deviceActions.deviceChanged(bluetoothDevice),
        );

        expect(state.devices).toHaveLength(1);
        expect(state.devices[0]).toEqual(
            expect.objectContaining({
                device_id: 'device-id-1',
                label: bluetoothDevice.features?.label,
                revision: bluetoothDevice.features?.revision,
                lastConnectedVia: 'bluetooth',
                descriptor: bluetoothDevice.descriptor,
            }),
        );
    });

    it('removes device data on forgetDevicePersistentData', () => {
        const state = reduceMultipleActions(
            deviceActions.connectDevice({ device: usbDevice }),
            deviceActions.connectDevice({ device: secondUsbDevice }),
            persistentDeviceDataActions.forgetDevicePersistentData({ deviceId: 'device-id-1' }),
        );

        expect(state.devices).toHaveLength(1);
        expect(state.devices).toEqual([expect.objectContaining({ device_id: 'device-id-2' })]);
    });

    it('clears device data on clearDevicePersistentData', () => {
        const state = reduceMultipleActions(
            deviceActions.connectDevice({ device: usbDevice }),
            deviceActions.connectDevice({ device: secondUsbDevice }),
            persistentDeviceDataActions.clearDevicePersistentData(),
        );

        expect(state.devices).toEqual([]);
    });

    it('stores entropy check result on setEntropyCheckResult', () => {
        const state = reduceMultipleActions(
            deviceActions.connectDevice({ device: usbDevice }),
            persistentDeviceDataActions.setEntropyCheckResult({
                deviceId: 'device-id-1',
                success: false,
            }),
        );

        expect(state.devices).toHaveLength(1);
        expect(state.devices[0]).toEqual(
            expect.objectContaining({
                lastEntropyCheckResult: {
                    success: false,
                },
            }),
        );
    });

    it('stores delegated identity key on setDelegatedIdentityKey', () => {
        const delegatedKey = asEncryptedHex<DelegatedIdentityKey>('delegated-key-<encrypted>');

        const state = reduceMultipleActions(
            deviceActions.connectDevice({ device: usbDevice }),
            persistentDeviceDataActions.setDelegatedIdentityKey({
                deviceId: 'device-id-1',
                delegatedKey,
            }),
        );

        expect(state.devices).toHaveLength(1);
        expect(state.devices[0]).toEqual(
            expect.objectContaining({
                delegatedIdentityKey: delegatedKey,
            }),
        );
    });

    it('stores device authenticity result on setDeviceAuthenticityResult', () => {
        const state = reduceMultipleActions(
            deviceActions.connectDevice({ device: usbDevice }),
            persistentDeviceDataActions.setDeviceAuthenticityResult({
                deviceId: 'device-id-1',
                result: {
                    valid: true,
                    optigaResult: { valid: true, rootPubKey: 'root-pub-key' },
                    tropicResult: null,
                    mcuResult: null,
                },
            }),
        );

        expect(state.devices).toHaveLength(1);
        expect(state.devices[0]).toEqual(
            expect.objectContaining({
                authenticityResult: {
                    valid: true,
                    optigaResult: { valid: true, rootPubKey: 'root-pub-key' },
                    tropicResult: null,
                    mcuResult: null,
                },
            }),
        );
    });

    it('stores manual device check success on setManualDeviceCheckSuccess', () => {
        const state = reduceMultipleActions(
            deviceActions.connectDevice({ device: usbDevice }),
            persistentDeviceDataActions.setManualDeviceCheckSuccess({ deviceId: 'device-id-1' }),
        );

        expect(state.devices).toHaveLength(1);
        expect(state.devices[0]).toEqual(
            expect.objectContaining({
                manualCheckResult: { success: true },
            }),
        );
    });

    it('keeps persistentDeviceData unchanged on unrelated actions and unacquired connects', () => {
        const initialState = reduceMultipleActions(
            deviceActions.connectDevice({ device: usbDevice }),
        );
        expect(initialState.devices).toHaveLength(1);

        const stateSelected = persistentDeviceDataReducer(initialState, EMPTY_ACTION);
        expect(stateSelected).toBe(initialState);

        const stateConnectUnacquired = persistentDeviceDataReducer(
            initialState,
            deviceActions.connectDevice({ device: unacquiredDevice }),
        );
        expect(stateConnectUnacquired).toBe(initialState);
    });
});
