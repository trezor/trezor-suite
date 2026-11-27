import { type CallMethodAnyResponse } from '@trezor/connect';
import { type Deferred, createDeferred } from '@trezor/utils';

export type PopupCallResponse = Awaited<CallMethodAnyResponse>;

type QueuedPopupCall = {
    id: string;
    response: Deferred<PopupCallResponse>;
    abortController: AbortController;
    hasStarted: boolean;
    start: () => void;
};

export type PendingPopupCall = Pick<QueuedPopupCall, 'id' | 'abortController' | 'hasStarted'>;

// The popup shows one call at a time and the consent of the user belongs to the call it shows. So
// the calls of every source wait here in the order they were requested, and only the first one
// runs. A call leaves the queue when its caller is answered.
const popupCalls = new Map<string, QueuedPopupCall>();

const startNextPopupCall = () => {
    const [nextCall] = popupCalls.values();
    if (!nextCall || nextCall.hasStarted) return;

    nextCall.hasStarted = true;
    nextCall.start();
};

/**
 * Adds a call to the queue. `start` runs it, with the id of the call, once every call requested
 * before it is answered.
 */
export const enqueuePopupCall = (start: (callId: string) => void) => {
    // Made here, never taken from the caller, so that no caller can name the call of another one.
    const id = crypto.randomUUID();
    const response = createDeferred<PopupCallResponse>();
    popupCalls.set(id, {
        id,
        response,
        abortController: new AbortController(),
        hasStarted: false,
        start: () => start(id),
    });
    startNextPopupCall();

    return { id, response: response.promise };
};

/** Returns a call which is not answered yet. */
export const getPendingPopupCall = (callId: string | undefined): PendingPopupCall | undefined =>
    callId === undefined ? undefined : popupCalls.get(callId);

/**
 * Empties the queue and returns the calls it held, the running one first. Their callers are not
 * answered.
 */
export const dropPendingPopupCalls = (): PendingPopupCall[] => {
    const droppedCalls = [...popupCalls.values()];
    popupCalls.clear();

    return droppedCalls;
};

/**
 * Answers the caller of a call and lets the next call start. Does nothing for a call which is
 * already answered, so a call answers only its own caller, and only once.
 */
export const answerPopupCall = (callId: string | undefined, response: PopupCallResponse) => {
    const call = callId === undefined ? undefined : popupCalls.get(callId);
    if (!call) return;

    popupCalls.delete(call.id);
    call.response.resolve(response);
    // Not in this tick, the answered call has yet to clean up after itself.
    queueMicrotask(startNextPopupCall);
};
