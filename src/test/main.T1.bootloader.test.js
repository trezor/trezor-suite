import { getLatestSafeFw } from 'main';

import T1MOCK from 'test/mocks/T1.json';

describe('Get latest safe firmware version for T1 in bootloader mode', () => {
    it('test bootloader [10, 10, 10]', () => {
        const TEST_MOCK = T1MOCK;
        const result = getLatestSafeFw({
            releasesList: TEST_MOCK,
            isInBootloader: true,
            firmwareVersion: null,
            bootloaderVersion: [10, 10, 10],
        });

        expect(result).toEqual([]);
    });

    it('test bootloader [1, 5, 0]', () => {
        const TEST_MOCK = T1MOCK;
        const result = getLatestSafeFw({
            releasesList: TEST_MOCK,
            isInBootloader: true,
            firmwareVersion: null,
            bootloaderVersion: [1, 5, 0],
        });

        expect(result).toEqual([]);
    });

    it('test bootloader [1, 0, 0]', () => {
        const TEST_MOCK = T1MOCK;
        const result = getLatestSafeFw({
            releasesList: TEST_MOCK,
            isInBootloader: true,
            firmwareVersion: null,
            bootloaderVersion: [1, 0, 0],
        });

        expect(result.version).toEqual([1, 7, 1]);
    });
});
