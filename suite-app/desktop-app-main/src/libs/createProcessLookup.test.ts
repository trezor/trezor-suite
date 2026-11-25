import { createMockDeps } from '@trezor/dependency-injection';
import type { ProcessInfo } from '@trezor/node-utils';
import { createDeferred } from '@trezor/utils';

import {
    type ProcessLookupDeps,
    type ProcessLookupParams,
    createProcessLookup,
} from './createProcessLookup';

const appProcess: ProcessInfo = { name: 'app', pid: '1', fullPath: '/app' };

const params: ProcessLookupParams = {
    port: 40000,
    connection: {
        remoteAddress: '127.0.0.1',
        remotePort: 40000,
        localAddress: '127.0.0.1',
        localPort: 21335,
    },
    shouldFilterSelf: true,
    timeoutMs: 10_000,
    retryIntervalMs: 5_000,
};

// A lookup starts a microtask after `lookUp` is called, so a test waits for it before it settles it.
const flushPendingPromises = () => new Promise(resolve => setImmediate(resolve));

// Every lookup stays running until the test settles it.
const createDeps = () => {
    const lookups: {
        signal?: AbortSignal;
        settle: (foundProcess: ProcessInfo | undefined) => void;
        fail: (error: Error) => void;
    }[] = [];
    const deps = createMockDeps<ProcessLookupDeps>({
        findProcessFromIncomingPort: (_port, _shouldFilterSelf, _connection, signal) => {
            const lookup = createDeferred<ProcessInfo | undefined>();
            lookups.push({ signal, settle: lookup.resolve, fail: lookup.reject });

            return lookup.promise;
        },
        logger: { error: () => {} },
    });

    return { deps, lookups };
};

