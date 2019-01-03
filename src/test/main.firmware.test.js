import { getLatestSafeFw } from 'main';

describe('Get latest safe firmware version for T1 in normal mode', () => {
    it('for firmware version 10.10.10, there is no matching bootloaderVersion in list ', () => {
        const result = getLatestSafeFw({
            releasesList: [{
                version: [3, 0, 0], min_firmware_version: [2, 0, 0], bootloaderVersion: [3, 0, 0], min_bootloader_version: [2, 0, 0],
            }, {
                version: [2, 0, 0], min_firmware_version: [1, 0, 0], bootloaderVersion: [2, 0, 0], min_bootloader_version: [1, 0, 0],
            }, {
                version: [1, 0, 0], min_firmware_version: [0, 0, 0], bootloaderVersion: [1, 0, 0], min_bootloader_version: [0, 0, 0],
            }],
            isInBootloader: false,
            firmwareVersion: [10, 10, 10],
        });

        expect(result).toEqual(null);
    });

    it('test single version bump', () => {
        const result = getLatestSafeFw({
            releasesList: [{
                version: [3, 0, 0], min_firmware_version: [2, 0, 0], bootloaderVersion: [3, 0, 0], min_bootloader_version: [2, 0, 0],
            }, {
                version: [2, 0, 0], min_firmware_version: [1, 0, 0], bootloaderVersion: [2, 0, 0], min_bootloader_version: [1, 0, 0],
            }, {
                version: [1, 0, 0], min_firmware_version: [0, 0, 0], bootloaderVersion: [1, 0, 0], min_bootloader_version: [0, 0, 0],
            }],
            isInBootloader: false,
            firmwareVersion: [2, 0, 0],
        });

        expect(result.firmware.version).toEqual([3, 0, 0]);
        expect(result.isLatest).toEqual(true);
        expect(result.isRequired).toEqual(false);
        expect(result.isNewer).toEqual(true);
    });

    it('test firmware multiple version bump', () => {
        const result = getLatestSafeFw({
            releasesList: [{
                version: [4, 0, 0], min_firmware_version: [2, 0, 0], bootloaderVersion: [3, 0, 0], min_bootloader_version: [2, 0, 0],
            }, {
                version: [3, 0, 0], min_firmware_version: [2, 0, 0], bootloaderVersion: [3, 0, 0], min_bootloader_version: [2, 0, 0],
            }, {
                version: [2, 0, 0], min_firmware_version: [1, 0, 0], bootloaderVersion: [2, 0, 0], min_bootloader_version: [1, 0, 0],
            }, {
                version: [1, 0, 0], min_firmware_version: [0, 0, 0], bootloaderVersion: [1, 0, 0], min_bootloader_version: [0, 0, 0],
            }],
            isInBootloader: false,
            firmwareVersion: [2, 0, 0],
        });

        expect(result.firmware.version).toEqual([4, 0, 0]);
        expect(result.isRequired).toEqual(false);
        expect(result.isLatest).toEqual(true);
        expect(result.isNewer).toEqual(true);
    });
});
