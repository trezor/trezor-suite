import Rollout from '../index';

describe('getInfoSync() in normal (firmware) mode', () => {
    let rollout;
    beforeEach(() => {
        rollout = Rollout({
            baseUrl: 'foo',
            releasesListsPaths: {
                1: 'doest matter, is mocked',
                2: 'indeed',
            },
        });
    });
    it('for firmware version 10.10.10, there is no matching bootloaderVersion in list ', () => {
        const result = rollout.getInfoSync(
            {
                bootloader_mode: false,
                major_version: 10,
                minor_version: 10,
                patch_version: 10,
            },
            [
                {
                    version: [3, 0, 0],
                    min_firmware_version: [2, 0, 0],
                    bootloader_version: [3, 0, 0],
                    min_bootloader_version: [2, 0, 0],
                },
                {
                    version: [2, 0, 0],
                    min_firmware_version: [1, 0, 0],
                    bootloader_version: [2, 0, 0],
                    min_bootloader_version: [1, 0, 0],
                },
                {
                    version: [1, 0, 0],
                    min_firmware_version: [0, 0, 0],
                    bootloader_version: [1, 0, 0],
                    min_bootloader_version: [0, 0, 0],
                },
            ]
        );

        expect(result).toEqual(null);
    });

    it('test single version bump', () => {
        const result = rollout.getInfoSync(
            {
                bootloader_mode: false,
                major_version: 2,
                minor_version: 0,
                patch_version: 0,
            },
            [
                {
                    version: [3, 0, 0],
                    min_firmware_version: [2, 0, 0],
                    bootloader_version: [3, 0, 0],
                    min_bootloader_version: [2, 0, 0],
                },
                {
                    version: [2, 0, 0],
                    min_firmware_version: [1, 0, 0],
                    bootloader_version: [2, 0, 0],
                    min_bootloader_version: [1, 0, 0],
                },
                {
                    version: [1, 0, 0],
                    min_firmware_version: [0, 0, 0],
                    bootloader_version: [1, 0, 0],
                    min_bootloader_version: [0, 0, 0],
                },
            ]
        );

        expect(result.firmware.version).toEqual([3, 0, 0]);
        expect(result.isLatest).toEqual(true);
        expect(result.isRequired).toEqual(false);
        expect(result.isNewer).toEqual(true);
    });

    it('test firmware multiple version bump', () => {
        const result = rollout.getInfoSync(
            {
                bootloader_mode: false,
                major_version: 2,
                minor_version: 0,
                patch_version: 0,
            },
            [
                {
                    version: [4, 0, 0],
                    min_firmware_version: [2, 0, 0],
                    bootloader_version: [3, 0, 0],
                    min_bootloader_version: [2, 0, 0],
                },
                {
                    version: [3, 0, 0],
                    min_firmware_version: [2, 0, 0],
                    bootloader_version: [3, 0, 0],
                    min_bootloader_version: [2, 0, 0],
                },
                {
                    version: [2, 0, 0],
                    min_firmware_version: [1, 0, 0],
                    bootloader_version: [2, 0, 0],
                    min_bootloader_version: [1, 0, 0],
                },
                {
                    version: [1, 0, 0],
                    min_firmware_version: [0, 0, 0],
                    bootloader_version: [1, 0, 0],
                    min_bootloader_version: [0, 0, 0],
                },
            ]
        );

        expect(result.firmware.version).toEqual([4, 0, 0]);
        expect(result.isRequired).toEqual(false);
        expect(result.isLatest).toEqual(true);
        expect(result.isNewer).toEqual(true);
    });
});
