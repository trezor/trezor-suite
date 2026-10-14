import { execFileSync, spawnSync } from 'node:child_process';

const ACCESSIBILITY_DOMAIN = 'com.apple.Accessibility';
const REDUCED_MOTION_KEY = 'ReduceMotionEnabled';
const originalReducedMotion = new Map<string, boolean | undefined>();

const runSimulatorDefaults = (simulatorId: string, args: string[]) =>
    execFileSync('xcrun', ['simctl', 'spawn', simulatorId, 'defaults', ...args], {
        timeout: 10_000,
        stdio: ['ignore', 'pipe', 'pipe'],
    });

const readReducedMotion = (simulatorId: string): boolean | undefined => {
    const { error, status, stdout, stderr } = spawnSync(
        'xcrun',
        [
            'simctl',
            'spawn',
            simulatorId,
            'defaults',
            'read',
            ACCESSIBILITY_DOMAIN,
            REDUCED_MOTION_KEY,
        ],
        {
            encoding: 'utf8',
            timeout: 10_000,
            stdio: ['ignore', 'pipe', 'pipe'],
        },
    );

    if (error) {
        throw error;
    }

    if (status === 1 && stderr.includes('does not exist')) {
        return undefined;
    }

    if (status !== 0) {
        throw new Error(
            `Failed to read reduced motion preference (exit status ${status}): ${stderr.trim()}`,
        );
    }

    const value = stdout.trim();

    if (value !== '0' && value !== '1') {
        throw new Error(`Unexpected reduced motion preference: ${value}`);
    }

    return value === '1';
};

export const enableIOSReducedMotion = (simulatorId: string) => {
    if (!originalReducedMotion.has(simulatorId)) {
        originalReducedMotion.set(simulatorId, readReducedMotion(simulatorId));
    }

    // Reanimated reads reduced motion only when the JavaScript runtime starts.
    runSimulatorDefaults(simulatorId, [
        'write',
        ACCESSIBILITY_DOMAIN,
        REDUCED_MOTION_KEY,
        '-bool',
        'true',
    ]);
};

export const restoreIOSReducedMotion = () => {
    for (const [simulatorId, wasReducedMotionEnabled] of originalReducedMotion) {
        const args =
            wasReducedMotionEnabled === undefined
                ? ['delete', ACCESSIBILITY_DOMAIN, REDUCED_MOTION_KEY]
                : [
                      'write',
                      ACCESSIBILITY_DOMAIN,
                      REDUCED_MOTION_KEY,
                      '-bool',
                      String(wasReducedMotionEnabled),
                  ];

        runSimulatorDefaults(simulatorId, args);
        originalReducedMotion.delete(simulatorId);
    }
};
