import { Socket } from 'net';

import { POPUP, type PermissionRequest } from '@trezor/connect';
import { createMockDeps } from '@trezor/dependency-injection';
import type { ProcessInfo } from '@trezor/node-utils';
import { createDeferred } from '@trezor/utils';

import {
    type ConnectionSessionDeps,
    type ConnectionSessionParams,
    HANDSHAKE_BURST,
    HANDSHAKE_REFILL_INTERVAL_MS,
    HANDSHAKE_TIMEOUT_MS,
    type HandshakeMessage,
    IDLE_CONNECTION_TIMEOUT_MS,
    PROCESS_LOOKUP_RETRY_INTERVAL_MS,
    PROCESS_LOOKUP_TIMEOUT_MS,
    createConnectionSession,
} from './createConnectionSession';

const appProcess: ProcessInfo = { name: 'app', pid: '1', fullPath: '/app' };

const createMessage = (
    id: string,
    settings: Partial<HandshakeMessage['payload']['settings']> = {},
): HandshakeMessage => ({
    id,
    type: POPUP.HANDSHAKE,
    payload: {
        settings: {
            manifest: { appName: 'App', appUrl: 'https://app.test', email: 'dev@app.test' },
            version: '10.0.0',
            ...settings,
        },
    },
});

// A lookup finds the app at once, unless the test holds it and settles it itself.
const createDeps = ({ isLookupHeld = false } = {}) => {
    const heldLookups: { settle: (foundProcess: ProcessInfo | undefined) => void }[] = [];
    const lookUp = jest.fn(() => {
        if (!isLookupHeld) {
            return Promise.resolve<ProcessInfo | undefined>(appProcess);
        }
        const lookup = createDeferred<ProcessInfo | undefined>();
        heldLookups.push({ settle: lookup.resolve });

        return lookup.promise;
    });
    const abort = jest.fn();
    const deps = createMockDeps<ConnectionSessionDeps>({
        logger: { info: () => {}, warn: () => {} },
        processLookup: () => ({ lookUp, abort }),
    });

    return { deps, heldLookups, lookUp, abort };
};

// What the handshake asked of its connection, in the order it asked, and what the connection is
// like, which a test can change.
const createParams = () => {
    const events: string[] = [];
    const connectionState = { hasPendingCalls: false };
    // A socket that was never connected, which is all the handshake needs of it: it is asked to
    // destroy it, and whether it is destroyed already.
    const connection = new Socket();
    jest.spyOn(connection, 'destroy').mockImplementation(() => {
        events.push('destroy');

        return connection;
    });
    const params: ConnectionSessionParams = {
        ip: '127.0.0.1',
        port: 40000,
        originKey: 'https://app.test',
        connection,
        sendHandshakeAck: id => events.push(`acknowledge ${id}`),
        closeConnection: () => events.push('close'),
        hasPendingCalls: () => connectionState.hasPendingCalls,
    };

    return { params, events, connection, connectionState };
};

