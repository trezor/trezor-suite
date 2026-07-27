import { asEncryptedHex } from '@suite-common/platform-encryption';
import type { AnyAction } from '@suite-common/redux-utils';
import type { DelegatedIdentityKey } from '@suite-common/suite-types';
import { mockConnectDevice } from '@suite-common/suite-types/mocks';
import { extraDependenciesCommonMock } from '@suite-common/test-utils';
import { DeviceModelInternal } from '@trezor/device-utils';

import { deviceActions } from './deviceActions';
import { prepareDeviceReducer } from './deviceReducer';

/*
 This is a test for `persistentDeviceDataReducer`, but because it is a child reducer meant to be used in `deviceReducer`,
 we are testing it through `deviceReducer`, to verify that the integration works (delegating as it should).
*/
const deviceReducer = prepareDeviceReducer(extraDependenciesCommonMock);

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

const reducerInitialState = deviceReducer(undefined, EMPTY_ACTION);

const reduceMultipleActions = (...actions: AnyAction[]) =>
    actions.reduce((state, action) => deviceReducer(state, action), reducerInitialState);

describe('deviceReducer persistentDeviceData child reducer', () => {
    it('stores persistent device data on connectDevice', () => {
        const state = reduceMultipleActions(deviceActions.connectDevice({ device: usbDevice }));

        expect(state.persistentDeviceData).toHaveLength(1);
        expect(state.persistentDeviceData[0]).toEqual(
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
        expect(state.persistentDeviceData[0]?.descriptor).toBeUndefined();
    });

    it('updates existing persistent device data on deviceChanged', () => {
        const state = reduceMultipleActions(
            deviceActions.connectDevice({ device: usbDevice }),
            deviceActions.deviceChanged(bluetoothDevice),
        );

        expect(state.persistentDeviceData).toHaveLength(1);
        expect(state.persistentDeviceData[0]).toEqual(
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
            deviceActions.forgetDevicePersistentData({ deviceId: 'device-id-1' }),
        );

        expect(state.persistentDeviceData).toHaveLength(1);
        expect(state.persistentDeviceData).toEqual([
            expect.objectContaining({ device_id: 'device-id-2' }),
        ]);
    });

    it('clears device data on clearDevicePersistentData', () => {
        const state = reduceMultipleActions(
            deviceActions.connectDevice({ device: usbDevice }),
            deviceActions.connectDevice({ device: secondUsbDevice }),
            deviceActions.clearDevicePersistentData(),
        );

        expect(state.persistentDeviceData).toEqual([]);
    });

    it('stores entropy check result on setEntropyCheckResult', () => {
        const state = reduceMultipleActions(
            deviceActions.connectDevice({ device: usbDevice }),
            deviceActions.setEntropyCheckResult({
                deviceId: 'device-id-1',
                success: false,
            }),
        );

        expect(state.persistentDeviceData).toHaveLength(1);
        expect(state.persistentDeviceData[0]).toEqual(
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
            deviceActions.setDelegatedIdentityKey({
                deviceId: 'device-id-1',
                delegatedKey,
            }),
        );

        expect(state.persistentDeviceData).toHaveLength(1);
        expect(state.persistentDeviceData[0]).toEqual(
            expect.objectContaining({
                delegatedIdentityKey: delegatedKey,
            }),
        );
    });

    it('stores device authenticity result on setDeviceAuthenticityResult', () => {
        const state = reduceMultipleActions(
            deviceActions.connectDevice({ device: usbDevice }),
            deviceActions.setDeviceAuthenticityResult({
                deviceId: 'device-id-1',
                result: {
                    valid: true,
                    optigaResult: { valid: true, rootPubKey: 'root-pub-key' },
                    tropicResult: null,
                    mcuResult: null,
                },
            }),
        );

        expect(state.persistentDeviceData).toHaveLength(1);
        expect(state.persistentDeviceData[0]).toEqual(
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
            deviceActions.setManualDeviceCheckSuccess({ deviceId: 'device-id-1' }),
        );

        expect(state.persistentDeviceData).toHaveLength(1);
        expect(state.persistentDeviceData[0]).toEqual(
            expect.objectContaining({
                manualCheckResult: { success: true },
            }),
        );
    });

    it('keeps persistentDeviceData unchanged on other device actions', () => {
        const state = reduceMultipleActions(deviceActions.connectDevice({ device: usbDevice }));
        expect(state.persistentDeviceData).toHaveLength(1);

        const stateSelected = deviceReducer(state, deviceActions.selectDevice(state.devices[0]));
        expect(stateSelected.persistentDeviceData).toBe(state.persistentDeviceData);

        const stateConnectUnacquired = deviceReducer(
            state,
            deviceActions.connectUnacquiredDevice({ device: unacquiredDevice }),
        );
        expect(stateConnectUnacquired.persistentDeviceData).toBe(state.persistentDeviceData);
    });
});
