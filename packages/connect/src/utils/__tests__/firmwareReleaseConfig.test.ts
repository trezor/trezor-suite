import { decode } from 'jws';

import { getFirmwareReleaseConfig } from '../firmwareReleaseConfigUtils';

const releasesJwsLocal = require('@trezor/connect-common/files/firmware/release/releases.v1.json');

describe('getFirmwareReleaseConfig returns releases signed file correctly', () => {
    it('should return local JWS', async () => {
        const result = await getFirmwareReleaseConfig();
        const decodedJws = decode(releasesJwsLocal.jws);
        const parsedJws = JSON.parse(decodedJws?.payload);
        expect(result).toEqual(parsedJws);
    });
});
