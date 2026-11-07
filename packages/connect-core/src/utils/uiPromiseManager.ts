import { createDeferred } from '@trezor/utils';

import type {
    AnyUiPromise,
    UiPromise,
    UiPromiseCreator,
    UiPromiseResponse,
} from '../events/ui-promise';
import type { IDevice } from '../types/idevice';

// Promises are shared by concurrent calls on different devices. A promise is registered while
// pending and leaves the registry exactly once: resolved by a matching UI response, rejected
// with an error, or dropped when the call on its device ends. Scoping reject and drop to
// a device keeps one call from settling prompts that another device is still waiting for.
type UiPromiseScope = { device?: IDevice };

const isInScope = (uiPromise: AnyUiPromise, { device }: UiPromiseScope) =>
    !device || uiPromise.device === device;

export const createUiPromiseManager = () => {
    let _uiPromises: AnyUiPromise[] = [];

    const unregister = (uiPromise: AnyUiPromise) => {
        _uiPromises = _uiPromises.filter(p => p !== uiPromise);
    };

    const exists = (type: UiPromiseResponse['type']) => _uiPromises.some(p => p.id === type);

    // Creates an instance of uiPromise.
    const create: UiPromiseCreator = (promiseEvent, device) => {
        const uiPromise: UiPromise<typeof promiseEvent> = {
            ...createDeferred(promiseEvent),
            device,
            requestId: crypto.randomUUID(),
        };
        const registeredPromise = uiPromise as unknown as AnyUiPromise;

        // enhance Deferred reject fn
        const { reject } = uiPromise;
        uiPromise.reject = (error: Error) => {
            reject(error);
            unregister(registeredPromise);
        };

        _uiPromises.push(registeredPromise);

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
        unregister(uiPromise as unknown as AnyUiPromise);

        return true;
    };

    const rejectAll = (error: Error, scope: UiPromiseScope = {}) => {
        _uiPromises.filter(p => isInScope(p, scope)).forEach(p => p.reject(error));
    };

    // Dropped promises are never settled. Their callers race them against the call abort signal.
    const clear = (scope: UiPromiseScope = {}) => {
        _uiPromises = _uiPromises.filter(p => !isInScope(p, scope));
    };

    return { exists, create, resolve, rejectAll, clear };
};
