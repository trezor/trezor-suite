import type { DeviceUniquePath } from '@trezor/connect-common/src/types/device';
import { arrayPartition, createDeferred } from '@trezor/utils';

import { DEVICE } from '../events';
import type { AnyUiPromise, UiPromise, UiPromiseCreator, UiPromiseResponse } from '../events';

export const createUiPromiseManager = () => {
    let _uiPromises: AnyUiPromise[] = [];

    const exists = (type: UiPromiseResponse['type']) => _uiPromises.some(p => p.id === type);

    // Creates an instance of uiPromise.
    const create: UiPromiseCreator = (promiseEvent, device) => {
        const uiPromise: UiPromise<typeof promiseEvent> = {
            ...createDeferred(promiseEvent),
            device,
        };

        const existing = _uiPromises.findIndex(p => p.id === promiseEvent);
        if (existing >= 0) {
            console.warn(`UiPromise '${promiseEvent}' already exists.`);
            _uiPromises.splice(existing, 1);
        }

        // enhance Deferred reject fn
        const { reject } = uiPromise;
        uiPromise.reject = (error: Error) => {
            reject(error);
            _uiPromises = _uiPromises.filter(p => p.id !== promiseEvent);
        };

        _uiPromises.push(uiPromise as unknown as AnyUiPromise);

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

    const disconnected = (devicePath: DeviceUniquePath) => {
        const [toResolve, toKeep] = arrayPartition(
            _uiPromises,
            (p): p is UiPromise<typeof DEVICE.DISCONNECT> =>
                p.device?.getUniquePath() === devicePath && p.id === DEVICE.DISCONNECT,
        );
        toResolve.forEach(p => p.resolve({ type: DEVICE.DISCONNECT }));
        _uiPromises = toKeep;

        return !!toResolve.length || toKeep.some(p => p.device?.getUniquePath() === devicePath);
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
