import { ChildProcess, spawn } from 'child_process';

import type { ILogger } from '../logger';
import { BaseProcess, type BaseProcessOptions, type Status } from './BaseProcess';

jest.mock('electron', () => ({
    app: { isPackaged: false },
}));

jest.mock('child_process', () => ({
    ...jest.requireActual('child_process'),
    spawn: jest.fn(),
}));

const TOPIC = 'process-test';
const MAX_SIGKILL_ATTEMPTS = 5;

class FakeChildProcess extends ChildProcess {
    override killed = false;
    override exitCode: number | null = null;
    override signalCode: NodeJS.Signals | null = null;
    override kill = jest.fn((_signal?: NodeJS.Signals | number) => {
        this.killed = true;

        return true;
    });

    exit() {
        this.exitCode = 0;
    }
}

const createLogger = (): ILogger => ({
    exit: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    log: jest.fn(),
    debug: jest.fn(),
    level: 'mute',
    config: {
        colors: false,
        writeToConsole: false,
        writeToDisk: false,
        outputFile: '',
        outputPath: '',
        logFormat: '',
        dedupeTimeout: 0,
        memoryCap: 0,
    },
    getLog: () => [],
});

class TestProcess extends BaseProcess {
    status = jest.fn((): Promise<Status> =>
        Promise.resolve({ service: false, process: !!this.process }),
    );

    constructor(options: BaseProcessOptions = {}, logger = createLogger()) {
        super({ resourceName: 'test', processName: 'test', options, logger });
    }

    attach(child: ChildProcess | null) {
        this.process = child;
    }

    hasProcess() {
        return this.process !== null;
    }
}

const fastForward = (seconds: number) => jest.advanceTimersByTimeAsync(seconds * 1000);

const watchPromiseSettled = (promise: Promise<void>) => {
    const state = { settled: false };
    promise.then(() => {
        state.settled = true;
    });

    return state;
};

