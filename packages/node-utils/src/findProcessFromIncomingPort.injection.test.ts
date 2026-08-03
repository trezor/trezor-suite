import { EventEmitter } from 'events';

// These tests drive findProcessFromIncomingPort with a mocked child_process.spawn so we can feed
// crafted `lsof`/`netstat` output and assert the hardening: no shell is ever used, a malformed
// (non-numeric) pid never reaches a follow-up command, and out-of-range ports are rejected early.

const spawnMock = jest.fn();

jest.mock('child_process', () => ({
    spawn: (...args: unknown[]) => spawnMock(...args),
}));

import { findProcessFromIncomingPort } from './findProcessFromIncomingPort';

type FakeChild = EventEmitter & {
    stdout: EventEmitter;
    stderr: EventEmitter;
};

const makeChild = (): FakeChild => {
    const child = new EventEmitter() as FakeChild;
    child.stdout = new EventEmitter();
    child.stderr = new EventEmitter();

    return child;
};

// Queue stdout responses; each spawn call shifts one off and emits it, then closes with code 0.
const queueSpawnResponses = (responses: string[]) => {
    let index = 0;
    spawnMock.mockImplementation(() => {
        const child = makeChild();
        const response = responses[index] ?? '';
        index += 1;
        // Emit asynchronously so the caller has attached its listeners first.
        setImmediate(() => {
            child.stdout.emit('data', Buffer.from(response));
            child.emit('close', 0);
        });

        return child;
    });
};

const originalPlatform = process.platform;
const setPlatform = (platform: NodeJS.Platform) => {
    Object.defineProperty(process, 'platform', { value: platform });
};

describe('findProcessFromIncomingPort hardening', () => {
    beforeEach(() => {
        spawnMock.mockReset();
    });

    afterEach(() => {
        Object.defineProperty(process, 'platform', { value: originalPlatform });
    });

    it('never spawns with a shell (shell option must be false)', async () => {
        setPlatform('darwin');
        queueSpawnResponses([
            // lsof output: legit numeric pid
            'node 12345 user 5u IPC TCP 127.0.0.1:21325 (LISTEN)\n',
            // ps output
            '/usr/local/bin/node\n',
        ]);

        await findProcessFromIncomingPort(21325);

        expect(spawnMock).toHaveBeenCalled();
        for (const call of spawnMock.mock.calls) {
            // spawn(command, args, options)
            const options = call[2] as { shell?: boolean } | undefined;
            expect(Array.isArray(call[1])).toBe(true); // args are passed as an array, not a string
            expect(options?.shell).toBe(false);
        }
    });

    it('does not run the follow-up lookup command when the pid is not numeric (column shift via a malicious process name)', async () => {
        setPlatform('darwin');
        // A local process named `a $(touch /tmp/pwned) b` shifts the whitespace-split columns so
        // that parts[1] (used as the pid) becomes `$(touch`. This must be rejected, not executed.
        queueSpawnResponses([
            'a $(touch /tmp/pwned) b 12345 user 5u IPC TCP 127.0.0.1:21325 (LISTEN)\n',
            // If the guard failed, a second spawn (ps) would consume this:
            'SHOULD-NOT-BE-REACHED\n',
        ]);

        const result = await findProcessFromIncomingPort(21325);

        expect(result).toBeUndefined();
        // Only the initial lsof call is allowed; the ps lookup must never run with an injected pid.
        expect(spawnMock).toHaveBeenCalledTimes(1);
        expect(spawnMock.mock.calls[0]?.[0]).toBe('lsof');
    });

    it('rejects out-of-range ports before spawning anything', async () => {
        setPlatform('darwin');
        queueSpawnResponses(['\n']);

        await expect(findProcessFromIncomingPort(70000)).resolves.toBeUndefined();
        await expect(findProcessFromIncomingPort(-1)).resolves.toBeUndefined();
        await expect(findProcessFromIncomingPort(NaN)).resolves.toBeUndefined();
        expect(spawnMock).not.toHaveBeenCalled();
    });

    it('passes the pid to ps as a discrete argument for a well-formed line', async () => {
        setPlatform('darwin');
        queueSpawnResponses([
            'node 12345 user 5u IPC TCP 127.0.0.1:21325 (LISTEN)\n',
            '/usr/local/bin/node\n',
        ]);

        const result = await findProcessFromIncomingPort(21325);

        expect(result).toEqual({
            name: 'node',
            pid: '12345',
            fullPath: '/usr/local/bin/node',
            warning: true,
        });
        // Second call is the ps lookup with pid as its own argv entry (no shell interpolation).
        expect(spawnMock.mock.calls[1]?.[0]).toBe('ps');
        expect(spawnMock.mock.calls[1]?.[1]).toEqual(['-p', '12345', '-o', 'comm=']);
    });
});
