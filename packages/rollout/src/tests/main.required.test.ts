import { getLatestSafeFw } from '../index';

describe('getLatestSafeFw', () => {
    describe('required', () => {
        it('bootloader mode, newest fw is required', () => {
            const result = getLatestSafeFw({
                releasesList: [
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
                ],
                isInBootloader: true,
                bootloaderVersion: [2, 0, 0],
            });

            if (result) {
                expect(result.firmware.version).toEqual([3, 0, 0]);
                expect(result.isRequired).toEqual(true);
            } else {
                throw new Error('I have failed you');
            }
        });

        it('bootloader mode, middle fw is required', () => {
            const result = getLatestSafeFw({
                releasesList: [
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
                ],
                isInBootloader: true,
                bootloaderVersion: [1, 0, 0],
            });

            if (result) {
                expect(result.firmware.version).toEqual([3, 0, 0]);
                expect(result.isRequired).toEqual(true);
            } else {
                throw new Error('I have failed you');
            }
        });

        it('bootloader mode, already installed fw is required', () => {
            const result = getLatestSafeFw({
                releasesList: [
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
                ],
                isInBootloader: true,
                bootloaderVersion: [2, 0, 0],
            });

            if (result) {
                expect(result.firmware.version).toEqual([3, 0, 0]);
                expect(result.isRequired).toEqual(false);
            } else {
                throw new Error('I have failed you');
            }
        });

        it('normal mode, newest fw is required', () => {
            const result = getLatestSafeFw({
                releasesList: [
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
                ],
                isInBootloader: false,
                firmwareVersion: [2, 0, 0],
            });

            if (result) {
                expect(result.firmware.version).toEqual([3, 0, 0]);
                expect(result.isRequired).toEqual(true);
            } else {
                throw new Error('I have failed you');
            }
        });

        it('normal mode, middle fw is required', () => {
            const result = getLatestSafeFw({
                releasesList: [
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
                ],
                isInBootloader: false,
                firmwareVersion: [1, 0, 0],
            });

            if (result) {
                expect(result.firmware.version).toEqual([3, 0, 0]);
                expect(result.isRequired).toEqual(true);
            } else {
                throw new Error('I have failed you');
            }
        });

        it('normal mode, already installed fw is required', () => {
            const result = getLatestSafeFw({
                releasesList: [
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
                ],
                isInBootloader: false,
                firmwareVersion: [2, 0, 0],
            });

            if (result) {
                expect(result.firmware.version).toEqual([3, 0, 0]);
                expect(result.isRequired).toEqual(false);
            } else {
                throw new Error('I have failed you');
            }
        });
    });
});
