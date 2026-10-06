import { useCallback } from 'react';

import { EventEmitter } from 'events';

const DEVICE_READY_EVENT = 'device-ready';

const eventEmitter = new EventEmitter<{
    [DEVICE_READY_EVENT]: [isDeviceReady: boolean];
}>();

export const useDeviceReadyEvents = () => {
    const emitDeviceReadyEvent = useCallback(() => {
        eventEmitter.emit(DEVICE_READY_EVENT, true);
    }, []);

    const emitDeviceNotReadyEvent = useCallback(() => {
        eventEmitter.emit(DEVICE_READY_EVENT, false);
    }, []);

    const waitForDevice = () =>
        new Promise<boolean>(resolve =>
            eventEmitter.once(DEVICE_READY_EVENT, isDeviceReady => resolve(isDeviceReady)),
        );

    return { emitDeviceReadyEvent, emitDeviceNotReadyEvent, waitForDevice };
};
