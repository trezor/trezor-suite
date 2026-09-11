import {
    type AcquiredDevice,
    type DeviceReceiver,
    type TrezorDevice,
} from '@suite-common/suite-types';

import { getIsDeviceConnectedAndAcquired } from '../deviceUtils';
import { createDeviceReceiver } from './createDeviceReceiver';

let deviceReceiver: DeviceReceiver;

beforeEach(() => {
    deviceReceiver = createDeviceReceiver();
});

const deviceA = { id: 'DEVICE_A' } as AcquiredDevice;
const deviceB = { id: 'DEVICE_B' } as AcquiredDevice;

describe('deviceReceiver', () => {
    it('notifies every subscriber of a connected acquired device', () => {
        const first = jest.fn();
        const second = jest.fn();
        const unsubscribeFirst = deviceReceiver.onDeviceConnected(first);
        const unsubscribeSecond = deviceReceiver.onDeviceConnected(second);

        deviceReceiver.notifyDeviceConnected(deviceA);

        expect(first).toHaveBeenCalledWith(deviceA);
        expect(second).toHaveBeenCalledWith(deviceA);

        unsubscribeFirst();
        unsubscribeSecond();
    });

    it('stops notifying after unsubscribe', () => {
        const listener = jest.fn();
        const unsubscribe = deviceReceiver.onDeviceConnected(listener);

        unsubscribe();
        deviceReceiver.notifyDeviceConnected(deviceA);

        expect(listener).not.toHaveBeenCalled();
    });

    it('unsubscribing twice does not remove another subscription', () => {
        const listener = jest.fn();
        const unsubscribe = deviceReceiver.onDeviceConnected(listener);
        unsubscribe();

        const other = jest.fn();
        const unsubscribeOther = deviceReceiver.onDeviceConnected(other);
        unsubscribe();

        deviceReceiver.notifyDeviceConnected(deviceB);

        expect(other).toHaveBeenCalledWith(deviceB);

        unsubscribeOther();
    });

    it('keeps notifying the remaining subscribers when one throws', () => {
        // A subscriber's failure must not break device handling for everyone else.
        jest.spyOn(console, 'error').mockImplementation(() => {});
        const throwing = jest.fn(() => {
            throw new Error('boom');
        });
        const healthy = jest.fn();
        const unsubscribeThrowing = deviceReceiver.onDeviceConnected(throwing);
        const unsubscribeHealthy = deviceReceiver.onDeviceConnected(healthy);

        expect(() => deviceReceiver.notifyDeviceConnected(deviceA)).not.toThrow();
        expect(healthy).toHaveBeenCalledWith(deviceA);

        unsubscribeThrowing();
        unsubscribeHealthy();
        jest.restoreAllMocks();
    });

    it('keeps the connect and disconnect channels separate', () => {
        const onConnect = jest.fn();
        const onDisconnect = jest.fn();
        const unsubscribeConnect = deviceReceiver.onDeviceConnected(onConnect);
        const unsubscribeDisconnect = deviceReceiver.onDeviceDisconnected(onDisconnect);

        deviceReceiver.notifyDeviceDisconnected(deviceA);

        expect(onDisconnect).toHaveBeenCalledWith(deviceA);
        expect(onConnect).not.toHaveBeenCalled();

        unsubscribeConnect();
        unsubscribeDisconnect();
    });
});

describe('getIsDeviceConnectedAndAcquired', () => {
    it('is false while a device is connected but not yet acquired', () => {
        // A THP device arrives unacquired; the acquire that `deviceConnectThunks` starts has not
        // finished yet, so it must not be published as acquired.
        expect(
            getIsDeviceConnectedAndAcquired({
                type: 'unacquired',
                connected: true,
            } as TrezorDevice),
        ).toBe(false);
    });

    it('is false for a remembered wallet that is not physically present', () => {
        // Acquired, but nothing is behind it — publishing this on reconnect would be skipped
        // because the entry never left the list.
        expect(
            getIsDeviceConnectedAndAcquired({
                type: 'acquired',
                connected: false,
                features: {},
            } as TrezorDevice),
        ).toBe(false);
    });

    it('is true once the device is both present and read', () => {
        expect(
            getIsDeviceConnectedAndAcquired({
                type: 'acquired',
                connected: true,
                features: {},
            } as TrezorDevice),
        ).toBe(true);
    });

    it('is false for a device that is not in the list at all', () => {
        expect(getIsDeviceConnectedAndAcquired(undefined)).toBe(false);
    });
});
