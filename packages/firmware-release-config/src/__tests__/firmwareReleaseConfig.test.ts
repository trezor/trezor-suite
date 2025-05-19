import { jws as releasesJwsLocal } from '../../files/releases.v1';
import { getFirmwareReleaseConfig } from '../index';

describe('getFirmwareReleaseConfig returns releases signed file correctly', () => {
    it('should return local JWS', async () => {
        const result = await getFirmwareReleaseConfig();
        expect(result).toEqual({
            releasesJws: releasesJwsLocal,
            isRemote: false,
        });
    });
});
