import { getLatestSafeFw } from '../index';

describe('getLatestSafeFw', () => {
    describe('rollout', () => {
        it('bootloader mode - safe - probability not specified, skip rollout', () => {
            const result = getLatestSafeFw({
                releasesList: [
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
                isInBootloader: true,
                bootloaderVersion: [2, 0, 0],
            });

            if (result) {
                expect(result.firmware.version).toEqual([3, 0, 0]);
            } else {
                throw new Error('I have failed you');
            }
        });

        it('bootloader mode - safe - not in probability', () => {
            const result = getLatestSafeFw(
                {
                    releasesList: [
                        {
                            version: [3, 0, 0],
                            min_bootloader_version: [2, 0, 0],
                            bootloaderVersion: [3, 0, 0],
                            rollout: 0.2,
                        },
                        {
                            version: [2, 0, 0],
                            min_bootloader_version: [2, 0, 0],
                            bootloaderVersion: [2, 0, 0],
                        },
                    ],
                    isInBootloader: true,
                    bootloaderVersion: [2, 0, 0],
                },
                0.5
            );

            if (result) {
                expect(result.firmware.version).toEqual([2, 0, 0]);
                expect(result.isLatest).toEqual(false);
            } else {
                throw new Error('I have failed you');
            }
        });

        it('bootloader mode - safe - within probability', () => {
            const result = getLatestSafeFw(
                {
                    releasesList: [
                        {
                            version: [3, 0, 0],
                            min_bootloader_version: [2, 0, 0],
                            bootloaderVersion: [3, 0, 0],
                            rollout: 0.2,
                        },
                        {
                            version: [2, 0, 0],
                            min_bootloader_version: [2, 0, 0],
                            bootloaderVersion: [2, 0, 0],
                        },
                    ],
                    isInBootloader: true,
                    bootloaderVersion: [2, 0, 0],
                },
                0.1
            );

            if (result) {
                expect(result.firmware.version).toEqual([3, 0, 0]);
            } else {
                throw new Error('I have failed you');
            }
        });

        it('normal mode - safe - score not specified, skip rollout', () => {
            const result = getLatestSafeFw({
                releasesList: [
                    {
                        version: [3, 0, 0],
                        min_firmware_version: [1, 0, 0],
                        min_bootloader_version: [1, 0, 0],
                        bootloaderVersion: [3, 0, 0],
                        rollout: 0.2,
                    },
                    {
                        version: [2, 0, 0],
                        min_firmware_version: [1, 0, 0],
                        min_bootloader_version: [1, 0, 0],
                        bootloaderVersion: [2, 0, 0],
                    },
                ],
                isInBootloader: false,
                firmwareVersion: [2, 0, 0],
            });

            if (result) {
                expect(result.firmware.version).toEqual([3, 0, 0]);
            } else {
                throw new Error('I have failed you');
            }
        });

        it('normal mode - safe - not in probability', () => {
            const result = getLatestSafeFw(
                {
                    releasesList: [
                        {
                            version: [3, 0, 0],
                            min_firmware_version: [1, 0, 0],
                            min_bootloader_version: [1, 0, 0],
                            bootloaderVersion: [3, 0, 0],
                            rollout: 0.2,
                        },
                        {
                            version: [2, 0, 0],
                            min_firmware_version: [1, 0, 0],
                            min_bootloader_version: [1, 0, 0],
                            bootloaderVersion: [2, 0, 0],
                        },
                    ],
                    isInBootloader: false,
                    firmwareVersion: [2, 0, 0],
                },
                0.5
            );

            expect(result).toEqual(null);
        });

        it('normal mode - safe - within probability', () => {
            const result = getLatestSafeFw(
                {
                    releasesList: [
                        {
                            version: [3, 0, 0],
                            min_firmware_version: [1, 0, 0],
                            min_bootloader_version: [1, 0, 0],
                            bootloaderVersion: [3, 0, 0],
                            rollout: 0.2,
                        },
                        {
                            version: [2, 0, 0],
                            min_firmware_version: [1, 0, 0],
                            min_bootloader_version: [1, 0, 0],
                            bootloaderVersion: [2, 0, 0],
                        },
                    ],
                    isInBootloader: false,
                    firmwareVersion: [2, 0, 0],
                },
                0.1
            );

            if (result) {
                expect(result.firmware.version).toEqual([3, 0, 0]);
            } else {
                throw new Error('I have failed you');
            }
        });
    });
});
