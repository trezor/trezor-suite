
import { getLatestSafeFw } from 'main';
import { getVersionOfItem } from 'utils/list';

import T1MOCK from 'test/mocks/T1.json';

describe('Get latest safe firmware', () => {
    // no firmware at all
    it('NO firmware in bootloader [1, 0, 0]', () => {
        const TEST_MOCK = T1MOCK;
        const result = getLatestSafeFw({
            releasesList: TEST_MOCK,
            isInBootloader: true,
            firmwareVersion: null,
            bootloaderVersion: [1, 6, 0],
        });

        expect(result.version).toEqual(getVersionOfItem(TEST_MOCK, [1, 7, 1]));
    });

    it('NO firmware in bootloader [1, 5, 1]', () => {
        const TEST_MOCK = T1MOCK;
        const result = getLatestSafeFw({
            releasesList: TEST_MOCK,
            isInBootloader: true,
            firmwareVersion: null,
            bootloaderVersion: [1, 5, 1],
        });

        expect(result.version).toEqual(getVersionOfItem(TEST_MOCK, [1, 6, 3]));
    });

    it('NO firmware in bootloader [1, 4, 0]', () => {
        const TEST_MOCK = T1MOCK;
        const result = getLatestSafeFw({
            releasesList: TEST_MOCK,
            isInBootloader: true,
            firmwareVersion: null,
            bootloaderVersion: [1, 4, 0],
        });

        expect(result.version).toEqual(getVersionOfItem(TEST_MOCK, [1, 6, 1]));
    });


    // bootloader

    it('bump firmware version from 1.3.6 to 1.4.0', () => {
        const TEST_MOCK = T1MOCK;
        const result = getLatestSafeFw({
            releasesList: TEST_MOCK,
            isInBootloader: true,
            firmwareVersion: null,
            bootloaderVersion: [1, 0, 0],
            score: null,
        });

        expect(result.version).toEqual(getVersionOfItem(TEST_MOCK, [1, 4, 0]));
    });


    // NOT bootloader

    it('bump firmware version from 1.6.3 to 1.7.1', () => {
        const TEST_MOCK = T1MOCK;
        const result = getLatestSafeFw({
            releasesList: TEST_MOCK,
            isBootloader: false,
            firmwareVersion: [1, 6, 3],
            bootloaderVersion: null,
            score: null,
        });

        expect(result.version).toEqual(getVersionOfItem(TEST_MOCK, [1, 7, 1]));
    });
});
