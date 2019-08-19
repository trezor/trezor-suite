import Rollout from '../index';

jest.mock('../utils/fetch');

describe('getInfoSync() in bootloader', () => {
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

    it('actual bootloader version is higher then highest bootloader version in list', () => {
        const result = rollout.getInfoSync(
            {
                bootloader_mode: true,
                major_version: 10,
                minor_version: 0,
                patch_version: 0,
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

    it('actual bootloader version is lower then lowest bootloader version in list and is lower than second lowest min_bootloader_version in list', () => {
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
        expect(result).toEqual({
            firmware: {
                version: [1, 0, 0],
                min_bootloader_version: [1, 0, 0],
                bootloader_version: [2, 0, 0],
            },
            isLatest: false,
            isRequired: false,
            isNewer: null,
        });
    });

    it('cant tell if offered release is newer than actual', () => {
        const result = rollout.getInfoSync(
            {
                bootloader_mode: true,
                major_version: 3,
                minor_version: 0,
                patch_version: 0,
            },
            [
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
            ]
        );
        expect(result.firmware.version).toEqual([3, 0, 0]);
        expect(result.isNewer).toEqual(null);
    });

    it('actual bootloader version is lower then lowest bootloader version in list and is higher than lowest min_bootloader_version in list', () => {
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
        expect(result.firmware.version).toEqual([2, 0, 0]);
        expect(result.isLatest).toEqual(false);
        expect(result.isRequired).toEqual(false);
    });

    it('test bootloader multiple versions', () => {
        const result = rollout.getInfoSync(
            {
                bootloader_mode: true,
                major_version: 2,
                minor_version: 0,
                patch_version: 0,
            },
            [
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
            ]
        );
        expect(result.firmware.version).toEqual([3, 0, 0]);
        expect(result.isLatest).toEqual(false);
        expect(result.isRequired).toEqual(false);
    });

    it('test bootloader lower version', () => {
        const result = rollout.getInfoSync(
            {
                bootloader_mode: true,
                major_version: 0,
                minor_version: 5,
                patch_version: 0,
            },
            [
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
            ]
        );

        expect(result).toEqual(null);
    });
});
