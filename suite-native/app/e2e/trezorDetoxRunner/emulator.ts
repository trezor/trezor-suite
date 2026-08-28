/* eslint-disable no-console */
import { execFileSync, spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const BOOT_TIMEOUT_MS = 300_000;
const BOOT_POLL_INTERVAL_MS = 5_000;
const SHUTDOWN_GRACE_MS = 5_000;
const ADB_TIMEOUT_MS = 15_000;
// After a failed recovery attempt another full boot timeout would be burnt on a
// runner that already proved it cannot bring the emulator back. Cooldown makes
// the subsequent checks fail fast instead of stacking two 5-minute waits.
const RECOVERY_COOLDOWN_MS = 5 * 60 * 1000;

// The CI workflow always relaunches on the port the emulator was originally
// started on, so `adb -s emulator-5554` keeps working after a recovery.
const EMULATOR_PORT = 5554;

// Fallback for local runs that never export EMULATOR_OPTIONS. CI exports the
// exact options the action booted the emulator with, so the relaunch uses the
// same graphics/memory setup as the rest of the run.
const DEFAULT_EMULATOR_OPTIONS =
    '-no-window -gpu swiftshader_indirect -no-snapshot-load -no-snapshot-save -noaudio -no-boot-anim -no-metrics';

const ANIMATION_SETTINGS = [
    'window_animation_scale',
    'transition_animation_scale',
    'animator_duration_scale',
];

const sdkRoot = process.env.ANDROID_SDK_ROOT ?? process.env.ANDROID_HOME;

const resolveSdkBinary = (directory: string, binary: string) =>
    sdkRoot ? path.join(sdkRoot, directory, binary) : binary;

const adbPath = resolveSdkBinary('platform-tools', 'adb');
const emulatorPath = resolveSdkBinary('emulator', 'emulator');

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Every adb call is bounded — a wedged (not dead) emulator would otherwise block
// the whole runner and, with it, the emulator watchdog indefinitely.
const runAdb = (args: string[]): string | undefined => {
    try {
        return execFileSync(adbPath, args, {
            encoding: 'utf8',
            timeout: ADB_TIMEOUT_MS,
            stdio: ['ignore', 'pipe', 'pipe'],
        }).trim();
    } catch {
        return undefined;
    }
};

type EmulatorDevice = {
    serial: string;
    state: string;
};

const getEmulatorDevices = (): EmulatorDevice[] =>
    (runAdb(['devices']) ?? '')
        .split('\n')
        .slice(1)
        .flatMap(line => {
            const [serial, state] = line.trim().split(/\s+/);

            if (serial === undefined || !serial.startsWith('emulator-')) {
                return [];
            }

            return [{ serial, state: state ?? 'unknown' }];
        });

const getBootedEmulator = () =>
    getEmulatorDevices().find(
        ({ serial, state }) =>
            state === 'device' &&
            runAdb(['-s', serial, 'shell', 'getprop', 'sys.boot_completed']) === '1',
    );

/**
 * Whether a booted emulator is currently reachable over ADB. A crashed QEMU
 * process disappears from `adb devices` entirely, so this returns false.
 */
export const isEmulatorReachable = () => getBootedEmulator() !== undefined;

/**
 * Emulator management only applies to Android targets. iOS projects run through
 * the same runner and would otherwise be checked against a device that can
 * never exist.
 */
export const isAndroidTarget = (target: string) => target.startsWith('android.');

const getAvdName = (): string => {
    const detoxConfig = require(path.resolve(process.cwd(), '.detoxrc.js')) as {
        devices: { emulator: { device: { avdName: string } } };
    };

    return detoxConfig.devices.emulator.device.avdName;
};

const disableAnimations = (serial: string) => {
    // The android-emulator-runner action applies these once, right after its own
    // boot, so a relaunched emulator would otherwise come back with animations on.
    ANIMATION_SETTINGS.forEach(setting =>
        runAdb(['-s', serial, 'shell', 'settings', 'put', 'global', setting, '0.0']),
    );
};

const killLeftoverEmulators = async () => {
    getEmulatorDevices().forEach(({ serial }) => runAdb(['-s', serial, 'emu', 'kill']));
    await delay(SHUTDOWN_GRACE_MS);

    // A dead QEMU can leave ADB holding a stale (offline) device entry that Detox
    // would happily try to allocate, so restart the daemon with a clean slate.
    runAdb(['kill-server']);
    runAdb(['start-server']);
};

const launchEmulator = (avdName: string): Promise<void> =>
    new Promise((resolve, reject) => {
        const options = (process.env.EMULATOR_OPTIONS ?? DEFAULT_EMULATOR_OPTIONS)
            .split(/\s+/)
            .filter(Boolean);

        const logPath = path.resolve(process.cwd(), 'artifacts', 'emulator-relaunch.log');
        fs.mkdirSync(path.dirname(logPath), { recursive: true });
        const logFile = fs.openSync(logPath, 'a');

        const emulator = spawn(
            emulatorPath,
            ['-port', String(EMULATOR_PORT), '-avd', avdName, ...options],
            { detached: true, stdio: ['ignore', logFile, logFile] },
        );

        // A missing emulator binary emits 'error' — fail fast instead of polling a
        // boot that can never happen.
        emulator.once('error', reject);
        emulator.once('spawn', () => {
            emulator.unref();
            resolve();
        });
    });

const waitForBoot = async () => {
    const deadline = Date.now() + BOOT_TIMEOUT_MS;

    while (Date.now() < deadline) {
        if (isEmulatorReachable()) {
            return true;
        }
        await delay(BOOT_POLL_INTERVAL_MS);
    }

    return false;
};

let lastRecoveryAttemptAt = 0;

/**
 * Make sure a booted emulator is available before handing control over to Detox.
 * The emulator dying mid-run would otherwise poison every remaining project of
 * the shard, because Detox reuses whatever device it finds at startup.
 */
export const ensureEmulatorReady = async (): Promise<boolean> => {
    if (isEmulatorReachable()) {
        return true;
    }

    console.warn('No booted emulator found.');

    if (process.env.CI !== 'true') {
        console.warn('Not running in CI, leaving emulator management to Detox.');

        return false;
    }

    // The previous recovery attempt just failed — do not stack another full boot
    // timeout on top of it (a shard that cannot bring the emulator back should
    // fail fast instead of burning ten minutes on two identical attempts).
    if (Date.now() - lastRecoveryAttemptAt < RECOVERY_COOLDOWN_MS) {
        console.warn('Skipping emulator recovery: previous attempt failed recently.');

        return false;
    }

    const avdName = getAvdName();
    await killLeftoverEmulators();

    console.log(`Relaunching emulator ${avdName} on port ${EMULATOR_PORT}.`);

    try {
        await launchEmulator(avdName);
    } catch (error) {
        console.error('Failed to launch the emulator:', error);
        lastRecoveryAttemptAt = Date.now();

        return false;
    }

    if (!(await waitForBoot())) {
        console.error(`Emulator did not boot within ${BOOT_TIMEOUT_MS / 1000}s.`);
        lastRecoveryAttemptAt = Date.now();

        return false;
    }

    const emulator = getBootedEmulator();
    if (emulator) {
        disableAnimations(emulator.serial);
    }

    console.log('Emulator recovered.');

    return true;
};
