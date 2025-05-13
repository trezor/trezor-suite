import releasesJwsLocal from '../../releases/releases.v1.json';
import { getFirmwareReleaseConfig } from '../index';

describe('getFirmwareReleaseConfig returns releases signed file correctly', () => {
    it('should return local JWS', async () => {
        const result = await getFirmwareReleaseConfig();
        expect(result).toEqual(releasesJwsLocal);
    });
});
