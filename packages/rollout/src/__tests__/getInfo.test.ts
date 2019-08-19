import Rollout from '../index';

jest.mock('../utils/fetch');

describe('getInfo()', () => {
    let rollout;
    beforeEach(() => {
        rollout = Rollout({
            baseUrl: 'foo',
            releasesListsPaths: {
                1: 'doest matter, is mocked',
                2: 'indeed',
            },
        });
    });
    it('should return info only. providing releasesListUrl as param only', async () => {
        const result = await rollout.getInfo({
            major_version: 1,
            minor_version: 7,
            patch_version: 0,
            bootloader_mode: false,
        });
        expect(result).toBeDefined();
        expect(result.firmware.version).toEqual([1, 8, 1]);
    });
});
