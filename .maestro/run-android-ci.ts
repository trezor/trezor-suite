import { type ChildProcess, spawn } from 'node:child_process';
import { type FileHandle, mkdir, open } from 'node:fs/promises';

const ARTIFACT_DIR = 'artifacts/maestro';
const SHIM_URL = 'http://127.0.0.1:9011';
const RECORDING_DEVICE_PREFIX = '/sdcard/maestro-recording';
const RECORDING_BIT_RATE = '4000000';

type ProcessResult = {
    code: number | null;
    signal: NodeJS.Signals | null;
    error?: Error;
};

type ShimProcess = {
    childProcess: ChildProcess;
    completion: Promise<ProcessResult>;
    logFile: FileHandle;
};

type Recorder = {
    stop: () => void;
    loop: Promise<string[]>;
};

const waitForCompletion = (childProcess: ChildProcess): Promise<ProcessResult> =>
    new Promise(resolve => {
        childProcess.once('error', error => {
            resolve({ code: null, signal: null, error });
        });
        childProcess.once('close', (code, signal) => {
            resolve({ code, signal });
        });
    });

const formatProcessFailure = ({
    command,
    result,
}: {
    command: string;
    result: ProcessResult;
}): string => {
    if (result.error) {
        return `${command} failed to start: ${result.error.message}`;
    }

    return `${command} exited with ${
        result.code === null ? `signal ${result.signal}` : `code ${result.code}`
    }.`;
};

const runCommand = async (command: string, args: string[]): Promise<void> => {
    const childProcess = spawn(command, args, {
        stdio: 'inherit',
    });
    const result = await waitForCompletion(childProcess);

    if (result.code !== 0) {
        throw new Error(formatProcessFailure({ command: `${command} ${args.join(' ')}`, result }));
    }
};

const tryRunAdb = async (args: string[]): Promise<boolean> => {
    const childProcess = spawn('adb', args, { stdio: 'inherit' });
    const result = await waitForCompletion(childProcess);

    return result.code === 0;
};

// Records the emulator screen for the duration of the Maestro flow. `adb shell screenrecord`
// caps a single file at 180 seconds, so we chain segments in a host-controlled loop and stop it
// on teardown. Recording is best-effort diagnostics and never fails the test run.
const startRecording = (): Recorder => {
    let active = true;

    const loop = (async (): Promise<string[]> => {
        const segments: string[] = [];

        for (let index = 0; active; index++) {
            const devicePath = `${RECORDING_DEVICE_PREFIX}-${index}.mp4`;
            const childProcess = spawn(
                'adb',
                ['shell', 'screenrecord', '--bit-rate', RECORDING_BIT_RATE, devicePath],
                { stdio: 'inherit' },
            );
            segments.push(devicePath);
            const result = await waitForCompletion(childProcess);

            // adb or screenrecord is unavailable; stop trying so we don't spin forever.
            if (result.error) {
                console.error(formatProcessFailure({ command: 'adb shell screenrecord', result }));
                break;
            }
        }

        return segments;
    })();

    return {
        stop: () => {
            active = false;
        },
        loop,
    };
};

const stopRecording = async (recorder: Recorder): Promise<void> => {
    recorder.stop();

    // Interrupt the in-progress segment so its MP4 is finalized and playable.
    await tryRunAdb(['shell', 'pkill', '-INT', 'screenrecord']);

    const segments = await recorder.loop;
    const singleSegment = segments.length === 1;

    for (const [index, devicePath] of segments.entries()) {
        const fileName = singleSegment ? 'recording.mp4' : `recording-${index}.mp4`;
        await tryRunAdb(['pull', devicePath, `${ARTIFACT_DIR}/${fileName}`]);
        await tryRunAdb(['shell', 'rm', '-f', devicePath]);
    }
};

const startShim = async (): Promise<ShimProcess> => {
    const logFile = await open('artifacts/user-env-rest.log', 'w');
    const childProcess = spawn('yarn', ['tsx', '.maestro/user-env-rest/server.ts'], {
        stdio: ['ignore', logFile.fd, logFile.fd],
    });

    return {
        childProcess,
        completion: waitForCompletion(childProcess),
        logFile,
    };
};

const waitForShim = async ({
    shimProcess,
    retries = 30,
    intervalMs = 1000,
}: {
    shimProcess: ShimProcess;
    retries?: number;
    intervalMs?: number;
}): Promise<void> => {
    for (let attempt = 0; attempt < retries; attempt++) {
        const result = await Promise.race([
            fetch(`${SHIM_URL}/health`)
                .then(response => ({ type: 'health' as const, isReady: response.ok }))
                .catch(() => ({ type: 'health' as const, isReady: false })),
            shimProcess.completion.then(processResult => ({
                type: 'exit' as const,
                processResult,
            })),
        ]);

        if (result.type === 'exit') {
            throw new Error(
                formatProcessFailure({
                    command: 'trezor-user-env REST shim',
                    result: result.processResult,
                }),
            );
        }

        if (result.isReady) {
            return;
        }

        await new Promise(resolve => setTimeout(resolve, intervalMs));
    }

    throw new Error('The trezor-user-env REST shim did not become ready.');
};

const cleanup = async (shimProcess: ShimProcess): Promise<void> => {
    try {
        await fetch(`${SHIM_URL}/cleanup`, { method: 'POST' });
    } catch (error) {
        console.error('Failed to clean up trezor-user-env.', error);
    }

    const isRunning =
        shimProcess.childProcess.exitCode === null && shimProcess.childProcess.signalCode === null;

    if (isRunning) {
        shimProcess.childProcess.kill();
    }

    const didExit = await Promise.race([
        shimProcess.completion.then(() => true),
        new Promise<false>(resolve => setTimeout(() => resolve(false), 5000)),
    ]);

    if (!didExit) {
        shimProcess.childProcess.kill('SIGKILL');
        await shimProcess.completion;
    }

    await shimProcess.logFile.close();
};

const run = async (): Promise<void> => {
    await mkdir(`${ARTIFACT_DIR}/debug`, { recursive: true });
    await mkdir(`${ARTIFACT_DIR}/screenshots`, { recursive: true });

    const shimProcess = await startShim();

    try {
        await waitForShim({ shimProcess });

        await runCommand('adb', [
            'install',
            '-r',
            'suite-native/app/android/app/build/outputs/apk/release/app-release.apk',
        ]);
        await runCommand('adb', ['reverse', 'tcp:21328', 'tcp:21328']);

        const recorder = startRecording();

        try {
            await runCommand('maestro', [
                'test',
                '--format',
                'JUNIT',
                '--output',
                `${ARTIFACT_DIR}/junit.xml`,
                '--debug-output',
                `${ARTIFACT_DIR}/debug`,
                '--flatten-debug-output',
                '--test-output-dir',
                `${ARTIFACT_DIR}/screenshots`,
                '.maestro/tests',
            ]);
        } finally {
            await stopRecording(recorder);
        }
    } finally {
        await cleanup(shimProcess);
    }
};

run().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
