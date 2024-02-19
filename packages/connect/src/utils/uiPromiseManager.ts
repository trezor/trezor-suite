import { DEVICE, UiPromise, AnyUiPromise, UiPromiseCreator, UiPromiseResponse } from '../events';
import { createDeferred } from '@trezor/utils/lib/createDeferred';
import { arrayPartition } from '@trezor/utils/lib/arrayPartition';

export const createUiPromiseManager = (interactionTimeout: () => void) => {
    let _uiPromises: AnyUiPromise[] = [];

    const exists = (type: UiPromiseResponse['type']) => _uiPromises.some(p => p.id === type);

    // Creates an instance of uiPromise.
    const create: UiPromiseCreator = (promiseEvent, device) => {
        const uiPromise: UiPromise<typeof promiseEvent> = {
            ...createDeferred(promiseEvent),
            device,
        };
        _uiPromises.push(uiPromise as unknown as AnyUiPromise);

        // Interaction timeout
        interactionTimeout();

        return uiPromise;
    };

    const resolve = (event: UiPromiseResponse) => {
        const uiPromise = _uiPromises.find(p => p.id === event.type) as
            | UiPromise<typeof event.type>
            | undefined;
        if (!uiPromise) return false;
        uiPromise.resolve(event);
        _uiPromises = _uiPromises.filter(p => p !== uiPromise);
        return true;
    };

    const rejectAll = (error: Error) => {
        _uiPromises.forEach(p => p.reject(error));
        _uiPromises = [];
    };

    const disconnected = (devicePath: string) => {
        const [toResolve, toKeep] = arrayPartition(
            _uiPromises,
            (p): p is UiPromise<typeof DEVICE.DISCONNECT> =>
                p.device?.getDevicePath() === devicePath && p.id === DEVICE.DISCONNECT,
        );
        toResolve.forEach(p => p.resolve({ type: DEVICE.DISCONNECT }));
        _uiPromises = toKeep;
        return !!toResolve.length || toKeep.some(p => p.device?.getDevicePath() === devicePath);
    };

    const get = <T extends UiPromiseResponse['type']>(type: T) => {
        const uiPromise = _uiPromises.find(p => p.id === type) as UiPromise<T> | undefined;
        return uiPromise?.promise ?? Promise.reject(new Error(`UiPromise ${type} doesn't exist`));
    };

    const clear = () => {
        _uiPromises = [];
    };

    return { exists, create, resolve, rejectAll, disconnected, get, clear };
};
