import Rollout from '../index';

jest.mock('../utils/fetch');

describe('getFw() modifications of fw', () => {
    let rollout;
    beforeEach(() => {
        rollout = Rollout({
            baseUrl: 'foo',
            releasesListsPaths: {
                1: 'test-1',
                2: 'test-2',
            },
        });
    });
    it('firmware installed on bootloader 1.8.0 should be return modified', async () => {
        const result = await rollout.getFw({
            major_version: 1,
            minor_version: 8,
            patch_version: 0,
            bootloader_mode: false,
        });
        expect(result.byteLength).toEqual(256);
    });

    it('some of the firmwares should be return unmodifed', async () => {
        const result = await rollout.getFw({
            major_version: 1,
            minor_version: 6,
            patch_version: 3,
            bootloader_mode: false,
        });

        expect(result.byteLength).toEqual(512);
    });

    it('currently, no modification should be done for model T', async () => {
        const result = await rollout.getFw({
            major_version: 2,
            minor_version: 0,
            patch_version: 5,
            bootloader_mode: false,
        });
        expect(result.byteLength).toEqual(512);
    });
});
