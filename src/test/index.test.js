import { getLatestSafeFw } from '../index';

describe('get latest safe firmware version for TREZOR 1', () => {
    it('trezor without firmware', () => {
        const result = getLatestSafeFw({
            releasesList: [
                {
                    required: false,
                    version: [1, 6, 2],
                    bootloader_version: [1, 5, 0],
                    min_bridge_version: [1, 1, 5],
                    min_firmware_version: [1, 0, 0],
                    min_bootloader_version: [1, 0, 0],
                    url: 'data/firmware/1/trezor-1.6.2.bin.hex',
                },
                {
                    required: true,
                    version: [1, 6, 1],
                    bootloader_version: [1, 4, 0],
                    min_bridge_version: [1, 1, 5],
                    min_firmware_version: [1, 0, 0],
                    min_bootloader_version: [1, 0, 0],
                    url: 'data/firmware/1/trezor-1.6.1.bin.hex',
                },
                {
                    required: false,
                    version: [1, 6, 0],
                    min_bridge_version: [1, 1, 5],
                    min_firmware_version: [1, 0, 0],
                    min_bootloader_version: [1, 0, 0],
                    url: 'data/firmware/1/trezor-1.6.0.bin.hex',
                },
            ],
            isBootloader: true,
            firmwareVersion: [1, 2, 3],
            bootloaderVersion: [1, 2, 3],
            score: null,
        });

        expect(result).toEqual({
            required: false,
            version: [1, 6, 2],
            isBootloader: true,
            bootloader_version: [1, 5, 0],
            min_bridge_version: [1, 1, 5],
            min_firmware_version: [1, 0, 0],
            min_bootloader_version: [1, 0, 0],
            url: 'data/firmware/1/trezor-1.6.2.bin.hex',
        });
    });
});

// score
