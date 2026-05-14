import { type CallMethodAnyResponse } from '@trezor/connect';
import { type Deferred, createDeferred } from '@trezor/utils';

// Custom helper, createDeferredManager didn't fit the needs here
const createDeferredWrapper = <Resolve = void>(id: string) => {
    let _deferred: Deferred<Resolve> | undefined;

    const getDeferred = (clear: boolean = false) => {
        if (!_deferred || clear) {
            _deferred = createDeferred(id);
            _deferred.promise.finally(() => {
                // Reset when the call is finished
                _deferred = undefined;
            });
        }

        return _deferred;
    };

    const awaitDeferred = async () => {
        await _deferred?.promise;
    };

    return { getDeferred, awaitDeferred };
};

// Deferred for the entire Connect call
const callDeferredWrapper = createDeferredWrapper<Awaited<CallMethodAnyResponse>>('popup-call');
export const getPopupCallDeferred = callDeferredWrapper.getDeferred;
export const queuePopupCall = callDeferredWrapper.awaitDeferred;

// Deferred for the permission request
const permissionDeferredWrapper = createDeferredWrapper('popup-permission');
export const getPermissionDeferred = permissionDeferredWrapper.getDeferred;
