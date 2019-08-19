import Rollout from '../index';

describe('getInfoSync() test required updates', () => {
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
    it('bootloader mode, newest fw is required', () => {
        const result = rollout.getInfoSync(
            {
                bootloader_mode: true,
                major_version: 2,
                minor_version: 0,
                patch_version: 0,
            },
            [
                {
                    version: [3, 0, 0],
                    min_firmware_version: [1, 0, 0],
                    bootloader_version: [3, 0, 0],
                    min_bootloader_version: [1, 0, 0],
                    required: true,
                },
                {
                    version: [2, 0, 0],
                    min_firmware_version: [1, 0, 0],
                    bootloader_version: [3, 0, 0],
                    min_bootloader_version: [1, 0, 0],
                },
            ]
        );

        expect(result.firmware.version).toEqual([3, 0, 0]);
        expect(result.isRequired).toEqual(true);
    });

    it('bootloader mode, middle fw is required', () => {
        const result = rollout.getInfoSync(
            {
                bootloader_mode: true,
                major_version: 1,
                minor_version: 0,
                patch_version: 0,
            },
            [
                {
                    version: [3, 0, 0],
                    min_firmware_version: [1, 0, 0],
                    bootloader_version: [3, 0, 0],
                    min_bootloader_version: [1, 0, 0],
                },
                {
                    version: [2, 0, 0],
                    min_firmware_version: [1, 0, 0],
                    bootloader_version: [3, 0, 0],
                    min_bootloader_version: [1, 0, 0],
                    required: true,
                },
                {
                    version: [1, 0, 0],
                    min_firmware_version: [1, 0, 0],
                    bootloader_version: [3, 0, 0],
                    min_bootloader_version: [1, 0, 0],
                },
            ]
        );
        expect(result.firmware.version).toEqual([3, 0, 0]);
        expect(result.isRequired).toEqual(true);
    });

    it('bootloader mode, already installed fw is required', () => {
        const result = rollout.getInfoSync(
            {
                bootloader_mode: true,
                major_version: 2,
                minor_version: 0,
                patch_version: 0,
            },
            [
                {
                    version: [3, 0, 0],
                    min_firmware_version: [1, 0, 0],
                    bootloader_version: [3, 0, 0],
                    min_bootloader_version: [1, 0, 0],
                },
                {
                    version: [2, 0, 0],
                    min_firmware_version: [1, 0, 0],
                    bootloader_version: [2, 0, 0],
                    min_bootloader_version: [1, 0, 0],
                },
                {
                    version: [1, 0, 0],
                    min_firmware_version: [1, 0, 0],
                    bootloader_version: [1, 0, 0],
                    min_bootloader_version: [1, 0, 0],
                    required: true,
                },
            ]
        );

        expect(result.firmware.version).toEqual([3, 0, 0]);
        expect(result.isRequired).toEqual(false);
    });

    it('normal mode, newest fw is required', () => {
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
                    min_firmware_version: [1, 0, 0],
                    bootloader_version: [3, 0, 0],
                    min_bootloader_version: [1, 0, 0],
                    required: true,
                },
                {
                    version: [2, 0, 0],
                    min_firmware_version: [1, 0, 0],
                    bootloader_version: [3, 0, 0],
                    min_bootloader_version: [1, 0, 0],
                },
            ]
        );

        expect(result.firmware.version).toEqual([3, 0, 0]);
        expect(result.isRequired).toEqual(true);
    });

    it('normal mode, middle fw is required', () => {
        const result = rollout.getInfoSync(
            {
                bootloader_mode: false,
                major_version: 1,
                minor_version: 0,
                patch_version: 0,
            },
            [
                {
                    version: [3, 0, 0],
                    min_firmware_version: [1, 0, 0],
                    bootloader_version: [3, 0, 0],
                    min_bootloader_version: [1, 0, 0],
                },
                {
                    version: [2, 0, 0],
                    min_firmware_version: [1, 0, 0],
                    bootloader_version: [3, 0, 0],
                    min_bootloader_version: [1, 0, 0],
                    required: true,
                },
                {
                    version: [1, 0, 0],
                    min_firmware_version: [1, 0, 0],
                    bootloader_version: [3, 0, 0],
                    min_bootloader_version: [1, 0, 0],
                },
            ]
        );

        expect(result.firmware.version).toEqual([3, 0, 0]);
        expect(result.isRequired).toEqual(true);
    });

    it('normal mode, already installed fw is required', () => {
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
                    min_firmware_version: [1, 0, 0],
                    bootloader_version: [3, 0, 0],
                    min_bootloader_version: [1, 0, 0],
                },
                {
                    version: [2, 0, 0],
                    min_firmware_version: [1, 0, 0],
                    bootloader_version: [2, 0, 0],
                    min_bootloader_version: [1, 0, 0],
                },
                {
                    version: [1, 0, 0],
                    min_firmware_version: [1, 0, 0],
                    bootloader_version: [1, 0, 0],
                    min_bootloader_version: [1, 0, 0],
                    required: true,
                },
            ]
        );

        expect(result.firmware.version).toEqual([3, 0, 0]);
        expect(result.isRequired).toEqual(false);
    });
});
