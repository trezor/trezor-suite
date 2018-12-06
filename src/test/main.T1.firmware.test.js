import { getLatestSafeFw } from 'main';

import T1MOCK from 'test/mocks/T1.json';

describe('Get latest safe firmware version for T1 in normal mode', () => {
    it('test firmware [10, 10, 10]', () => {
        const TEST_MOCK = T1MOCK;
        const result = getLatestSafeFw({
            releasesList: TEST_MOCK,
            isInBootloader: false,
            firmwareVersion: [10, 10, 10],
            bootloaderVersion: null,
        });

        expect(result).toEqual([]);
    });

    it('test firmware [1, 6, 2]', () => {
        const TEST_MOCK = T1MOCK;
        const result = getLatestSafeFw({
            releasesList: TEST_MOCK,
            isInBootloader: false,
            firmwareVersion: [1, 6, 2],
            bootloaderVersion: null,
        });

        expect(result).toEqual([]);
    });

    it('test firmware [1, 0, 0]', () => {
        const TEST_MOCK = T1MOCK;
        const result = getLatestSafeFw({
            releasesList: TEST_MOCK,
            isInBootloader: false,
            firmwareVersion: [1, 0, 0],
            bootloaderVersion: null,
        });

        expect(result.version).toEqual([1, 7, 1]);
    });
});
