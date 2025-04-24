import { jws as releasesJwsLocal } from '../../files/releases.v1';
import { getReleasesJws } from '../index';

describe('getReleasesJws returns releases signed file', () => {
    it('should return local JWS', async () => {
        const result = await getReleasesJws();
        expect(result).toEqual({
            releasesJws: releasesJwsLocal,
            isRemote: false,
        });
    });
});
