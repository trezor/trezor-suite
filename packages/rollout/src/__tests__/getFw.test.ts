import Rollout from '../index';

jest.mock('../utils/fetch');

describe('getFw()', () => {
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

    it('should return firmware', async () => {
        let result = await rollout.getFw({
            major_version: 1,
            minor_version: 7,
            patch_version: 0,
            bootloader_mode: false,
        });
        expect(result).toBeDefined();

        // call again to test branch where releasesList is cached
        result = await rollout.getFw({
            major_version: 1,
            minor_version: 7,
            patch_version: 0,
            bootloader_mode: false,
        });
        expect(result).toBeDefined();
    });

    it('if no matching fw found for provided features, should return null', async () => {
        const result = await rollout.getFw({
            major_version: 1,
            minor_version: 17,
            patch_version: 0,
            bootloader_mode: false,
        });
        expect(result).toEqual(null);
    });
});
