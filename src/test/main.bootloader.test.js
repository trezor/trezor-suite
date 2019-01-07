import { getLatestSafeFw } from 'main';

describe('Get latest safe firmware version for T1 in bootloader mode', () => {
    it('actual bootloader version is higher then highest bootloader version in list', () => {
        const result = getLatestSafeFw({
            releasesList: [
                { version: [3, 0, 0], min_bootloader_version: [3, 0, 0], bootloader_version: [4, 0, 0] },
                { version: [2, 0, 0], min_bootloader_version: [2, 0, 0], bootloader_version: [3, 0, 0] },
                { version: [1, 0, 0], min_bootloader_version: [1, 0, 0], bootloader_version: [2, 0, 0] },
            ],
            isInBootloader: true,
            bootloaderVersion: [10, 10, 10],
        });

        expect(result).toEqual(null);
    });

    it('actual bootloader version is lower then lowest bootloader version in list and is lower than second lowest min_bootloader_version in list', () => {
        const result = getLatestSafeFw({
            releasesList: [
                { version: [3, 0, 0], min_bootloader_version: [3, 0, 0], bootloader_version: [4, 0, 0] },
                { version: [2, 0, 0], min_bootloader_version: [2, 0, 0], bootloader_version: [3, 0, 0] },
                { version: [1, 0, 0], min_bootloader_version: [1, 0, 0], bootloader_version: [2, 0, 0] },
            ],
            isInBootloader: true,
            bootloaderVersion: [1, 0, 0],
        });

        expect(result).toEqual({
            firmware: {
                version: [1, 0, 0],
                min_bootloader_version: [1, 0, 0],
                bootloader_version: [2, 0, 0],
            },
            isLatest: false,
            isRequired: false,
            isNewer: true,
        });
    });

    it('cant tell if offered release is newer than actual', () => {
        const result = getLatestSafeFw({
            releasesList: [
                { version: [3, 0, 0], min_bootloader_version: [1, 0, 0], bootloader_version: [3, 0, 0] },
                { version: [2, 0, 0], min_bootloader_version: [1, 0, 0], bootloader_version: [3, 0, 0] },
                { version: [1, 0, 0], min_bootloader_version: [1, 0, 0], bootloader_version: [3, 0, 0] },
            ],
            isInBootloader: true,
            bootloaderVersion: [3, 0, 0],
        });

        expect(result.firmware.version).toEqual([3, 0, 0]);
        expect(result.isNewer).toEqual(null);
    });

    it('actual bootloader version is lower then lowest bootloader version in list and is higher than lowest min_bootloader_version in list', () => {
        const result = getLatestSafeFw({
            releasesList: [
                { version: [3, 0, 0], min_bootloader_version: [3, 0, 0], bootloader_version: [4, 0, 0] },
                { version: [2, 0, 0], min_bootloader_version: [2, 0, 0], bootloader_version: [3, 0, 0] },
                { version: [1, 0, 0], min_bootloader_version: [1, 0, 0], bootloader_version: [2, 0, 0] },
            ],
            isInBootloader: true,
            bootloaderVersion: [2, 0, 0],
        });

        expect(result.firmware.version).toEqual([2, 0, 0]);
        expect(result.isLatest).toEqual(false);
        expect(result.isRequired).toEqual(false);
    });

    it('test bootloader multiple versions', () => {
        const result = getLatestSafeFw({
            releasesList: [
                { version: [4, 0, 0], min_bootloader_version: [3, 0, 0], bootloader_version: [4, 0, 0] },
                { version: [3, 0, 0], min_bootloader_version: [2, 0, 0], bootloader_version: [3, 0, 0] },
                { version: [2, 0, 0], min_bootloader_version: [0, 0, 0], bootloader_version: [2, 0, 0] },
                { version: [1, 0, 0], min_bootloader_version: [0, 0, 0], bootloader_version: [1, 0, 0] },
            ],
            isInBootloader: true,
            bootloaderVersion: [2, 0, 0],
        });

        expect(result.firmware.version).toEqual([3, 0, 0]);
        expect(result.isLatest).toEqual(false);
        expect(result.isRequired).toEqual(false);
    });

    it('test bootloader lower version', () => {
        const result = getLatestSafeFw({
            releasesList: [
                { version: [3, 0, 0], min_bootloader_version: [1, 0, 0], bootloader_version: [1, 0, 0] },
                { version: [2, 0, 0], min_bootloader_version: [1, 0, 0], bootloader_version: [1, 0, 0] },
                { version: [1, 0, 0], min_bootloader_version: [1, 0, 0], bootloader_version: [0, 0, 0] },
            ],
            isInBootloader: true,
            bootloaderVersion: [0, 5, 0],
        });

        expect(result).toEqual(null);
    });
});
