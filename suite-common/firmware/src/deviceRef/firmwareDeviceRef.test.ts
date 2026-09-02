import { DeviceModelInternal } from '@trezor/device-utils';

import {
    createFirmwareDeviceRef,
    getIsOnlyFirmwareDeviceRefCandidate,
    resolveDeviceByFirmwareRef,
} from './firmwareDeviceRef';
import { mockDevice, mockTrezorDevice } from '../../mocks';

const ref = createFirmwareDeviceRef(mockDevice({ path: '1' }));

describe('getIsOnlyFirmwareDeviceRefCandidate', () => {
    it('accepts a reconnected device when nothing else could be mistaken for it', () => {
        const reconnected = mockDevice({ path: '2', deviceId: 'DEVICE_B' });

        expect(
            getIsOnlyFirmwareDeviceRefCandidate({
                device: reconnected,
                connectedDevices: [reconnected],
                ref,
            }),
        ).toBe(true);
    });

    it('rejects it when a second device of the same model is connected', () => {
        const reconnected = mockDevice({ path: '2', deviceId: 'DEVICE_B' });
        const bystander = mockDevice({ path: '3', deviceId: 'DEVICE_C' });

        expect(
            getIsOnlyFirmwareDeviceRefCandidate({
                device: reconnected,
                connectedDevices: [reconnected, bystander],
                ref,
            }),
        ).toBe(false);
    });

    it('ignores connected devices that could never match the ref', () => {
        const reconnected = mockDevice({ path: '2', deviceId: 'DEVICE_B' });
        const otherModel = mockDevice({
            path: '3',
            deviceId: 'DEVICE_C',
            internalModel: DeviceModelInternal.T1B1,
        });
        const otherTransport = mockDevice({
            path: '4',
            deviceId: 'DEVICE_D',
            apiType: 'bluetooth',
        });

        expect(
            getIsOnlyFirmwareDeviceRefCandidate({
                device: reconnected,
                connectedDevices: [reconnected, otherModel, otherTransport],
                ref,
            }),
        ).toBe(true);
    });

    it('rejects a device that is not itself among the connected ones', () => {
        // Guards against acting on a stale event after the device went away again.
        const reconnected = mockDevice({ path: '2', deviceId: 'DEVICE_B' });
        const somethingElse = mockDevice({ path: '3', deviceId: 'DEVICE_C' });

        expect(
            getIsOnlyFirmwareDeviceRefCandidate({
                device: reconnected,
                connectedDevices: [somethingElse],
                ref,
            }),
        ).toBe(false);
    });

    it('rejects when nothing is connected', () => {
        expect(
            getIsOnlyFirmwareDeviceRefCandidate({
                device: mockDevice({ path: '2', deviceId: 'DEVICE_B' }),
                connectedDevices: [],
                ref,
            }),
        ).toBe(false);
    });
});

describe('resolveDeviceByFirmwareRef', () => {
    it('resolves nothing while the tracked device is away, even next to a same-model wallet', () => {
        // The scenario that made the flow report on the wrong device: our device is mid-reboot and
        // gone from the list, and the only thing left is a remembered wallet of the same model.
        // A `Model`-strength candidate must never be enough to resolve.
        const rememberedOtherDevice = mockTrezorDevice({
            path: '',
            deviceId: 'DEVICE_B',
            connected: false,
            instance: 1,
        });

        expect(
            resolveDeviceByFirmwareRef({ devices: [rememberedOtherDevice], ref }),
        ).toBeUndefined();
    });

    it('prefers the live entry over the remembered one for the same physical device', () => {
        // After the reboot the device is in the list twice: the remembered wallet that survived the
        // disconnect with an emptied path, and the fresh connection. Both match on `device_id`.
        const rememberedSameDevice = mockTrezorDevice({
            path: '',
            connected: false,
            instance: 2,
        });
        const reconnected = mockTrezorDevice({ path: '5', instance: undefined });
        const refWithInstance = { ...ref, instance: 2 };

        expect(
            resolveDeviceByFirmwareRef({
                devices: [rememberedSameDevice, reconnected],
                ref: refWithInstance,
            }),
        ).toBe(reconnected);
    });

    it('falls back to the remembered entry when nothing is connected', () => {
        const rememberedSameDevice = mockTrezorDevice({ path: '', connected: false });

        expect(resolveDeviceByFirmwareRef({ devices: [rememberedSameDevice], ref })).toBe(
            rememberedSameDevice,
        );
    });

    it('prefers the wallet instance the update started from among connected entries', () => {
        const standardWallet = mockTrezorDevice({ path: '5', instance: undefined });
        const hiddenWallet = mockTrezorDevice({ path: '5', instance: 2 });

        expect(
            resolveDeviceByFirmwareRef({
                devices: [standardWallet, hiddenWallet],
                ref: { ...ref, instance: 2 },
            }),
        ).toBe(hiddenWallet);
    });

    it('resolves nothing without a ref', () => {
        expect(
            resolveDeviceByFirmwareRef({
                devices: [mockTrezorDevice({ path: '1' })],
                ref: undefined,
            }),
        ).toBeUndefined();
    });
});
