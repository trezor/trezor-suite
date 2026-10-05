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

/**
 * Settles the active call while it is still pending, otherwise the most recently started call. A
 * cancel uses it to reach a call that has not become the active one yet, or one that ended without
 * a response (e.g. a device error the user closed).
 */
export const resolveActiveOrLatestPopupCall = (
    activeResponseId: string | undefined,
    response: PopupCallResponse,
) => {
    const activeDeferred = activeResponseId ? popupCallDeferreds.get(activeResponseId) : undefined;
    (activeDeferred ?? latestPopupCall)?.resolve(response);
};

// Deferred for the permission request
const permissionDeferredWrapper = createDeferredWrapper('popup-permission');
export const getPermissionDeferred: GetDeferred<void> = permissionDeferredWrapper.getDeferred;
