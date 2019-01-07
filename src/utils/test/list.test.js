import { filterSafeListByBootloader, filterSafeListByFirmware } from '../list';

describe('List Utils', () => {
    describe('filterSafeListByBootloader()', () => {
        it('no items with min_bootloader_version higher then actual bootloader version', () => {
            const result = filterSafeListByBootloader({
                releasesList: [
                    { version: [3, 0, 0], min_bootloader_version: [3, 0, 0], bootloader_version: [4, 0, 0] },
                    { version: [2, 0, 0], min_bootloader_version: [2, 0, 0], bootloader_version: [3, 0, 0] },
                    { version: [1, 0, 0], min_bootloader_version: [1, 0, 0], bootloader_version: [2, 0, 0] },
                ],
                bootloaderVersion: [1, 0, 0],
            });

            expect(result).toEqual([
                { version: [1, 0, 0], min_bootloader_version: [1, 0, 0], bootloader_version: [2, 0, 0] },
            ]);
        });

        it('no items with bootloader version lower then actual bootloader version', () => {
            const result = filterSafeListByBootloader({
                releasesList: [
                    { version: [4, 0, 0], min_bootloader_version: [5, 0, 0], bootloader_version: [5, 0, 0] },
                    { version: [3, 0, 0], min_bootloader_version: [3, 0, 0], bootloader_version: [4, 0, 0] },
                    { version: [2, 0, 0], min_bootloader_version: [2, 0, 0], bootloader_version: [3, 0, 0] },
                    { version: [1, 0, 0], min_bootloader_version: [1, 0, 0], bootloader_version: [2, 0, 0] },
                ],
                bootloaderVersion: [4, 0, 0],
            });

            expect(result).toEqual([{
                bootloader_version: [4, 0, 0],
                min_bootloader_version: [3, 0, 0],
                version: [3, 0, 0],
            }]);
        });
    });

    describe('filterSafeListByFirmware()', () => {
        it('no items with min_firmware_version higher then actual firmwareVersion', () => {
            const result = filterSafeListByFirmware({
                releasesList: [
                    { version: [3, 0, 0], min_firmware_version: [3, 0, 0] },
                    { version: [2, 0, 0], min_firmware_version: [1, 0, 0] },
                    { version: [1, 0, 0], min_firmware_version: [1, 0, 0] },
                ],
                firmwareVersion: [1, 0, 0],
            });

            expect(result).toEqual([
                { version: [2, 0, 0], min_firmware_version: [1, 0, 0] },
            ]);
        });
    });
});
