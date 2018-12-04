
import { getLatestSafeFw } from 'main';
import { getItemByVersion } from 'utils/list';

import T2MOCK from 'test/mocks/T2.json';

describe('Get latest safe firmware', () => {
    it('bump firmware version from 1.3.6 to 1.4.0', () => {
        const TEST_MOCK = T2MOCK;
        const result = getLatestSafeFw({
            releasesList: TEST_MOCK,
            isBootloader: false,
            firmwareVersion: [1, 3, 6],
            bootloaderVersion: null,
            score: null,
        });

        expect(result).toEqual(getItemByVersion(TEST_MOCK, [1, 4, 0]));
    });
});
