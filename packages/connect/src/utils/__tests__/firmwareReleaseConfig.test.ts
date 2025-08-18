import { decode } from 'jws';

import { getOnlyLocalFirmwareReleaseConfig } from '../firmwareReleaseConfigUtils';

const releasesJwsLocal = require('@trezor/connect-common/files/firmware/release/releases.v1.json');

describe('getOnlyLocalFirmwareReleaseConfig returns releases signed file correctly', () => {
    it('should return local JWS', () => {
        const { config } = getOnlyLocalFirmwareReleaseConfig();
        const decodedJws = decode(releasesJwsLocal.jws);
        const parsedJws = JSON.parse(decodedJws?.payload);
        expect(config).toEqual(parsedJws);
    });
});
