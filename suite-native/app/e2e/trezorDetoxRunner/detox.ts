/* eslint-disable no-console */
import { type ChildProcess, execSync, spawn } from 'child_process';
import * as path from 'path';

import { ensureEmulatorReady, isAndroidTarget, isEmulatorReachable } from './emulator';
import type { ProjectConfig } from './types';

const EMULATOR_HEALTH_CHECK_INTERVAL_MS = 30_000;
const EMULATOR_HEALTH_CHECK_FAILURES_BEFORE_ABORT = 4;
const KILL_GRACE_MS = 10_000;

/** Detox runs Jest as a grandchild, so signal the whole detached process group. */
const killProcessTree = (child: ChildProcess, signal: NodeJS.Signals) => {
    if (child.pid === undefined) {
        return;
    }

    try {
        process.kill(-child.pid, signal);
    } catch {
        child.kill(signal);
    }
};

/**
 * Once the emulator process is gone, every remaining test can only fail on a
 * missing device while still paying for retries and artifact collection. Abort
 * the run instead of grinding through the rest of the shard.
 *
 * Returns a function stopping the watchdog.
 */
const startEmulatorWatchdog = (child: ChildProcess) => {
    let unreachableChecks = 0;

    const healthCheck = setInterval(() => {
        if (isEmulatorReachable()) {
            unreachableChecks = 0;

            return;
        }

        unreachableChecks += 1;
        console.error(
            `Emulator is not reachable (${unreachableChecks}/${EMULATOR_HEALTH_CHECK_FAILURES_BEFORE_ABORT}).`,
        );

        if (unreachableChecks < EMULATOR_HEALTH_CHECK_FAILURES_BEFORE_ABORT) {
            return;
        }

        console.error('Emulator is gone, aborting the Detox run.');
        killProcessTree(child, 'SIGTERM');
        setTimeout(() => killProcessTree(child, 'SIGKILL'), KILL_GRACE_MS).unref();
    }, EMULATOR_HEALTH_CHECK_INTERVAL_MS);

    return () => clearInterval(healthCheck);
};

export const getJestTestFiles = (): string[] => {
    try {
        const output = execSync('yarn exec jest --listTests --config ./e2e/jest.config.js', {
            cwd: process.cwd(),
            encoding: 'utf8',
            env: { ...process.env, CI: 'true', TDR_PROJECT_NAME: 'detox' },
        });

        return output
            .split('\n')
            .map(line => line.trim())
            .filter(line => line && path.isAbsolute(line))
            .sort();
    } catch (e) {
        console.error('Failed to list test files via Jest:', e);
        process.exit(1);
    }
};

const runDetox = (
    detoxConfiguration: string,
    env: NodeJS.ProcessEnv,
    headless: boolean,
    testFiles?: string[],
): Promise<void> =>
    new Promise((resolve, reject) => {
        const args = ['detox', 'test', '--configuration', detoxConfiguration];
        if (headless) {
            args.push('--headless');
        }
        if (testFiles && testFiles.length > 0) {
            args.push(...testFiles);
        }

        const child = spawn('npx', args, { stdio: 'inherit', env, detached: true });

        const stopEmulatorWatchdog = isAndroidTarget(detoxConfiguration)
            ? startEmulatorWatchdog(child)
            : undefined;

        const forwardSignal = (signal: NodeJS.Signals) => () => killProcessTree(child, signal);
        const onInterrupt = forwardSignal('SIGINT');
        const onTerminate = forwardSignal('SIGTERM');
        process.on('SIGINT', onInterrupt);
        process.on('SIGTERM', onTerminate);

        const cleanUp = () => {
            stopEmulatorWatchdog?.();
            process.off('SIGINT', onInterrupt);
            process.off('SIGTERM', onTerminate);
        };

        child.on('close', code => {
            cleanUp();

            if (code === 0) {
                resolve();
            } else {
                reject(
                    new Error(
                        `Detox tests for configuration ${detoxConfiguration} failed${
                            code === null ? ' (killed by signal)' : ` with exit code ${code}`
                        }`,
                    ),
                );
            }
        });

        child.on('error', err => {
            cleanUp();
            reject(err);
        });
    });

const runProject = async (
    project: ProjectConfig,
    headless: boolean,
    testFiles: string[],
): Promise<void> => {
    console.log(`\nStarting project: ${project.projectName}`);

    const env: NodeJS.ProcessEnv = {
        ...process.env,
        TDR_PROJECT_NAME: project.projectName,
    };

    if (project.model) {
        env.TDR_MODEL = project.model;
    }
    if (project.firmwareVersion) {
        env.TDR_FIRMWARE_VERSION = project.firmwareVersion;
    }
    if (project.grep) {
        env.TDR_GREP = project.grep;
    }

    await runDetox(project.target, env, headless, testFiles);
};

/**
 * Run a single project and return whether Detox itself crashed (exit code != 0
 * or spawn error), independently of the JUnit report contents.
 *
 * When the project fails because the Android emulator itself died (a recurring
 * infra issue on hosted runners), all test retries would fail against the dead
 * device. In that case the emulator is relaunched via `ensureEmulatorReady` and
 * the project is re-run once before the failure is reported. `ensureEmulatorReady`
 * refuses to manage the emulator outside of CI, so this stays inert locally.
 */
export const runProjectSafely = async (
    project: ProjectConfig,
    headless: boolean,
    testFiles: string[],
): Promise<boolean> => {
    let detoxFailed = false;

    try {
        await runProject(project, headless, testFiles);
    } catch (error) {
        console.error(`Project ${project.projectName} failed:`, error);
        detoxFailed = true;
    }

    if (detoxFailed && isAndroidTarget(project.target) && !isEmulatorReachable()) {
        console.warn(
            `[infra] Android emulator is not reachable after '${project.projectName}' failed. ` +
                'Relaunching the emulator and retrying the project once.',
        );

        try {
            if (await ensureEmulatorReady()) {
                await runProject(project, headless, testFiles);
                detoxFailed = false;
            }
        } catch (retryError) {
            console.error(
                `Project ${project.projectName} failed even after the emulator restart:`,
                retryError,
            );
        }
    }

    return detoxFailed;
};
