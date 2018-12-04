
import { getLatestSafeFw } from 'main';
import { getItemFromList } from 'utils/list';

import T1MOCK from 'test/mocks/T1.json';

describe('Get latest safe firmware', () => {
    it('bump firmware version from 1.6.3 to 1.7.1', () => {
        const TEST_MOCK = T1MOCK;
        const result = getLatestSafeFw({
            releasesList: TEST_MOCK,
            isBootloader: false,
            firmwareVersion: [1, 6, 3],
            bootloaderVersion: null,
            score: null,
        });

        expect(result).toEqual(getItemFromList(TEST_MOCK, [1, 7, 1]));
    });

    it('bump firmware version from 1.3.6 to 1.4.0', () => {
        const TEST_MOCK = T1MOCK;
        const result = getLatestSafeFw({
            releasesList: TEST_MOCK,
            isBootloader: false,
            firmwareVersion: [1, 3, 6],
            bootloaderVersion: null,
            score: null,
        });

        expect(result).toEqual(getItemFromList(TEST_MOCK, [1, 4, 0]));
    });
});
