import { deepStrictEqual, ok, strictEqual } from 'node:assert';
import { type SpawnSyncReturns, execFileSync, spawnSync } from 'node:child_process';

import { enableIOSReducedMotion, restoreIOSReducedMotion } from './reducedMotion';

jest.mock('node:child_process');

const execFileSyncMock = jest.mocked(execFileSync);
const spawnSyncMock = jest.mocked(spawnSync);
const SIMULATOR_DEFAULTS_ARGS = ['simctl', 'spawn', 'simulator', 'defaults'];
const REDUCED_MOTION_PREFERENCE_ARGS = ['com.apple.Accessibility', 'ReduceMotionEnabled'];
let mockReducedMotionPreference: boolean | undefined;

const mockCommandResult = (
    overrides: Partial<SpawnSyncReturns<string>> = {},
): SpawnSyncReturns<string> => ({
    pid: 1,
    output: [],
    stdout: '0\n',
    stderr: '',
    status: 0,
    signal: null,
    ...overrides,
});

const readMockReducedMotionPreference = (): SpawnSyncReturns<string> => {
    if (mockReducedMotionPreference === undefined) {
        return mockCommandResult({
            status: 1,
            stdout: '',
            stderr: 'The domain/default pair does not exist',
        });
    }

    return mockCommandResult({ stdout: mockReducedMotionPreference ? '1\n' : '0\n' });
};

describe('iOS simulator reduced motion preference lifecycle', () => {
    beforeEach(() => {
        mockReducedMotionPreference = false;
        spawnSyncMock.mockImplementation((command, args) => {
            strictEqual(command, 'xcrun');
            deepStrictEqual(args, [
                ...SIMULATOR_DEFAULTS_ARGS,
                'read',
                ...REDUCED_MOTION_PREFERENCE_ARGS,
            ]);

            return readMockReducedMotionPreference();
        });
        execFileSyncMock.mockImplementation((command, args) => {
            strictEqual(command, 'xcrun');
            deepStrictEqual(
                args?.slice(0, SIMULATOR_DEFAULTS_ARGS.length),
                SIMULATOR_DEFAULTS_ARGS,
            );

            const [operation, ...preferenceArgs] =
                args?.slice(SIMULATOR_DEFAULTS_ARGS.length) ?? [];

            switch (operation) {
                case 'write': {
                    const [, , , value] = preferenceArgs;
                    deepStrictEqual(preferenceArgs, [
                        ...REDUCED_MOTION_PREFERENCE_ARGS,
                        '-bool',
                        value,
                    ]);
                    ok(
                        value === 'true' || value === 'false',
                        'Expected a boolean preference value',
                    );
                    mockReducedMotionPreference = value === 'true';

                    return Buffer.from('');
                }
                case 'delete':
                    deepStrictEqual(preferenceArgs, REDUCED_MOTION_PREFERENCE_ARGS);
                    mockReducedMotionPreference = undefined;

                    return Buffer.from('');
                default:
                    throw new Error('Unexpected simulator command');
            }
        });
    });

    afterEach(() => {
        restoreIOSReducedMotion();
        execFileSyncMock.mockReset();
        spawnSyncMock.mockReset();
    });

    it.each([false, true, undefined])('restores the original preference (%s)', originalValue => {
        mockReducedMotionPreference = originalValue;

        enableIOSReducedMotion('simulator');
        expect(mockReducedMotionPreference).toBe(true);

        restoreIOSReducedMotion();
        expect(mockReducedMotionPreference).toBe(originalValue);
    });

    it('keeps the original preference across repeated enable calls', () => {
        enableIOSReducedMotion('simulator');
        enableIOSReducedMotion('simulator');

        restoreIOSReducedMotion();

        expect(mockReducedMotionPreference).toBe(false);
    });

    it('captures the current preference for a new enable/restore cycle', () => {
        enableIOSReducedMotion('simulator');
        restoreIOSReducedMotion();

        mockReducedMotionPreference = true;
        enableIOSReducedMotion('simulator');
        restoreIOSReducedMotion();

        expect(mockReducedMotionPreference).toBe(true);
    });

    it('preserves the preference when the process fails', () => {
        const error = new Error('Simulator unavailable');
        spawnSyncMock.mockReturnValueOnce(mockCommandResult({ error, status: null }));

        expect(() => enableIOSReducedMotion('simulator')).toThrow(error);
        expect(mockReducedMotionPreference).toBe(false);
        expect(execFileSyncMock).not.toHaveBeenCalled();
    });

    it.each<[number | null, string]>([
        [1, 'Simulator unavailable'],
        [2, 'The domain/default pair does not exist'],
        [null, ''],
    ])('preserves the preference when the read command fails (status %s)', (status, stderr) => {
        spawnSyncMock.mockReturnValueOnce(
            mockCommandResult({ status, stderr, signal: status === null ? 'SIGTERM' : null }),
        );

        expect(() => enableIOSReducedMotion('simulator')).toThrow(
            'Failed to read reduced motion preference',
        );
        expect(mockReducedMotionPreference).toBe(false);
        expect(execFileSyncMock).not.toHaveBeenCalled();
    });

    it('preserves the preference when the value is invalid', () => {
        spawnSyncMock.mockReturnValueOnce(mockCommandResult({ stdout: 'unexpected' }));

        expect(() => enableIOSReducedMotion('simulator')).toThrow(
            'Unexpected reduced motion preference',
        );
        expect(mockReducedMotionPreference).toBe(false);
        expect(execFileSyncMock).not.toHaveBeenCalled();
    });

    it('keeps the original preference available when restoration fails', () => {
        enableIOSReducedMotion('simulator');
        const error = new Error('Simulator unavailable');
        execFileSyncMock.mockImplementationOnce(() => {
            throw error;
        });

        expect(restoreIOSReducedMotion).toThrow(error);

        restoreIOSReducedMotion();
        expect(mockReducedMotionPreference).toBe(false);
    });

    it('does not write any preference when restore is called without enabling', () => {
        restoreIOSReducedMotion();

        expect(execFileSyncMock).not.toHaveBeenCalled();
    });
});
