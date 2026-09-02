import type { Device } from '@trezor/connect';

import type { AcquiredDevice, TrezorDevice } from './device';

type DeviceConnectedListener = (device: AcquiredDevice) => void;
type DeviceDisconnectedListener = (device: Device | TrezorDevice) => void;

type Unsubscribe = () => void;

/**
 * Device connections, published only once the device list already reflects them.
 *
 * `@trezor/connect`'s own `DEVICE_EVENT` is the raw signal, and it is what `connectInitThunks`
 * subscribes to in order to build that list. A second subscriber to the same event races the first
 * one: it is woken with a device that may not be in `state.device.devices` yet, so anything it
 * wants to look up, select, or compare against the other connected devices is reading a store that
 * has not caught up. Subscribing here instead removes the ordering question.
 */
export type DeviceReceiver = {
    /**
     * Fires once a device is in the device list with its features read, delivering the store entry
     * rather than the raw descriptor.
     *
     * This covers a device that arrives unacquired too: `@trezor/connect` re-emits its connect
     * event after the acquire it triggers has landed, so the listener is called at the point the
     * device is actually usable, not when it first appeared on the wire.
     *
     * @returns unsubscribe
     */
    onDeviceConnected: (listener: DeviceConnectedListener) => Unsubscribe;
    /**
     * Fires once a disconnect has been processed, so the device list already reflects it — the
     * entry is gone unless the device was remembered, in which case it survives with an emptied
     * path. The device itself is therefore delivered as connect reported it, not as a store entry.
     *
     * @returns unsubscribe
     */
    onDeviceDisconnected: (listener: DeviceDisconnectedListener) => Unsubscribe;
    /** Called by the connect event bridge once the device list reflects the connection. */
    notifyDeviceConnected: (device: AcquiredDevice) => void;
    /** Called by the connect event bridge once the device list reflects the disconnection. */
    notifyDeviceDisconnected: (device: Device | TrezorDevice) => void;
};

export type DeviceReceiverDep = {
    deviceReceiver: DeviceReceiver;
};

export const selectDeviceReceiverDep = (services: any): DeviceReceiverDep => ({
    deviceReceiver: services.deviceReceiver,
});
