import { type CallMethodAnyResponse } from '@trezor/connect';
import { type Deferred, createDeferred } from '@trezor/utils';

type GetDeferred<Resolve> = (clear?: boolean) => Deferred<Resolve>;

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

    return { getDeferred };
};

type PopupCallResponse = Awaited<CallMethodAnyResponse>;

// Each popup call has its own deferred for the response, found by the `responseId` the call
// carries, so a call can only settle the deferred of its own caller.
const popupCallDeferreds = new Map<string, Deferred<PopupCallResponse, string>>();
// The most recently started popup call, which a cancel falls back to.
let latestPopupCall: Deferred<PopupCallResponse, string> | undefined;

/**
 * Creates the deferred for the response of a popup call that starts right away. Pass its `id` as
 * `responseId` of the call.
 */
export const createPopupCallDeferred = () => {
    const deferred = createDeferred<PopupCallResponse, string>(crypto.randomUUID());
    popupCallDeferreds.set(deferred.id, deferred);
    latestPopupCall = deferred;
    deferred.promise
        .finally(() => {
            popupCallDeferreds.delete(deferred.id);
            if (latestPopupCall === deferred) latestPopupCall = undefined;
        })
        .catch(() => {});

    return deferred;
};

/**
 * Waits until every popup call still in flight has settled, then creates the deferred for the next
 * one. All of them, not just the most recent: WalletConnect and deeplink calls start without
 * queuing, so a queued call waiting only for the latest one could start while an earlier call is
 * still running, and both would drive the single active call. The deferred is created in the same
 * tick as the check, so of several waiters only one starts.
 */
export const queuePopupCall = async () => {
    while (popupCallDeferreds.size > 0) {
        await Promise.all([...popupCallDeferreds.values()].map(deferred => deferred.promise));
    }

    return createPopupCallDeferred();
};

export const resolvePopupCall = (responseId: string | undefined, response: PopupCallResponse) => {
    if (responseId) popupCallDeferreds.get(responseId)?.resolve(response);
};

type ResolveCancelledPopupCallOptions = { fallbackToLatest: boolean };

/**
 * Settles the deferred of the call a cancel ends. Tries the callers the call can belong to in the
 * given order, skipping the ones that have already been answered. `fallbackToLatest` then settles
 * the most recently started call: only a cancel that names no call may do that, and it is the only
 * way to reach a call that ended without a response (e.g. a device error the user closed, whose
 * stored call is gone by then). A cancel that names a call must never settle a different one,
 * which may be a freshly started call that keeps running.
 */
export const resolveCancelledPopupCall = (
    responseIds: (string | undefined)[],
    { fallbackToLatest }: ResolveCancelledPopupCallOptions,
    response: PopupCallResponse,
) => {
    const deferred = responseIds
        .map(responseId => (responseId ? popupCallDeferreds.get(responseId) : undefined))
        .find(candidate => candidate !== undefined);

    (deferred ?? (fallbackToLatest ? latestPopupCall : undefined))?.resolve(response);
};

// Popup calls that have started, keyed by the callId a cancel names. A call is registered before
// its `__info` round-trip, i.e. before it reaches Redux as the active call, so that a cancel can
// reach it during that window — the stored call is then still the call before it, which lingers as
// `finished` until the modal teardown clears it.
type StartedPopupCall = { callId: string; responseId: string | undefined; aborted: boolean };

const startedPopupCalls = new Map<string, StartedPopupCall>();
// The call that started most recently, which a cancel without a callId falls back to.
let latestStartedPopupCall: StartedPopupCall | undefined;

export const registerStartedPopupCall = (callId: string, responseId: string | undefined) => {
    const startedCall: StartedPopupCall = { callId, responseId, aborted: false };
    startedPopupCalls.set(callId, startedCall);
    latestStartedPopupCall = startedCall;
};

export const unregisterStartedPopupCall = (callId: string) => {
    startedPopupCalls.delete(callId);
    if (latestStartedPopupCall?.callId === callId) latestStartedPopupCall = undefined;
};

/** The started call a cancel ends: the one it names, or the latest one when it names none. */
export const getCancelledStartedPopupCall = (callId: string | undefined) =>
    callId ? startedPopupCalls.get(callId) : latestStartedPopupCall;

/**
 * Marks a started call as cancelled. Core can only abort a call it already has a method for, so a
 * call that is still in its `__info` round-trip or waiting for the device is ended by this flag,
 * which its thunk checks before it asks the device.
 */
export const abortStartedPopupCall = (callId: string) => {
    const startedCall = startedPopupCalls.get(callId);
    if (startedCall) startedCall.aborted = true;
};

export const isStartedPopupCallAborted = (callId: string) =>
    !!startedPopupCalls.get(callId)?.aborted;

// Deferred for the permission request
const permissionDeferredWrapper = createDeferredWrapper('popup-permission');
export const getPermissionDeferred: GetDeferred<void> = permissionDeferredWrapper.getDeferred;
