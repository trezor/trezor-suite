import { getLatestSafeFw } from 'main';

import T2MOCK from 'test/mocks/T2.json';

describe('Get latest safe firmware version for T2 in bootloader mode', () => {
    it('test bootloader [10, 10, 10]', () => {
        const TEST_MOCK = T2MOCK;
        const result = getLatestSafeFw({
            releasesList: TEST_MOCK,
            isInBootloader: true,
            firmwareVersion: null,
            bootloaderVersion: [10, 10, 10],
        });

        expect(result).toEqual([]);
    });

    it('test bootloader [2, 0, 0]', () => {
        const TEST_MOCK = T2MOCK;
        const result = getLatestSafeFw({
            releasesList: TEST_MOCK,
            isInBootloader: true,
            firmwareVersion: null,
            bootloaderVersion: [2, 0, 0],
        });

        expect(result).toEqual([]);
    });

    it('test bootloader [1, 0, 0]', () => {
        const TEST_MOCK = T2MOCK;
        const result = getLatestSafeFw({
            releasesList: TEST_MOCK,
            isInBootloader: true,
            firmwareVersion: null,
            bootloaderVersion: [1, 0, 0],
        });

        expect(result.version).toEqual([2, 0, 5]);
    });
});
