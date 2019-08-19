import Rollout from '../index';

jest.mock('../utils/fetch');

describe('rollout', () => {
    it('should return rollout object', async () => {
        const instance = Rollout({
            baseUrl: 'foo',
            releasesListsPaths: {
                1: 'doest matter, is mocked',
                2: 'indeed',
            },
        });
        expect(instance).toHaveProperty('getInfoSync');
        expect(instance).toHaveProperty('getInfo');
        expect(instance).toHaveProperty('getFw');
    });
});
