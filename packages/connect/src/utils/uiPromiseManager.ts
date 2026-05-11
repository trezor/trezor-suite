import { createDeferred } from '@trezor/utils';

import type {
    AnyUiPromise,
    UiPromise,
    UiPromiseCreator,
    UiPromiseResponse,
} from '../events/ui-promise';

export const createUiPromiseManager = () => {
    let _uiPromises: AnyUiPromise[] = [];

    const exists = (type: UiPromiseResponse['type']) => _uiPromises.some(p => p.id === type);

    // Creates an instance of uiPromise.
    const create: UiPromiseCreator = (promiseEvent, device) => {
        const requestId = crypto.randomUUID();
        const uiPromise: UiPromise<typeof promiseEvent> = {
            ...createDeferred(promiseEvent),
            device,
            requestId,
        };

        // Only evict an existing promise of the same type if it has no requestId.
        // Promises with a requestId are uniquely identified and can coexist (e.g. two
        // devices simultaneously requesting the same input type).
        // If we assume requestId will be available for all the requests this code is unnecessary.
        const existing = _uiPromises.findIndex(p => p.id === promiseEvent && !p.requestId);
        if (existing >= 0) {
            console.warn(`UiPromise '${promiseEvent}' already exists.`);
            _uiPromises.splice(existing, 1);
        }

        // enhance Deferred reject fn
        const { reject } = uiPromise;
        uiPromise.reject = (error: Error) => {
            reject(error);
            _uiPromises = _uiPromises.filter(p => p.requestId !== requestId);
        };

        _uiPromises.push(uiPromise as unknown as AnyUiPromise);

        return uiPromise;
    };

    const resolve = (event: UiPromiseResponse) => {
        const uiPromise = _uiPromises.find(p => {
            if (p.id !== event.type) return false;

            // If the response carries a requestId, match exactly.
            // Otherwise fall back to type-only matching for backward compatibility
            // with older popup builds and direct TrezorConnect.uiResponse() callers
            // that don't yet include a requestId.
            return event.requestId == null || p.requestId === event.requestId;
        }) as UiPromise<typeof event.type> | undefined;
        if (!uiPromise) return false;
        uiPromise.resolve(event);
        _uiPromises = _uiPromises.filter(p => p !== uiPromise);

        return true;
    };

    const rejectAll = (error: Error) => {
        _uiPromises.forEach(p => p.reject(error));
        _uiPromises = [];
    };

    const clear = () => {
        _uiPromises = [];
    };

    return { exists, create, resolve, rejectAll, clear };
};
