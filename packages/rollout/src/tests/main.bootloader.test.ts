import { getLatestSafeFw } from '../index';

describe('Get latest safe firmware version for T1 in bootloader mode', () => {
    it('actual bootloader version is higher then highest bootloader version in list', () => {
        const result = getLatestSafeFw({
            releasesList: [
                {
                    version: [3, 0, 0],
                    min_bootloader_version: [3, 0, 0],
                    bootloader_version: [4, 0, 0],
                },
                {
                    version: [2, 0, 0],
                    min_bootloader_version: [2, 0, 0],
                    bootloader_version: [3, 0, 0],
                },
                {
                    version: [1, 0, 0],
                    min_bootloader_version: [1, 0, 0],
                    bootloader_version: [2, 0, 0],
                },
            ],
            isInBootloader: true,
            bootloaderVersion: [10, 10, 10],
        });
        expect(result).toEqual(null);
    });

    it('actual bootloader version is lower then lowest bootloader version in list and is lower than second lowest min_bootloader_version in list', () => {
        const result = getLatestSafeFw({
            releasesList: [
                {
                    version: [3, 0, 0],
                    min_bootloader_version: [3, 0, 0],
                    bootloader_version: [4, 0, 0],
                },
                {
                    version: [2, 0, 0],
                    min_bootloader_version: [2, 0, 0],
                    bootloader_version: [3, 0, 0],
                },
                {
                    version: [1, 0, 0],
                    min_bootloader_version: [1, 0, 0],
                    bootloader_version: [2, 0, 0],
                },
            ],
            isInBootloader: true,
            bootloaderVersion: [1, 0, 0],
        });
        if (result) {
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
        } else {
            throw new Error('I have failed you');
        }
    });

    it('cant tell if offered release is newer than actual', () => {
        const result = getLatestSafeFw({
            releasesList: [
                {
                    version: [3, 0, 0],
                    min_bootloader_version: [1, 0, 0],
                    bootloader_version: [3, 0, 0],
                },
                {
                    version: [2, 0, 0],
                    min_bootloader_version: [1, 0, 0],
                    bootloader_version: [3, 0, 0],
                },
                {
                    version: [1, 0, 0],
                    min_bootloader_version: [1, 0, 0],
                    bootloader_version: [3, 0, 0],
                },
            ],
            isInBootloader: true,
            bootloaderVersion: [3, 0, 0],
        });
        if (result) {
            expect(result.firmware.version).toEqual([3, 0, 0]);
            expect(result.isNewer).toEqual(null);
        } else {
            throw new Error('I have failed you');
        }
    });

    it('actual bootloader version is lower then lowest bootloader version in list and is higher than lowest min_bootloader_version in list', () => {
        const result = getLatestSafeFw({
            releasesList: [
                {
                    version: [3, 0, 0],
                    min_bootloader_version: [3, 0, 0],
                    bootloader_version: [4, 0, 0],
                },
                {
                    version: [2, 0, 0],
                    min_bootloader_version: [2, 0, 0],
                    bootloader_version: [3, 0, 0],
                },
                {
                    version: [1, 0, 0],
                    min_bootloader_version: [1, 0, 0],
                    bootloader_version: [2, 0, 0],
                },
            ],
            isInBootloader: true,
            bootloaderVersion: [2, 0, 0],
        });
        if (result) {
            expect(result.firmware.version).toEqual([2, 0, 0]);
            expect(result.isLatest).toEqual(false);
            expect(result.isRequired).toEqual(false);
        } else {
            throw new Error('I have failed you');
        }
    });

    it('test bootloader multiple versions', () => {
        const result = getLatestSafeFw({
            releasesList: [
                {
                    version: [4, 0, 0],
                    min_bootloader_version: [3, 0, 0],
                    bootloader_version: [4, 0, 0],
                },
                {
                    version: [3, 0, 0],
                    min_bootloader_version: [2, 0, 0],
                    bootloader_version: [3, 0, 0],
                },
                {
                    version: [2, 0, 0],
                    min_bootloader_version: [0, 0, 0],
                    bootloader_version: [2, 0, 0],
                },
                {
                    version: [1, 0, 0],
                    min_bootloader_version: [0, 0, 0],
                    bootloader_version: [1, 0, 0],
                },
            ],
            isInBootloader: true,
            bootloaderVersion: [2, 0, 0],
        });
        if (result) {
            expect(result.firmware.version).toEqual([3, 0, 0]);
            expect(result.isLatest).toEqual(false);
            expect(result.isRequired).toEqual(false);
        } else {
            throw new Error('I have failed you');
        }
    });

    it('test bootloader lower version', () => {
        const result = getLatestSafeFw({
            releasesList: [
                {
                    version: [3, 0, 0],
                    min_bootloader_version: [1, 0, 0],
                    bootloader_version: [1, 0, 0],
                },
                {
                    version: [2, 0, 0],
                    min_bootloader_version: [1, 0, 0],
                    bootloader_version: [1, 0, 0],
                },
                {
                    version: [1, 0, 0],
                    min_bootloader_version: [1, 0, 0],
                    bootloader_version: [0, 0, 0],
                },
            ],
            isInBootloader: true,
            bootloaderVersion: [0, 5, 0],
        });

        expect(result).toEqual(null);
    });
});
