import { type DeviceReceiver } from '@suite-common/suite-types';

type Unsubscribe = () => void;

const subscribe = <TListener>(listeners: Set<TListener>, listener: TListener): Unsubscribe => {
    listeners.add(listener);

    return () => {
        listeners.delete(listener);
    };
};

// A subscriber's failure must not break device handling for everyone else.
const notifyAll = <TPayload>(listeners: Set<(payload: TPayload) => void>, payload: TPayload) => {
    listeners.forEach(listener => {
        try {
            listener(payload);
        } catch (error) {
            console.error('deviceReceiver listener failed', error);
        }
    });
};

export const createDeviceReceiver = (): DeviceReceiver => {
    const connectedListeners = new Set<Parameters<DeviceReceiver['onDeviceConnected']>[0]>();
    const disconnectedListeners = new Set<Parameters<DeviceReceiver['onDeviceDisconnected']>[0]>();

    return {
        onDeviceConnected: listener => subscribe(connectedListeners, listener),
        onDeviceDisconnected: listener => subscribe(disconnectedListeners, listener),
        notifyDeviceConnected: device => notifyAll(connectedListeners, device),
        notifyDeviceDisconnected: device => notifyAll(disconnectedListeners, device),
    };
};