describe(createProcessLookup.name, () => {
    beforeEach(() => {
        jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate', 'queueMicrotask'] });
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('looks the process up with what the connection says about itself', async () => {
        const { deps, lookups } = createDeps();
        const result = createProcessLookup(deps)(params).lookUp();
        await flushPendingPromises();
        lookups[0]?.settle(appProcess);

        await expect(result).resolves.toEqual(appProcess);
        expect(deps.findProcessFromIncomingPort).toHaveBeenCalledWith(
            params.port,
            true,
            params.connection,
            expect.any(AbortSignal),
        );
    });

    it('shares one lookup between the calls that arrive while it runs', async () => {
        const { deps, lookups } = createDeps();
        const { lookUp } = createProcessLookup(deps)(params);

        const results = [lookUp(), lookUp(), lookUp()];
        await flushPendingPromises();

        expect(deps.findProcessFromIncomingPort).toHaveBeenCalledTimes(1);

        lookups[0]?.settle(appProcess);

        await expect(Promise.all(results)).resolves.toEqual([appProcess, appProcess, appProcess]);
    });

    it('keeps the process it found for as long as the connection lasts', async () => {
        const { deps, lookups } = createDeps();
        const { lookUp } = createProcessLookup(deps)(params);
        const first = lookUp();
        await flushPendingPromises();
        lookups[0]?.settle(appProcess);
        await first;

        await jest.advanceTimersByTimeAsync(params.retryIntervalMs * 10);

        await expect(lookUp()).resolves.toEqual(appProcess);
        expect(deps.findProcessFromIncomingPort).toHaveBeenCalledTimes(1);
    });

    it('does not look again before the retry interval after a lookup that found nothing, and does after it', async () => {
        const { deps, lookups } = createDeps();
        const { lookUp } = createProcessLookup(deps)(params);
        const first = lookUp();
        await flushPendingPromises();
        lookups[0]?.settle(undefined);
        await first;

        await expect(lookUp()).resolves.toBeUndefined();
        await jest.advanceTimersByTimeAsync(params.retryIntervalMs - 1);
        await expect(lookUp()).resolves.toBeUndefined();

        expect(deps.findProcessFromIncomingPort).toHaveBeenCalledTimes(1);
        // A lookup that found nothing is an answer, not a failure.
        expect(deps.logger.error).not.toHaveBeenCalled();

        await jest.advanceTimersByTimeAsync(1);
        const retry = lookUp();
        await flushPendingPromises();
        lookups[1]?.settle(appProcess);

        await expect(retry).resolves.toEqual(appProcess);
        expect(deps.findProcessFromIncomingPort).toHaveBeenCalledTimes(2);
    });

    it('reports a failed lookup and looks again at the next call, without waiting for the retry interval', async () => {
        const { deps, lookups } = createDeps();
        const { lookUp } = createProcessLookup(deps)(params);
        const result = lookUp();
        await flushPendingPromises();
        lookups[0]?.fail(new Error('lsof failed'));

        await expect(result).resolves.toBeUndefined();
        expect(deps.logger.error).toHaveBeenCalledWith(
            'process-lookup',
            'findProcessFromIncomingPort failed: Error: lsof failed',
        );

        // It learned nothing, so there is nothing to wait out.
        const retry = lookUp();
        await flushPendingPromises();
        lookups[1]?.settle(appProcess);

        await expect(retry).resolves.toEqual(appProcess);
        expect(deps.findProcessFromIncomingPort).toHaveBeenCalledTimes(2);
    });

    it('gives every call that shared a failed lookup its outcome, and looks again for the next one', async () => {
        const { deps, lookups } = createDeps();
        const { lookUp } = createProcessLookup(deps)(params);
        const results = [lookUp(), lookUp(), lookUp()];
        await flushPendingPromises();

        expect(deps.findProcessFromIncomingPort).toHaveBeenCalledTimes(1);

        lookups[0]?.fail(new Error('lsof failed'));

        await expect(Promise.all(results)).resolves.toEqual([undefined, undefined, undefined]);
        // One lookup failed, so one failure is reported.
        expect(deps.logger.error).toHaveBeenCalledTimes(1);

        const next = lookUp();
        await flushPendingPromises();

        expect(deps.findProcessFromIncomingPort).toHaveBeenCalledTimes(2);

        lookups[1]?.settle(appProcess);
        await expect(next).resolves.toEqual(appProcess);
    });

    it('gives up at the deadline, killing the lookup and reporting the timeout', async () => {
        const { deps, lookups } = createDeps();
        const { lookUp } = createProcessLookup(deps)(params);
        const result = lookUp();
        await flushPendingPromises();

        await jest.advanceTimersByTimeAsync(params.timeoutMs);

        await expect(result).resolves.toBeUndefined();
        expect(lookups[0]?.signal?.aborted).toBe(true);
        expect(deps.logger.error).toHaveBeenCalledWith(
            'process-lookup',
            'findProcessFromIncomingPort timed out',
        );

        // A lookup that timed out learned nothing, so the next call looks again at once.
        const retry = lookUp();
        await flushPendingPromises();

        expect(deps.findProcessFromIncomingPort).toHaveBeenCalledTimes(2);

        lookups[1]?.settle(appProcess);
        await expect(retry).resolves.toEqual(appProcess);
    });

    it('does not report a timeout for a lookup that finished before the deadline', async () => {
        const { deps, lookups } = createDeps();
        const result = createProcessLookup(deps)(params).lookUp();
        await flushPendingPromises();
        lookups[0]?.settle(appProcess);
        await result;

        await jest.advanceTimersByTimeAsync(params.timeoutMs * 2);

        expect(deps.logger.error).not.toHaveBeenCalled();
    });

    it('stops the running lookup on abort without reporting an error', async () => {
        const { deps, lookups } = createDeps();
        const { lookUp, abort } = createProcessLookup(deps)(params);
        const result = lookUp();
        await flushPendingPromises();

        expect(lookups[0]?.signal?.aborted).toBe(false);

        abort();

        await expect(result).resolves.toBeUndefined();
        expect(lookups[0]?.signal?.aborted).toBe(true);
        expect(deps.logger.error).not.toHaveBeenCalled();
    });

    it('stops a lookup that is aborted at once, before it has started, and reports nothing', async () => {
        const { deps, lookups } = createDeps();
        const { lookUp, abort } = createProcessLookup(deps)(params);
        const result = lookUp();
        abort();

        await expect(result).resolves.toBeUndefined();
        await flushPendingPromises();

        expect(deps.logger.error).not.toHaveBeenCalled();
        // Whether it had started or not, nothing is left running.
        expect(lookups.every(started => started.signal?.aborted)).toBe(true);
    });

    it('starts no lookup once it was aborted, and has no process to give', async () => {
        const { deps, lookups } = createDeps();
        const { lookUp, abort } = createProcessLookup(deps)(params);
        abort();

        await expect(lookUp()).resolves.toBeUndefined();
        await flushPendingPromises();

        expect(deps.findProcessFromIncomingPort).not.toHaveBeenCalled();
        expect(lookups).toEqual([]);
    });

    it('starts no other lookup after the running one was aborted, which nobody would stop', async () => {
        const { deps } = createDeps();
        const { lookUp, abort } = createProcessLookup(deps)(params);
        const running = lookUp();
        await flushPendingPromises();
        abort();
        await running;

        await expect(lookUp()).resolves.toBeUndefined();
        await flushPendingPromises();

        expect(deps.findProcessFromIncomingPort).toHaveBeenCalledTimes(1);
    });

    it('gives no process after it was aborted, not even one that was found before', async () => {
        const { deps, lookups } = createDeps();
        const { lookUp, abort } = createProcessLookup(deps)(params);
        const first = lookUp();
        await flushPendingPromises();
        lookups[0]?.settle(appProcess);
        await expect(first).resolves.toEqual(appProcess);

        abort();

        await expect(lookUp()).resolves.toBeUndefined();
        expect(deps.findProcessFromIncomingPort).toHaveBeenCalledTimes(1);
    });

    it('has nothing to stop on abort before the first lookup', () => {
        const { deps } = createDeps();

        expect(() => createProcessLookup(deps)(params).abort()).not.toThrow();
    });

    it('keeps the lookups of two connections apart', async () => {
        const { deps, lookups } = createDeps();
        const processLookup = createProcessLookup(deps);

        const first = processLookup(params).lookUp();
        const second = processLookup({ ...params, port: 40001 }).lookUp();
        await flushPendingPromises();

        expect(deps.findProcessFromIncomingPort).toHaveBeenCalledTimes(2);

        lookups[0]?.settle(appProcess);
        lookups[1]?.settle(undefined);

        await expect(first).resolves.toEqual(appProcess);
        await expect(second).resolves.toBeUndefined();
    });
});
