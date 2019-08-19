import Rollout from '../index';

describe('getInfoSync() for fresh device', () => {
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
    it('it should respect bootloader rules and update incrementally by min_bootloader_version field', () => {
        const result = rollout.getInfoSync(
            {
                bootloader_mode: true,
                major_version: 1,
                minor_version: 0,
                patch_version: 0,
                firmware_present: false,
            },
            [
                {
                    version: [3, 0, 0],
                    min_bootloader_version: [2, 0, 0],
                    bootloader_version: [4, 0, 0],
                },
                {
                    version: [2, 0, 0],
                    min_bootloader_version: [1, 0, 0],
                    bootloader_version: [2, 0, 0],
                },
                {
                    version: [1, 0, 0],
                    min_bootloader_version: [1, 0, 0],
                    bootloader_version: [1, 0, 0],
                },
            ]
        );

        expect(result.firmware.version).toEqual([2, 0, 0]);
        expect(result.isLatest).toEqual(false);
        expect(result.isRequired).toEqual(true);
    });

    it('it should respect bootloader rules and not allow downgrade', () => {
        const result = rollout.getInfoSync(
            {
                bootloader_mode: true,
                major_version: 5,
                minor_version: 0,
                patch_version: 0,
                firmware_present: true,
            },
            [
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
            ]
        );

        expect(result).toEqual(null);
    });
});
