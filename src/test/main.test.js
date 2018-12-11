import { getLatestSafeFw } from 'main';
import { mockRandom } from 'jest-mock-random';

describe('Get fixed random', () => {
    it('no firmware at all', () => {
        const result = getLatestSafeFw({
            releasesList: [
                { version: [3, 0, 0], min_bootloader_version: [3, 0, 0] },
                { version: [2, 0, 0], min_bootloader_version: [2, 0, 0] },
                { version: [1, 0, 0], min_bootloader_version: [1, 0, 0] },
            ],
            isInBootloader: false,
            firmwareVersion: null,
        });

        expect(result.version).toEqual([3, 0, 0]);
    });

    it('is safe to update but is not in probability in bootloader', () => {
        mockRandom(0.512862123418226);
        const result = getLatestSafeFw({
            releasesList: [
                { version: [3, 0, 0], min_bootloader_version: [3, 0, 0], rollout: 0.2 },
                { version: [2, 0, 0], min_bootloader_version: [2, 0, 0] },
            ],
            isInBootloader: true,
            bootloaderVersion: [3, 0, 0],
        });

        expect(result).toEqual([]);
    });

    it('is safe to update but is not in probability in bootloader at beta', () => {
        mockRandom(0.512862123418226);
        const result = getLatestSafeFw({
            releasesList: [
                {
                    version: [3, 0, 0], min_bootloader_version: [3, 0, 0], rollout: 0.2, channel: 'beta',
                },
                { version: [2, 0, 0], min_bootloader_version: [2, 0, 0] },
            ],
            isInBootloader: true,
            bootloaderVersion: [3, 0, 0],
        });

        expect(result.version).toEqual([3, 0, 0]);
    });

    it('is safe to update but is not in probability in normal mode', () => {
        mockRandom(0.512862123418226);
        const result = getLatestSafeFw({
            releasesList: [
                { version: [3, 0, 0], min_firmware_version: [3, 0, 0], rollout: 0.2 },
                { version: [2, 0, 0], min_firmware_version: [2, 0, 0] },
            ],
            isInBootloader: false,
            firmwareVersion: [3, 0, 0],
        });

        expect(result).toEqual([]);
    });

    it('is safe to update but is not in probability in normal mode at beta', () => {
        mockRandom(0.512862123418226);
        const result = getLatestSafeFw({
            releasesList: [
                {
                    version: [3, 0, 0], min_firmware_version: [3, 0, 0], rollout: 0.2, channel: 'beta',
                },
                { version: [2, 0, 0], min_firmware_version: [2, 0, 0] },
            ],
            isInBootloader: false,
            firmwareVersion: [3, 0, 0],
        });

        expect(result.version).toEqual([3, 0, 0]);
    });

    it('empty case', () => {
        const result = getLatestSafeFw({
            releasesList: [
                { version: [3, 0, 0], min_bootloader_version: [3, 0, 0] },
                { version: [2, 0, 0], min_bootloader_version: [2, 0, 0] },
                { version: [1, 0, 0], min_bootloader_version: [1, 0, 0] },
            ],
        });

        expect(result.version).toEqual([3, 0, 0]);
    });
});
