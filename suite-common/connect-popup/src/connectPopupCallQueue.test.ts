import {
    type PopupCallResponse,
    answerPopupCall,
    dropPendingPopupCalls,
    enqueuePopupCall,
    getPendingPopupCall,
} from './connectPopupCallQueue';

const answer = (message: string): PopupCallResponse => ({ success: true, payload: { message } });

// Lets the queue start the next call, which it does a microtask after an answer.
const flushMicrotasks = () => Promise.resolve();

describe('connectPopupCallQueue', () => {
    it('starts the first call right away', async () => {
        const start = jest.fn();

        const call = enqueuePopupCall(start);

        expect(start).toHaveBeenCalledWith(call.id);
        expect(getPendingPopupCall(call.id)?.hasStarted).toBe(true);

        answerPopupCall(call.id, answer('done'));
        await flushMicrotasks();
    });

    it('starts the calls one at a time, in the order they were requested', async () => {
        const started: string[] = [];
        const start = (callId: string) => started.push(callId);

        const first = enqueuePopupCall(start);
        const second = enqueuePopupCall(start);
        const third = enqueuePopupCall(start);
        expect(started).toEqual([first.id]);

        answerPopupCall(first.id, answer('first'));
        await flushMicrotasks();
        expect(started).toEqual([first.id, second.id]);

        answerPopupCall(second.id, answer('second'));
        await flushMicrotasks();
        expect(started).toEqual([first.id, second.id, third.id]);

        answerPopupCall(third.id, answer('third'));
        await flushMicrotasks();
    });

    it('answers each caller with the response of its own call', async () => {
        const first = enqueuePopupCall(jest.fn());
        const second = enqueuePopupCall(jest.fn());

        // The second call is answered first, e.g. because its caller has cancelled it.
        answerPopupCall(second.id, answer('second'));
        answerPopupCall(first.id, answer('first'));

        await expect(first.response).resolves.toEqual(answer('first'));
        await expect(second.response).resolves.toEqual(answer('second'));
    });

    it('does not start a call answered while it waited', async () => {
        const startSecond = jest.fn();
        const startThird = jest.fn();
        const first = enqueuePopupCall(jest.fn());
        const second = enqueuePopupCall(startSecond);
        const third = enqueuePopupCall(startThird);

        answerPopupCall(second.id, answer('cancelled'));
        await flushMicrotasks();
        expect(startThird).not.toHaveBeenCalled();

        answerPopupCall(first.id, answer('first'));
        await flushMicrotasks();
        expect(startSecond).not.toHaveBeenCalled();
        expect(startThird).toHaveBeenCalledTimes(1);

        answerPopupCall(third.id, answer('third'));
        await flushMicrotasks();
    });

    it('ignores the second answer of a call, which must not reach the next caller', async () => {
        const first = enqueuePopupCall(jest.fn());
        const second = enqueuePopupCall(jest.fn());

        answerPopupCall(first.id, answer('interrupted'));
        // The late result of the cancelled call.
        answerPopupCall(first.id, answer('late'));
        await flushMicrotasks();

        await expect(first.response).resolves.toEqual(answer('interrupted'));
        expect(getPendingPopupCall(second.id)?.hasStarted).toBe(true);

        answerPopupCall(second.id, answer('second'));
        await expect(second.response).resolves.toEqual(answer('second'));
    });

    it('starts the next call only after the answered one had its tick to clean up', async () => {
        const startSecond = jest.fn();
        const first = enqueuePopupCall(jest.fn());
        const second = enqueuePopupCall(startSecond);

        answerPopupCall(first.id, answer('first'));
        expect(startSecond).not.toHaveBeenCalled();

        await flushMicrotasks();
        expect(startSecond).toHaveBeenCalledTimes(1);

        answerPopupCall(second.id, answer('second'));
        await flushMicrotasks();
    });

    it('drops every call without an answer, so that a call requested after starts at once', async () => {
        const startWaiting = jest.fn();
        const startNext = jest.fn();
        const running = enqueuePopupCall(jest.fn());
        const waiting = enqueuePopupCall(startWaiting);

        const droppedCalls = dropPendingPopupCalls();
        const next = enqueuePopupCall(startNext);
        await flushMicrotasks();

        expect(droppedCalls.map(({ id, hasStarted }) => ({ id, hasStarted }))).toEqual([
            { id: running.id, hasStarted: true },
            { id: waiting.id, hasStarted: false },
        ]);
        expect(startWaiting).not.toHaveBeenCalled();
        expect(startNext).toHaveBeenCalledTimes(1);
        expect(getPendingPopupCall(running.id)).toBeUndefined();

        answerPopupCall(next.id, answer('next'));
        await flushMicrotasks();
    });

    it('forgets an answered call', async () => {
        const call = enqueuePopupCall(jest.fn());

        answerPopupCall(call.id, answer('done'));
        await flushMicrotasks();

        expect(getPendingPopupCall(call.id)).toBeUndefined();
        expect(getPendingPopupCall(undefined)).toBeUndefined();
    });
});
