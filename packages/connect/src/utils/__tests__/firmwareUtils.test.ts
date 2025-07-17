import { firmwareAssets } from '@trezor/connect-common/files/firmware';

import { findBestCompatibleRelease, isStrictFeatures } from '../firmwareUtils';

describe('firmwareUtils', () => {
    describe('isStrictFeatures()', () => {
        it('fail on not matching pattern', () => {
            expect(
                // @ts-expect-error
                isStrictFeatures({ foo: 'bar' }),
            ).toEqual(false);
        });
    });
    describe('findBestCompatibleRelease()', () => {
        describe('handling invalid input', () => {
            it('should return undefined for an empty data object', () => {
                expect(
                    findBestCompatibleRelease({}, [1, 0, 0], 'min_firmware_version'),
                ).toBeUndefined();
            });
        });

        describe('with checkProperty = "min_firmware_version"', () => {
            it('should return the newest compatible release', () => {
                const compatibleRelease = findBestCompatibleRelease(
                    firmwareAssets.t2t1.universal,
                    [2, 0, 7],
                    'min_firmware_version',
                );
                expect(compatibleRelease?.version).toEqual([2, 1, 1]);
            });

            it('should return undefined if no release meets the min firmware version', () => {
                expect(
                    findBestCompatibleRelease(
                        firmwareAssets.t1b1.universal,
                        [0, 8, 5],
                        'min_firmware_version',
                    ),
                ).toBeUndefined();
            });
        });

        describe('with checkProperty = "min_bootloader_version"', () => {
            it('should return undefined for an empty data object', () => {
                expect(
                    findBestCompatibleRelease({}, [1, 0, 0], 'min_bootloader_version'),
                ).toBeUndefined();
            });
            it('should return the correct release based on bootloader version', () => {
                const compatibleRelease = findBestCompatibleRelease(
                    firmwareAssets.t1b1.universal,
                    [1, 6, 3],
                    'min_bootloader_version',
                );
                expect(compatibleRelease?.version).toEqual([1, 11, 2]);
            });

            it('should return undefined if no release meets the min bootloader version', () => {
                expect(
                    findBestCompatibleRelease(
                        firmwareAssets.t1b1.universal,
                        [0, 8, 5],
                        'min_bootloader_version',
                    ),
                ).toBeUndefined();
            });
        });
    });
});