describe(createConnectionSession.name, () => {
    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('acknowledges the handshake once the lookup is done', async () => {
        const { deps, heldLookups } = createDeps({ isLookupHeld: true });
        const { params, events } = createParams();
        const session = createConnectionSession(deps)(params);

        const handled = session.handleHandshake(createMessage('7'));
        await Promise.resolve();

        expect(events).toEqual([]);
        expect(session.isHandshakeDone()).toBe(false);

        heldLookups[0]?.settle(appProcess);
        await handled;

        expect(events).toEqual(['acknowledge 7']);
        expect(session.isHandshakeDone()).toBe(true);
    });

    it('keeps what the client said about itself and what was found of its process', async () => {
        const { deps } = createDeps();
        const { params } = createParams();
        const session = createConnectionSession(deps)(params);
        const requestedPermissions: PermissionRequest[] = [];

        expect(session.getContext()).toEqual({});

        await session.handleHandshake(createMessage('1', { requestedPermissions }));

        expect(session.getContext()).toMatchObject({
            manifest: { appName: 'App', appUrl: 'https://app.test', email: 'dev@app.test' },
            version: '10.0.0',
            processOnPort: appProcess,
        });
        expect(session.getContext().requestedPermissions).toBe(requestedPermissions);
    });

    it('keeps no process when the lookup found none, which is not a failed handshake', async () => {
        const { deps, lookUp } = createDeps();
        lookUp.mockResolvedValueOnce(undefined);
        const { params, events } = createParams();
        const session = createConnectionSession(deps)(params);

        await session.handleHandshake(createMessage('1'));

        expect(session.getContext().processOnPort).toBeUndefined();
        expect(events).toEqual(['acknowledge 1']);
    });

    it('closes the connection for a handshake without a valid manifest, with no lookup and no reply', async () => {
        const { deps, lookUp } = createDeps();
        const { params, events } = createParams();
        const session = createConnectionSession(deps)(params);

        await session.handleHandshake(createMessage('1', { manifest: undefined }));

        expect(events).toEqual(['destroy']);
        expect(lookUp).not.toHaveBeenCalled();
        expect(session.isHandshakeDone()).toBe(false);
        expect(deps.logger.warn).toHaveBeenCalledWith(
            'connect-ws',
            'connection closed: invalid handshake manifest from 127.0.0.1:40000 (origin: https://app.test)',
        );
    });

    it('sets the lookup up for the connection, once, with the policy of the handshake', async () => {
        const { deps } = createDeps();
        const { params } = createParams();
        const session = createConnectionSession(deps)(params);

        await session.handleHandshake(createMessage('1'));
        await session.handleHandshake(createMessage('2'));

        expect(deps.processLookup).toHaveBeenCalledTimes(1);
        expect(deps.processLookup).toHaveBeenCalledWith({
            port: 40000,
            connection: params.connection,
            shouldFilterSelf: !process.env.PLAYWRIGHT_RUN,
            timeoutMs: PROCESS_LOOKUP_TIMEOUT_MS,
            retryIntervalMs: PROCESS_LOOKUP_RETRY_INTERVAL_MS,
        });
    });

    it('goes with the latest handshake of a connection', async () => {
        const { deps } = createDeps();
        const { params } = createParams();
        const session = createConnectionSession(deps)(params);

        await session.handleHandshake(createMessage('1'));
        await session.handleHandshake(
            createMessage('2', {
                manifest: { appName: 'Second', appUrl: 'https://app.test', email: 'dev@app.test' },
                version: '10.1.0',
            }),
        );

        expect(session.getContext()).toMatchObject({
            manifest: { appName: 'Second' },
            version: '10.1.0',
            processOnPort: appProcess,
        });
    });

    it('keeps the connections apart', async () => {
        const { deps } = createDeps();
        const service = createConnectionSession(deps);
        const first = service(createParams().params);
        const second = service(createParams().params);

        await first.handleHandshake(createMessage('1'));

        expect(first.isHandshakeDone()).toBe(true);
        expect(second.isHandshakeDone()).toBe(false);
        expect(deps.processLookup).toHaveBeenCalledTimes(2);
    });

    describe('idle timeout', () => {
        it('closes the connection once the idle timeout has passed, and says so in the log', async () => {
            const { deps } = createDeps();
            const { params, events } = createParams();
            const session = createConnectionSession(deps)(params);
            await session.handleHandshake(createMessage('1'));
            events.length = 0;

            await jest.advanceTimersByTimeAsync(IDLE_CONNECTION_TIMEOUT_MS - 1);

            expect(events).toEqual([]);

            await jest.advanceTimersByTimeAsync(1);

            expect(events).toEqual(['close']);
            expect(deps.logger.info).toHaveBeenCalledWith(
                'connect-ws',
                'connection closed: idle timeout from 127.0.0.1:40000',
            );
        });

        it('starts the wait over when it is started again', async () => {
            const { deps } = createDeps();
            const { params, events } = createParams();
            const session = createConnectionSession(deps)(params);
            // A handshake starts the idle timeout, and ends the deadline that would be noise here.
            await session.handleHandshake(createMessage('1'));
            events.length = 0;

            await jest.advanceTimersByTimeAsync(IDLE_CONNECTION_TIMEOUT_MS * 0.6);
            session.startIdleTimeout();
            await jest.advanceTimersByTimeAsync(IDLE_CONNECTION_TIMEOUT_MS * 0.6);

            expect(events).toEqual([]);

            await jest.advanceTimersByTimeAsync(IDLE_CONNECTION_TIMEOUT_MS * 0.4);

            expect(events).toEqual(['close']);
        });

        it('stops when cleared, which a call that waits for the user needs', async () => {
            const { deps } = createDeps();
            const { params, events } = createParams();
            const session = createConnectionSession(deps)(params);
            await session.handleHandshake(createMessage('1'));
            events.length = 0;

            session.clearIdleTimeout();
            await jest.advanceTimersByTimeAsync(IDLE_CONNECTION_TIMEOUT_MS * 2);

            expect(events).toEqual([]);
        });

        it('does not start for a connection that is destroyed already', async () => {
            const { deps } = createDeps();
            const { params, events, connection } = createParams();
            const session = createConnectionSession(deps)(params);
            Object.defineProperty(connection, 'destroyed', { value: true });
            await session.handleHandshake(createMessage('1'));
            events.length = 0;

            session.startIdleTimeout();
            await jest.advanceTimersByTimeAsync(IDLE_CONNECTION_TIMEOUT_MS * 2);

            expect(events).toEqual([]);
        });

        it('is paused while a handshake waits for its lookup, and starts again once it is acknowledged', async () => {
            const { deps, heldLookups } = createDeps({ isLookupHeld: true });
            const { params, events } = createParams();
            const session = createConnectionSession(deps)(params);
            const first = session.handleHandshake(createMessage('1'));
            heldLookups[0]?.settle(appProcess);
            await first;

            // The client handshakes again just before the connection would have expired.
            await jest.advanceTimersByTimeAsync(IDLE_CONNECTION_TIMEOUT_MS - 5_000);
            const second = session.handleHandshake(createMessage('2'));
            await jest.advanceTimersByTimeAsync(10_000);

            expect(events).toEqual(['acknowledge 1']);

            heldLookups[1]?.settle(appProcess);
            await second;

            expect(events).toEqual(['acknowledge 1', 'acknowledge 2']);

            await jest.advanceTimersByTimeAsync(IDLE_CONNECTION_TIMEOUT_MS);

            expect(events).toEqual(['acknowledge 1', 'acknowledge 2', 'close']);
        });

        it('is not started again by a handshake while a call is pending', async () => {
            const { deps } = createDeps();
            const { params, events, connectionState } = createParams();
            const session = createConnectionSession(deps)(params);
            connectionState.hasPendingCalls = true;

            await session.handleHandshake(createMessage('1'));
            await jest.advanceTimersByTimeAsync(IDLE_CONNECTION_TIMEOUT_MS * 2);

            expect(events).toEqual(['acknowledge 1']);
        });

        it('is left running by a handshake with no valid manifest, so such a handshake cannot postpone the expiry', async () => {
            const { deps } = createDeps();
            const { params, events } = createParams();
            const session = createConnectionSession(deps)(params);
            await session.handleHandshake(createMessage('1'));
            events.length = 0;

            await jest.advanceTimersByTimeAsync(IDLE_CONNECTION_TIMEOUT_MS - 1_000);
            await session.handleHandshake(createMessage('2', { manifest: undefined }));
            await jest.advanceTimersByTimeAsync(1_000);

            expect(events).toEqual(['destroy', 'close']);
        });

        it('is left running by a handshake over the budget', async () => {
            const { deps } = createDeps();
            const { params, events } = createParams();
            const session = createConnectionSession(deps)(params);
            for (let i = 0; i < HANDSHAKE_BURST; i++) {
                await session.handleHandshake(createMessage(`${i}`));
            }
            events.length = 0;

            // Right after the burst, while the budget is still empty.
            await session.handleHandshake(createMessage('over'));
            await jest.advanceTimersByTimeAsync(IDLE_CONNECTION_TIMEOUT_MS);

            expect(events).toEqual(['close']);
        });
    });

    describe('budget', () => {
        it('serves a burst up to the budget, and drops the rest with no reply and no lookup', async () => {
            const { deps, lookUp } = createDeps();
            const { params, events } = createParams();
            const session = createConnectionSession(deps)(params);

            for (let i = 0; i < HANDSHAKE_BURST; i++) {
                await session.handleHandshake(createMessage(`${i}`));
            }
            const eventsOfBurst = events.length;
            for (let i = 0; i < 5; i++) {
                await session.handleHandshake(createMessage(`over ${i}`));
            }

            expect(events).toHaveLength(eventsOfBurst);
            expect(lookUp).toHaveBeenCalledTimes(HANDSHAKE_BURST);
        });

        it('warns once about the connection, not for every handshake it drops', async () => {
            const { deps } = createDeps();
            const { params } = createParams();
            const session = createConnectionSession(deps)(params);

            for (let i = 0; i < HANDSHAKE_BURST + 10; i++) {
                await session.handleHandshake(createMessage(`${i}`));
            }

            expect(deps.logger.warn).toHaveBeenCalledTimes(1);
            expect(deps.logger.warn).toHaveBeenCalledWith(
                'connect-ws',
                'handshake rate limit exceeded by 127.0.0.1:40000 (origin: https://app.test)',
            );
        });

        // Takes `count` handshakes, as many of them as the budget allows, and tells how many that was.
        const countServed = async (
            session: ReturnType<ReturnType<typeof createConnectionSession>>,
            events: string[],
            count: number,
        ) => {
            events.length = 0;
            for (let i = 0; i < count; i++) {
                await session.handleHandshake(createMessage(`${i}`));
            }

            return events.filter(event => event.startsWith('acknowledge')).length;
        };

        it('earns the budget back one handshake per refill interval, and no faster', async () => {
            const { deps } = createDeps();
            const { params, events } = createParams();
            const session = createConnectionSession(deps)(params);
            await countServed(session, events, HANDSHAKE_BURST);

            await jest.advanceTimersByTimeAsync(HANDSHAKE_REFILL_INTERVAL_MS * 3);

            // Not 20 more, as a count per fixed window would allow after its boundary.
            expect(await countServed(session, events, 10)).toBe(3);
        });

        it('earns the budget back a part of an interval at a time', async () => {
            const { deps } = createDeps();
            const { params, events } = createParams();
            const session = createConnectionSession(deps)(params);
            await countServed(session, events, HANDSHAKE_BURST);

            await jest.advanceTimersByTimeAsync(HANDSHAKE_REFILL_INTERVAL_MS / 2);

            expect(await countServed(session, events, 1)).toBe(0);

            await jest.advanceTimersByTimeAsync(HANDSHAKE_REFILL_INTERVAL_MS / 2);

            expect(await countServed(session, events, 3)).toBe(1);
        });

        it('never holds more than the burst, however long the connection was left alone', async () => {
            const { deps } = createDeps();
            const { params, events } = createParams();
            const session = createConnectionSession(deps)(params);
            await countServed(session, events, 3);

            await jest.advanceTimersByTimeAsync(1_000_000);

            expect(await countServed(session, events, HANDSHAKE_BURST + 5)).toBe(HANDSHAKE_BURST);
        });

        it('earns nothing while the clock steps back, and goes on from there', async () => {
            const { deps } = createDeps();
            const { params, events } = createParams();
            const session = createConnectionSession(deps)(params);
            await countServed(session, events, HANDSHAKE_BURST);

            jest.setSystemTime(Date.now() - 10_000);

            expect(await countServed(session, events, 1)).toBe(0);

            await jest.advanceTimersByTimeAsync(HANDSHAKE_REFILL_INTERVAL_MS);

            expect(await countServed(session, events, 3)).toBe(1);
        });
    });

    describe('deadline', () => {
        it('closes a connection that has not handshaken in time', async () => {
            const { deps } = createDeps();
            const { params, events } = createParams();
            createConnectionSession(deps)(params);

            await jest.advanceTimersByTimeAsync(HANDSHAKE_TIMEOUT_MS - 1);

            expect(events).toEqual([]);

            await jest.advanceTimersByTimeAsync(1);

            expect(events).toEqual(['destroy']);
            expect(deps.logger.warn).toHaveBeenCalledWith(
                'connect-ws',
                'connection closed: handshake timeout from 127.0.0.1:40000',
            );
        });

        it('leaves a connection that handshaken in time alone, with only the idle timeout pending', async () => {
            const { deps } = createDeps();
            const { params, events } = createParams();
            const session = createConnectionSession(deps)(params);
            await session.handleHandshake(createMessage('1'));

            // The deadline is done with, so it is the idle timeout alone that is left pending.
            expect(jest.getTimerCount()).toBe(1);

            await jest.advanceTimersByTimeAsync(HANDSHAKE_TIMEOUT_MS * 2);

            expect(events).not.toContain('destroy');
        });

        it('counts the lookup into the deadline, which runs until the handshake is acknowledged', async () => {
            const { deps, heldLookups } = createDeps({ isLookupHeld: true });
            const { params, events } = createParams();
            const session = createConnectionSession(deps)(params);
            const handled = session.handleHandshake(createMessage('1'));

            await jest.advanceTimersByTimeAsync(HANDSHAKE_TIMEOUT_MS);

            expect(events).toEqual(['destroy']);

            heldLookups[0]?.settle(appProcess);
            await handled;
        });
    });

    describe('dispose', () => {
        it('stops the lookup that may still run', () => {
            const { deps, abort } = createDeps();
            const { params } = createParams();
            const session = createConnectionSession(deps)(params);

            session.dispose();

            expect(abort).toHaveBeenCalledTimes(1);
        });

        it('stops the deadline and the idle timeout, so a connection that is gone is not closed again', async () => {
            const { deps } = createDeps();
            const { params, events } = createParams();
            const session = createConnectionSession(deps)(params);
            session.startIdleTimeout();

            session.dispose();
            await jest.advanceTimersByTimeAsync(IDLE_CONNECTION_TIMEOUT_MS * 2);

            expect(events).toEqual([]);
            expect(jest.getTimerCount()).toBe(0);
        });
    });
});
