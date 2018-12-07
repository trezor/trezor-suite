import { getLatestSafeFw } from 'main';

describe('Get latest safe firmware version for T1 in bootloader mode', () => {
    it('test bootloader with higher version', () => {
        const result = getLatestSafeFw({
            releasesList: [
                { version: [3, 0, 0], min_bootloader_version: [3, 0, 0] },
                { version: [2, 0, 0], min_bootloader_version: [2, 0, 0] },
                { version: [1, 0, 0], min_bootloader_version: [1, 0, 0] },
            ],
            isInBootloader: true,
            bootloaderVersion: [10, 10, 10],
        });

        expect(result).toEqual([]);
    });

    it('test bootloader with lowest version', () => {
        const result = getLatestSafeFw({
            releasesList: [
                { version: [3, 0, 0], min_bootloader_version: [3, 0, 0] },
                { version: [2, 0, 0], min_bootloader_version: [2, 0, 0] },
                { version: [1, 0, 0], min_bootloader_version: [1, 0, 0] },
            ],
            isInBootloader: true,
            bootloaderVersion: [1, 0, 0],
        });

        expect(result.version).toEqual([2, 0, 0]);
    });

    it('test bootloader in the middle - single version', () => {
        const result = getLatestSafeFw({
            releasesList: [
                { version: [3, 0, 0], min_bootloader_version: [3, 0, 0] },
                { version: [2, 0, 0], min_bootloader_version: [2, 0, 0] },
                { version: [1, 0, 0], min_bootloader_version: [1, 0, 0] },
            ],
            isInBootloader: true,
            bootloaderVersion: [2, 0, 0],
        });

        expect(result.version).toEqual([3, 0, 0]);
    });

    it('test bootloader multiple versions', () => {
        const result = getLatestSafeFw({
            releasesList: [
                { version: [3, 0, 0], min_bootloader_version: [2, 0, 0] },
                { version: [2, 0, 0], min_bootloader_version: [2, 0, 0] },
                { version: [1, 0, 0], min_bootloader_version: [1, 0, 0] },
            ],
            isInBootloader: true,
            bootloaderVersion: [2, 0, 0],
        });

        expect(result).toEqual([]);
    });

    it('test bootloader lower version', () => {
        const result = getLatestSafeFw({
            releasesList: [
                { version: [3, 0, 0], min_bootloader_version: [2, 0, 0] },
                { version: [2, 0, 0], min_bootloader_version: [2, 0, 0] },
                { version: [1, 0, 0], min_bootloader_version: [1, 0, 0] },
            ],
            isInBootloader: true,
            bootloaderVersion: [0, 5, 0],
        });

        expect(result.version).toEqual([1, 0, 0]);
    });
});
