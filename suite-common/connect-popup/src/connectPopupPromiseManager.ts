import { type CallMethodAnyResponse } from '@trezor/connect';
import { type Deferred, createDeferred } from '@trezor/utils';

import { type SelectFeeChoice } from './connectPopupTypes';

type GetDeferred<Resolve> = (clear?: boolean) => Deferred<Resolve>;
type AwaitDeferred = () => Promise<void>;

// Custom helper, createDeferredManager didn't fit the needs here
const createDeferredWrapper = <Resolve = void>(id: string) => {
    let _deferred: Deferred<Resolve> | undefined;

    const getDeferred = (clear: boolean = false) => {
        if (!_deferred || clear) {
            _deferred = createDeferred(id);
            // Reset when the call is finished. Swallow here — this internal cleanup chain has no
            // consumer of its own; without the catch, a rejection (e.g. Method_Cancel) becomes an
            // unhandled promise rejection even though callers of `.promise` handle it themselves.
            _deferred.promise
                .finally(() => {
                    _deferred = undefined;
                })
                .catch(() => {});
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
export const getPopupCallDeferred: GetDeferred<Awaited<CallMethodAnyResponse>> =
    callDeferredWrapper.getDeferred;
export const queuePopupCall: AwaitDeferred = callDeferredWrapper.awaitDeferred;

// Deferred for the permission request and the following user interactions of the call
const permissionDeferredWrapper = createDeferredWrapper<SelectFeeChoice | void>('popup-permission');
export const getPermissionDeferred: GetDeferred<SelectFeeChoice | void> =
    permissionDeferredWrapper.getDeferred;

// Aborted by the cancel of the current call, so that its flow stops wherever it waits.
let callAbortController = new AbortController();

export const createPopupCallSignal = () => {
    callAbortController = new AbortController();

    return callAbortController.signal;
};

export const abortPopupCall = (reason: unknown) => callAbortController.abort(reason);
