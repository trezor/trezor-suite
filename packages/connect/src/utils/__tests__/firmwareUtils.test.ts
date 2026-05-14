import { firmwareAssets } from '@trezor/connect-data';
import { versionUtils } from '@trezor/utils';

import { findBestCompatibleRelease, isStrictFeatures } from '../firmwareUtils';

describe('firmwareUtils', () => {
    describe('isStrictFeatures()', () => {
        it('errors on not matching pattern', () => {
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
                    findBestCompatibleRelease(
                        [],
                        { bootloaderVersion: null, firmwareVersion: [1, 0, 0] },
                        'min_firmware_version',
                    ),
                ).toBeUndefined();
            });
        });

        describe('with checkProperty = "min_firmware_version"', () => {
            it('should return the newest compatible release', () => {
                const compatibleRelease = findBestCompatibleRelease(
                    Object.values(firmwareAssets.t2t1.universal),
                    { bootloaderVersion: null, firmwareVersion: [2, 0, 7] },
                    'min_firmware_version',
                );
                expect(compatibleRelease?.version).toEqual([2, 1, 1]);
            });

            it('should return undefined if no release meets the min firmware version', () => {
                expect(
                    findBestCompatibleRelease(
                        Object.values(firmwareAssets.t1b1.universal),
                        { bootloaderVersion: null, firmwareVersion: [0, 8, 5] },
                        'min_firmware_version',
                    ),
                ).toBeUndefined();
            });
        });

        describe('with checkProperty = "min_bootloader_version"', () => {
            it('should return undefined for an empty data object', () => {
                expect(
                    findBestCompatibleRelease(
                        [],
                        { bootloaderVersion: null, firmwareVersion: [1, 0, 0] },
                        'min_bootloader_version',
                    ),
                ).toBeUndefined();
            });
            it('should return the correct release based on bootloader version', () => {
                const compatibleRelease = findBestCompatibleRelease(
                    Object.values(firmwareAssets.t1b1.universal),
                    { bootloaderVersion: null, firmwareVersion: [1, 6, 3] },
                    'min_bootloader_version',
                );
                expect(compatibleRelease?.version).toEqual([1, 11, 2]);
            });

            it('should return undefined if no release meets the min bootloader version', () => {
                expect(
                    findBestCompatibleRelease(
                        Object.values(firmwareAssets.t1b1.universal),
                        { bootloaderVersion: null, firmwareVersion: [0, 8, 5] },
                        'min_bootloader_version',
                    ),
                ).toBeUndefined();
            });

            it('first release with bootloader equal to min_bootloader in lastest release should return latest release as compatible', () => {
                const [latestRelase] = Object.values(firmwareAssets.t3t1.universal).sort((a, b) =>
                    versionUtils.isNewer(b.version, a.version) ? 1 : -1,
                );

                const releasesAscendentOrder = Object.values(firmwareAssets.t3t1.universal).sort(
                    (a, b) => (versionUtils.isNewer(a.version, b.version) ? 1 : -1),
                );

                const latestReleaseMinBootloaderVersion = latestRelase.min_bootloader_version;

                const firstReleaseWithBootloaderCompatibleWithLatest = releasesAscendentOrder.find(
                    fw =>
                        versionUtils.isEqual(
                            fw.bootloader_version!,
                            latestReleaseMinBootloaderVersion,
                        ),
                );
                const comptabibleRelease = findBestCompatibleRelease(
                    Object.values(firmwareAssets.t3t1.universal),
                    {
                        bootloaderVersion:
                            firstReleaseWithBootloaderCompatibleWithLatest!.bootloader_version ??
                            null,
                        firmwareVersion: null,
                    },
                    'min_bootloader_version',
                );
                expect(comptabibleRelease?.version).toEqual(latestRelase.version);
            });
        });
    });
});
