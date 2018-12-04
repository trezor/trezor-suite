import { getLatestSafeFw } from 'main';
import versionUtils from 'utils/version';

import T1MOCK from 'test/mocks/T1.json';
// import T2MOCK from 'test/mocks/T2.json';

const getItemFromList = (list, version) => list.find(item => versionUtils.toString(item.version) === versionUtils.toString(version));

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
});
