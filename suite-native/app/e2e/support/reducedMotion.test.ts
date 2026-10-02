import { execFileSync } from 'node:child_process';

import { enableIOSReducedMotion, restoreIOSReducedMotion } from './reducedMotion';

jest.mock('node:child_process');

const execFileSyncMock = jest.mocked(execFileSync);
let isReducedMotionEnabled: boolean | undefined;

describe('iOS E2E reduced motion', () => {
    beforeEach(() => {
        isReducedMotionEnabled = false;
        execFileSyncMock.mockImplementation((_, args) => {
            switch (args?.[4]) {
                case 'read':
                    if (isReducedMotionEnabled === undefined) {
                        throw Object.assign(new Error('Missing preference'), {
                            status: 1,
                            stderr: Buffer.from('The domain/default pair does not exist'),
                        });
                    }

                    return Buffer.from(isReducedMotionEnabled ? '1\n' : '0\n');
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

    it('does not override the preference when reading it fails', () => {
        const error = new Error('Simulator unavailable');
        execFileSyncMock.mockImplementationOnce(() => {
            throw error;
        });

        expect(() => enableIOSReducedMotion('simulator')).toThrow(error);
        expect(isReducedMotionEnabled).toBe(false);
        expect(execFileSyncMock).toHaveBeenCalledTimes(1);
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
