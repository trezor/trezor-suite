import Rollout from '../index';

jest.mock('../utils/fetch');

describe('getFw() modifications of fw', () => {
    let rollout;
    beforeEach(() => {
        rollout = Rollout({
            firmwareBaseUrl: 'foo',
            releasesListsPaths: {
                1: 'doest matter, is mocked',
                2: 'indeed',
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
});
