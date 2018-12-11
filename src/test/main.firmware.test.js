import { getLatestSafeFw } from 'main';

describe('Get latest safe firmware version for T1 in normal mode', () => {
    it('test firmware higher version bump', () => {
        const result = getLatestSafeFw({
            releasesList: [
                { version: [3, 0, 0], min_firmware_version: [3, 0, 0] },
                { version: [2, 0, 0], min_firmware_version: [2, 0, 0] },
                { version: [1, 0, 0], min_firmware_version: [1, 0, 0] },
            ],
            isInBootloader: false,
            firmwareVersion: [10, 10, 10],
        });

        expect(result).toEqual([]);
    });

    it('test single version bump', () => {
        const result = getLatestSafeFw({
            releasesList: [
                { version: [3, 0, 0], min_firmware_version: [3, 0, 0] },
                { version: [2, 0, 0], min_firmware_version: [2, 0, 0] },
                { version: [1, 0, 0], min_firmware_version: [1, 0, 0] },
            ],
            isInBootloader: false,
            firmwareVersion: [2, 0, 0],
        });

        expect(result.version).toEqual([2, 0, 0]);
    });

    it('test firmware multiple version bump', () => {
        const result = getLatestSafeFw({
            releasesList: [
                { version: [4, 0, 0], min_firmware_version: [3, 0, 0] },
                { version: [3, 0, 0], min_firmware_version: [2, 0, 0] },
                { version: [2, 0, 0], min_firmware_version: [2, 0, 0] },
                { version: [1, 0, 0], min_firmware_version: [1, 0, 0] },
            ],
            isInBootloader: false,
            firmwareVersion: [2, 0, 0],
        });

        expect(result.version).toEqual([2, 0, 0]);
    });
});