describe('BaseProcess.stop', () => {
    beforeAll(() => {
        global.resourcesPath = '/tmp/resources';
    });

    beforeEach(() => {
        jest.useFakeTimers();
        jest.mocked(spawn).mockReset();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('when there is no process', () => {
        it('resolves immediately and warns that the process is already stopped', async () => {
            const logger = createLogger();
            const testProcess = new TestProcess({}, logger);

            await testProcess.stop();

            expect(logger.warn).toHaveBeenCalledWith(
                TOPIC,
                "Couldn't stop process (already stopped)",
            );
            expect(logger.info).not.toHaveBeenCalledWith(TOPIC, 'Stopping process');
        });

        it('does not schedule any timers', async () => {
            const testProcess = new TestProcess();

            await testProcess.stop();

            expect(jest.getTimerCount()).toBe(0);
        });
    });

    describe('when the process exits after SIGTERM', () => {
        it('sends SIGTERM (default kill signal) right away', () => {
            const testProcess = new TestProcess();
            const child = new FakeChildProcess();
            testProcess.attach(child);

            testProcess.stop();

            expect(child.kill).toHaveBeenCalledTimes(1);
            expect(child.kill).toHaveBeenCalledWith();
        });

        it('does not resolve before the first check', async () => {
            const testProcess = new TestProcess();
            const child = new FakeChildProcess();
            testProcess.attach(child);
            child.exit();

            const state = watchPromiseSettled(testProcess.stop());
            await fastForward(0.9);

            expect(state.settled).toBe(false);

            await fastForward(0.5);
            expect(state.settled).toBe(true);
        });

        it('resolves on the first check when exit code is set, and clears the process', async () => {
            const logger = createLogger();
            const testProcess = new TestProcess({}, logger);
            const child = new FakeChildProcess();
            testProcess.attach(child);
            child.exit();

            const stopPromise = testProcess.stop();
            await fastForward(1);
            await stopPromise;

            expect(logger.info).toHaveBeenCalledWith(TOPIC, 'Stopping process');
            expect(logger.info).toHaveBeenCalledWith(TOPIC, 'Killed successfully');
            expect(testProcess.hasProcess()).toBe(false);
            expect(jest.getTimerCount()).toBe(0);
        });

        it('resolves when the process was terminated by a signal (signalCode set)', async () => {
            const testProcess = new TestProcess();
            const child = new FakeChildProcess();
            child.signalCode = 'SIGTERM';
            testProcess.attach(child);

            const stopPromise = testProcess.stop();
            await fastForward(1);
            await stopPromise;

            expect(testProcess.hasProcess()).toBe(false);
            expect(child.kill).toHaveBeenCalledTimes(1);
        });

        it.skip('resolves after several checks when the process exits later', async () => {
            const testProcess = new TestProcess({ stopKillWait: 10 });
            const child = new FakeChildProcess();
            testProcess.attach(child);

            const state = watchPromiseSettled(testProcess.stop());
            await fastForward(3);
            expect(state.settled).toBe(false);

            child.exit();
            await fastForward(1);

            expect(state.settled).toBe(true);
            expect(testProcess.hasProcess()).toBe(false);
            expect(child.kill).toHaveBeenCalledTimes(1);
        });

        it.skip('resolves when the process reference is cleared in the meantime (e.g. on close event)', async () => {
            const logger = createLogger();
            const testProcess = new TestProcess({ stopKillWait: 10 }, logger);
            const child = new FakeChildProcess();
            testProcess.attach(child);

            const state = watchPromiseSettled(testProcess.stop());
            await fastForward(2);
            expect(state.settled).toBe(false);

            testProcess.attach(null);
            await fastForward(1);

            expect(state.settled).toBe(true);
            expect(logger.info).toHaveBeenCalledWith(TOPIC, 'Killed successfully');
            expect(child.kill).toHaveBeenCalledTimes(1);
        });
    });

    describe.skip('when the process is slow to exit', () => {
        it('does not treat `killed` flag alone as exited', async () => {
            const testProcess = new TestProcess({ stopKillWait: 10 });
            const child = new FakeChildProcess();
            testProcess.attach(child);

            const state = watchPromiseSettled(testProcess.stop());
            await fastForward(5);

            expect(child.killed).toBe(true);
            expect(state.settled).toBe(false);
            expect(testProcess.hasProcess()).toBe(true);
        });

        it('keeps polling for `stopKillWait` seconds without sending SIGKILL', async () => {
            const logger = createLogger();
            const testProcess = new TestProcess({ stopKillWait: 3 }, logger);
            const child = new FakeChildProcess();
            testProcess.attach(child);

            testProcess.stop();
            await fastForward(3);

            expect(logger.info).toHaveBeenCalledTimes(1 + 3); // 'Stopping process' + 3x 'Still alive, checking again...'
            expect(logger.info).toHaveBeenCalledWith(TOPIC, 'Still alive, checking again...');
            expect(child.kill).toHaveBeenCalledTimes(1);
            expect(child.kill).not.toHaveBeenCalledWith('SIGKILL');
        });

        it('escalates to SIGKILL once `stopKillWait` seconds elapsed', async () => {
            const logger = createLogger();
            const testProcess = new TestProcess({ stopKillWait: 3 }, logger);
            const child = new FakeChildProcess();
            testProcess.attach(child);

            testProcess.stop();
            await fastForward(4);

            expect(logger.info).toHaveBeenCalledWith(TOPIC, 'Still alive, going for the SIGKILL');
            expect(child.kill).toHaveBeenCalledTimes(2);
            expect(child.kill).toHaveBeenLastCalledWith('SIGKILL');
        });

        it('resolves when the process exits after SIGKILL', async () => {
            const logger = createLogger();
            const testProcess = new TestProcess({ stopKillWait: 1 }, logger);
            const child = new FakeChildProcess();
            testProcess.attach(child);

            const state = watchPromiseSettled(testProcess.stop());
            await fastForward(3);
            expect(child.kill).toHaveBeenCalledWith('SIGKILL');
            expect(state.settled).toBe(false);

            child.exit();
            await fastForward(1);

            expect(state.settled).toBe(true);
            expect(logger.info).toHaveBeenCalledWith(TOPIC, 'Killed successfully');
            expect(logger.error).not.toHaveBeenCalled();
            expect(testProcess.hasProcess()).toBe(false);
        });

        it('sends SIGKILL on every check until the process exits', async () => {
            const testProcess = new TestProcess({ stopKillWait: 1 });
            const child = new FakeChildProcess();
            testProcess.attach(child);

            testProcess.stop();
            await fastForward(1 + 3); // 1 wait tick, then 3 SIGKILL attempts

            const sigkillCalls = child.kill.mock.calls.filter(([signal]) => signal === 'SIGKILL');
            expect(sigkillCalls).toHaveLength(3);
        });

        it('skips the polling wait and goes straight to SIGKILL when `stopKillWait` is 0', async () => {
            const testProcess = new TestProcess({ stopKillWait: 0 });
            const child = new FakeChildProcess();
            testProcess.attach(child);

            testProcess.stop();
            await fastForward(1);

            expect(child.kill).toHaveBeenCalledTimes(2);
            expect(child.kill).toHaveBeenLastCalledWith('SIGKILL');
        });
    });

    describe('when the process never exits', () => {
        it.skip('gives up after the maximum number of SIGKILL attempts, logs an error and resolves', async () => {
            const logger = createLogger();
            const testProcess = new TestProcess({ stopKillWait: 2 }, logger);
            const child = new FakeChildProcess();
            testProcess.attach(child);

            const state = watchPromiseSettled(testProcess.stop());
            await fastForward(2 + MAX_SIGKILL_ATTEMPTS); // wait ticks + SIGKILL attempts
            expect(state.settled).toBe(false);

            await fastForward(1);

            expect(state.settled).toBe(true);
            expect(logger.error).toHaveBeenCalledWith(
                TOPIC,
                'Process did not exit after SIGKILL, giving up...',
            );
            expect(logger.info).not.toHaveBeenCalledWith(TOPIC, 'Killed successfully');
            expect(testProcess.hasProcess()).toBe(false);
        });

        it.skip('sends exactly one SIGTERM and the maximum number of SIGKILLs', async () => {
            const testProcess = new TestProcess({ stopKillWait: 2 });
            const child = new FakeChildProcess();
            testProcess.attach(child);

            const stopPromise = testProcess.stop();
            await fastForward(2 + MAX_SIGKILL_ATTEMPTS + 1);
            await stopPromise;

            expect(child.kill).toHaveBeenCalledTimes(1 + MAX_SIGKILL_ATTEMPTS);
            expect(child.kill.mock.calls.filter(([signal]) => signal === 'SIGKILL')).toHaveLength(
                MAX_SIGKILL_ATTEMPTS,
            );
        });

        it('stops polling after giving up', async () => {
            const testProcess = new TestProcess({ stopKillWait: 1 });
            const child = new FakeChildProcess();
            testProcess.attach(child);

            const stopPromise = testProcess.stop();
            await fastForward(1 + 1 + MAX_SIGKILL_ATTEMPTS + 1);
            await stopPromise;

            expect(jest.getTimerCount()).toBe(0);
        });
    });

    describe('auto restart', () => {
        const startWithFakeChild = async (options: BaseProcessOptions) => {
            const testProcess = new TestProcess(options);
            const child = new FakeChildProcess();
            jest.mocked(spawn).mockReturnValue(child);

            await testProcess.start();

            return { testProcess, child };
        };

        it('does not restart the process that exited because of stop()', async () => {
            const { testProcess, child } = await startWithFakeChild({
                autoRestart: 2,
                stopKillWait: 10,
            });
            expect(spawn).toHaveBeenCalledTimes(1);

            const stopPromise = testProcess.stop();
            child.exit();
            child.emit('close', 0);
            await fastForward(1);
            await stopPromise;
            await fastForward(10);

            expect(spawn).toHaveBeenCalledTimes(1);
            expect(testProcess.hasProcess()).toBe(false);
        });

        it('restarts the process that exited on its own (control case)', async () => {
            const { child } = await startWithFakeChild({ autoRestart: 2 });
            expect(spawn).toHaveBeenCalledTimes(1);

            child.emit('close', 1);
            await fastForward(2);

            expect(spawn).toHaveBeenCalledTimes(2);
        });

        it('can be started again after stop()', async () => {
            const { testProcess, child } = await startWithFakeChild({
                autoRestart: 2,
                stopKillWait: 10,
            });

            const stopPromise = testProcess.stop();
            child.exit();
            child.emit('close', 0);
            await fastForward(1);
            await stopPromise;

            jest.mocked(spawn).mockReturnValue(new FakeChildProcess());
            await testProcess.start();

            expect(spawn).toHaveBeenCalledTimes(2);
            expect(testProcess.hasProcess()).toBe(true);
        });
    });

    describe('concurrent calls', () => {
        it.skip('resolves every pending stop() once the process exits', async () => {
            const testProcess = new TestProcess({ stopKillWait: 10 });
            const child = new FakeChildProcess();
            testProcess.attach(child);

            const first = watchPromiseSettled(testProcess.stop());
            const second = watchPromiseSettled(testProcess.stop());
            await fastForward(2);
            expect(first.settled).toBe(false);
            expect(second.settled).toBe(false);

            child.exit();
            await fastForward(1);

            expect(first.settled).toBe(true);
            expect(second.settled).toBe(true);
            expect(testProcess.hasProcess()).toBe(false);
        });
    });
});
