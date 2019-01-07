import { getLatestSafeFw } from 'main';
import { mockRandom } from 'jest-mock-random';

describe('getLatestSafeFw', () => {
    describe('rollout', () => {
        it('bootloader mode - safe - probability not specified, skip rollout', () => {
            const result = getLatestSafeFw({
                releasesList: [{
                    version: [3, 0, 0], min_bootloader_version: [2, 0, 0], bootloader_version: [3, 0, 0], rollout: 0.2,
                }, {
                    version: [2, 0, 0], min_bootloader_version: [2, 0, 0], bootloader_version: [2, 0, 0],
                }],
                isInBootloader: true,
                bootloaderVersion: [2, 0, 0],
            });

            expect(result.firmware.version).toEqual([3, 0, 0]);
        });

        it('bootloader mode - safe - not in probability', () => {
            const result = getLatestSafeFw({
                releasesList: [
                    {
                        version: [3, 0, 0], min_bootloader_version: [2, 0, 0], bootloaderVersion: [3, 0, 0], rollout: 0.2,
                    }, {
                        version: [2, 0, 0], min_bootloader_version: [2, 0, 0], bootloaderVersion: [2, 0, 0],
                    },
                ],
                isInBootloader: true,
                bootloaderVersion: [2, 0, 0],
            }, 0.5);

            expect(result.firmware.version).toEqual([2, 0, 0]);
            expect(result.isLatest).toEqual(false);
        });

        it('bootloader mode - safe - within probability', () => {
            const result = getLatestSafeFw({
                releasesList: [
                    {
                        version: [3, 0, 0], min_bootloader_version: [2, 0, 0], bootloaderVersion: [3, 0, 0], rollout: 0.2,
                    },
                    {
                        version: [2, 0, 0], min_bootloader_version: [2, 0, 0], bootloaderVersion: [2, 0, 0],
                    },
                ],
                isInBootloader: true,
                bootloaderVersion: [2, 0, 0],
            }, 0.1);

            expect(result.firmware.version).toEqual([3, 0, 0]);
        });

        it('normal mode - safe - probability not specified, skip rollout', () => {
            mockRandom(0.512862123418226);
            const result = getLatestSafeFw({
                releasesList: [
                    {
                        version: [3, 0, 0],
                        min_firmware_version: [1, 0, 0],
                        min_bootloader_version: [1, 0, 0],
                        bootloaderVersion: [3, 0, 0],
                        rollout: 0.2,
                    }, {
                        version: [2, 0, 0],
                        min_firmware_version: [1, 0, 0],
                        min_bootloader_version: [1, 0, 0],
                        bootloaderVersion: [2, 0, 0],
                    },
                ],
                isInBootloader: false,
                firmwareVersion: [2, 0, 0],
            });

            expect(result.firmware.version).toEqual([3, 0, 0]);
        });

        it('normal mode - safe - not in probability', () => {
            mockRandom(0.512862123418226);
            const result = getLatestSafeFw({
                releasesList: [
                    {
                        version: [3, 0, 0],
                        min_firmware_version: [1, 0, 0],
                        min_bootloader_version: [1, 0, 0],
                        bootloaderVersion: [3, 0, 0],
                        rollout: 0.2,
                    }, {
                        version: [2, 0, 0],
                        min_firmware_version: [1, 0, 0],
                        min_bootloader_version: [1, 0, 0],
                        bootloaderVersion: [2, 0, 0],
                    },
                ],
                isInBootloader: false,
                firmwareVersion: [2, 0, 0],
            }, 0.5);

            expect(result).toEqual(null);
        });

        it('normal mode - safe - within probability', () => {
            mockRandom(0.512862123418226);
            const result = getLatestSafeFw({
                releasesList: [
                    {
                        version: [3, 0, 0],
                        min_firmware_version: [1, 0, 0],
                        min_bootloader_version: [1, 0, 0],
                        bootloaderVersion: [3, 0, 0],
                        rollout: 0.2,
                    }, {
                        version: [2, 0, 0],
                        min_firmware_version: [1, 0, 0],
                        min_bootloader_version: [1, 0, 0],
                        bootloaderVersion: [2, 0, 0],
                    },
                ],
                isInBootloader: false,
                firmwareVersion: [2, 0, 0],
            }, 0.1);

            expect(result.firmware.version).toEqual([3, 0, 0]);
        });
    });
});
