import { DeviceState } from '../types';
import { Device } from './Device';
import { storage } from '@trezor/connect-common';

export interface IStateStorage {
    saveState(device: Device, state: DeviceState): void;
    loadState(device: Device): DeviceState | undefined;
}

// Storage class meant to be used in webextension environment
export class WebextensionStateStorage implements IStateStorage {
    origin: string;

    constructor(origin: string) {
        this.origin = origin;
    }

    loadState(device: Device) {
        if (!device.getState()?.sessionId) {
            const { preferredDevice } = storage.loadForOrigin(this.origin) || {};
            if (
                preferredDevice?.internalState &&
                preferredDevice?.internalStateExpiration &&
                preferredDevice.internalStateExpiration > new Date().getTime()
            ) {
                return { sessionId: preferredDevice.internalState };
            }
        }

        return undefined;
    }

    saveState(device: Device, state: DeviceState) {
        // Expiration is based on auto lock delay, but minimum is 15 minutes
        const expirationDelay = Math.max(1000 * 60 * 15, device.features.auto_lock_delay_ms ?? 0);
        storage.saveForOrigin(store => {
            return {
                ...store,
                preferredDevice: store.preferredDevice
                    ? {
                          ...store.preferredDevice,
                          state: state.staticSessionId,
                          internalState: state.sessionId,
                          internalStateExpiration: Date.now() + expirationDelay,
                      }
                    : undefined,
            };
        }, this.origin);
    }
}
