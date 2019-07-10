import { getLatestSafeFw } from '../index';

describe('getLatestSafeFw', () => {
    describe('fresh device (no firmware)', () => {
        it('it should respect bootloader rules and update incrementally by min_bootloader_version field', () => {
            const result = getLatestSafeFw({
                releasesList: [
                    {
                        version: [3, 0, 0],
                        min_bootloader_version: [3, 0, 0],
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
                ],
                isInBootloader: true,
                firmwareVersion: null,
                bootloaderVersion: [1, 0, 0],
                firmwarePresent: false,
            });

            if (result) {
                expect(result.firmware.version).toEqual([2, 0, 0]);
                expect(result.isLatest).toEqual(false);
                expect(result.isRequired).toEqual(true);
            } else {
                throw new Error('I have failed you');
            }
        });

        it('it should respect  bootloader rules and not allow downgrade', () => {
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
                firmwareVersion: null,
                bootloaderVersion: [5, 0, 0],
                firmwarePresent: false,
            });

            expect(result).toEqual(null);
        });
    });
});
