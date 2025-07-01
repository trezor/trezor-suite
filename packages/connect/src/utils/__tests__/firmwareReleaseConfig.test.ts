import { decode } from 'jws';

import { jws as releasesJwsLocal } from '../../../../connect-common/files/firmware/release/releases.v1';
import { getFirmwareReleaseConfig } from '../firmwareReleaseConfigUtils';

describe('getFirmwareReleaseConfig returns releases signed file correctly', () => {
    it('should return local JWS', async () => {
        const result = await getFirmwareReleaseConfig();
        const decodedJws = decode(releasesJwsLocal);
        const parsedJws = JSON.parse(decodedJws?.payload);
        expect(result).toEqual(parsedJws);
    });
});
