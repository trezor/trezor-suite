import T1MOCK from './mocks/T1.json';
import T2MOCK from './mocks/T2.json';
import { getLatestSafeFw } from '../index';
import { toString } from '../utils/version';

const getItemFromList = (list, version) => list.find(item => toString(item.version) === toString(version));

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
