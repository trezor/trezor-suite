import Rollout from '../index';

describe('getInfoSync() test rollout', () => {
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
    it('bootloader mode - safe - probability not specified, skip rollout', () => {
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
                    min_bootloader_version: [2, 0, 0],
                    bootloader_version: [3, 0, 0],
                    rollout: 0.2,
                },
                {
                    version: [2, 0, 0],
                    min_bootloader_version: [2, 0, 0],
                    bootloader_version: [2, 0, 0],
                },
            ]
        );
        expect(result.firmware.version).toEqual([3, 0, 0]);
    });

    it('bootloader mode - safe - not in probability', () => {
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
                    min_bootloader_version: [2, 0, 0],
                    bootloader_version: [3, 0, 0],
                    rollout: 0.2,
                },
                {
                    version: [2, 0, 0],
                    min_bootloader_version: [2, 0, 0],
                    bootloader_version: [2, 0, 0],
                },
            ],
            0.5
        );

        expect(result.firmware.version).toEqual([2, 0, 0]);
        expect(result.isLatest).toEqual(false);
    });

    it('bootloader mode - safe - within probability', () => {
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
                    min_bootloader_version: [2, 0, 0],
                    bootloader_version: [3, 0, 0],
                    rollout: 0.2,
                },
                {
                    version: [2, 0, 0],
                    min_bootloader_version: [2, 0, 0],
                    bootloader_version: [2, 0, 0],
                },
            ],
            0.1
        );
        expect(result.firmware.version).toEqual([3, 0, 0]);
    });

    it('normal mode - safe - score not specified, skip rollout', () => {
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
                    min_bootloader_version: [1, 0, 0],
                    bootloader_version: [3, 0, 0],
                    rollout: 0.2,
                },
                {
                    version: [2, 0, 0],
                    min_firmware_version: [1, 0, 0],
                    min_bootloader_version: [1, 0, 0],
                    bootloader_version: [2, 0, 0],
                },
            ]
        );
        expect(result.firmware.version).toEqual([3, 0, 0]);
    });

    it('normal mode - safe - not in probability', () => {
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
                    min_bootloader_version: [1, 0, 0],
                    bootloader_version: [3, 0, 0],
                    rollout: 0.2,
                },
                {
                    version: [2, 0, 0],
                    min_firmware_version: [1, 0, 0],
                    min_bootloader_version: [1, 0, 0],
                    bootloader_version: [2, 0, 0],
                },
            ],
            0.5
        );

        expect(result).toEqual(null);
    });

    it('normal mode - safe - within probability', () => {
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
                    min_bootloader_version: [1, 0, 0],
                    bootloader_version: [3, 0, 0],
                    rollout: 0.2,
                },
                {
                    version: [2, 0, 0],
                    min_firmware_version: [1, 0, 0],
                    min_bootloader_version: [1, 0, 0],
                    bootloader_version: [2, 0, 0],
                },
            ],
            0.1
        );
        expect(result.firmware.version).toEqual([3, 0, 0]);
    });
});
