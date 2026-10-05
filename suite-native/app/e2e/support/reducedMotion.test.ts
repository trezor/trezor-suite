import { type SpawnSyncReturns, execFileSync, spawnSync } from 'node:child_process';

import { enableIOSReducedMotion, restoreIOSReducedMotion } from './reducedMotion';

jest.mock('node:child_process');

const execFileSyncMock = jest.mocked(execFileSync);
const spawnSyncMock = jest.mocked(spawnSync);
let isReducedMotionEnabled: boolean | undefined;

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

describe('iOS E2E reduced motion', () => {
    beforeEach(() => {
        isReducedMotionEnabled = false;
        spawnSyncMock.mockImplementation(() =>
            mockCommandResult(
                isReducedMotionEnabled === undefined
                    ? {
                          status: 1,
                          stdout: '',
                          stderr: 'The domain/default pair does not exist',
                      }
                    : { stdout: isReducedMotionEnabled ? '1\n' : '0\n' },
            ),
        );
        execFileSyncMock.mockImplementation((_, args) => {
            switch (args?.[4]) {
                case 'write':
                    isReducedMotionEnabled = args[8] === 'true';

                    return Buffer.from('');
                case 'delete':
                    isReducedMotionEnabled = undefined;

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
        isReducedMotionEnabled = originalValue;

        enableIOSReducedMotion('simulator');
        expect(isReducedMotionEnabled).toBe(true);

        restoreIOSReducedMotion();
        expect(isReducedMotionEnabled).toBe(originalValue);
    });

    it('keeps the original preference across repeated app launches', () => {
        enableIOSReducedMotion('simulator');
        enableIOSReducedMotion('simulator');

        restoreIOSReducedMotion();

        expect(isReducedMotionEnabled).toBe(false);
    });

    it('captures the original preference again for the next test file', () => {
        enableIOSReducedMotion('simulator');
        restoreIOSReducedMotion();

        isReducedMotionEnabled = true;
        enableIOSReducedMotion('simulator');
        restoreIOSReducedMotion();

        expect(isReducedMotionEnabled).toBe(true);
    });

    it.each(['ENOENT', 'ETIMEDOUT'])('preserves the preference on a process error (%s)', code => {
        const error = Object.assign(new Error(code), { code });
        spawnSyncMock.mockReturnValueOnce(mockCommandResult({ error, status: null }));

        expect(() => enableIOSReducedMotion('simulator')).toThrow(error);
        expect(isReducedMotionEnabled).toBe(false);
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
            `Failed to read reduced motion preference (exit status ${status})`,
        );
        expect(isReducedMotionEnabled).toBe(false);
        expect(execFileSyncMock).not.toHaveBeenCalled();
    });

    it.each(['', 'yes', '2'])('preserves the preference when the value is invalid (%s)', stdout => {
        spawnSyncMock.mockReturnValueOnce(mockCommandResult({ stdout }));

        expect(() => enableIOSReducedMotion('simulator')).toThrow(
            'Unexpected reduced motion preference',
        );
        expect(isReducedMotionEnabled).toBe(false);
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
        expect(isReducedMotionEnabled).toBe(false);
    });

    it('does not change any preference when no app was launched', () => {
        restoreIOSReducedMotion();

        expect(execFileSyncMock).not.toHaveBeenCalled();
    });
});
