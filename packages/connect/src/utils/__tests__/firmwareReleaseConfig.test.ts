import { getOnlyLocalFirmwareReleaseConfig } from '../firmwareReleaseConfigUtils';

const releasesJwsLocal = require('@trezor/connect-data/files/firmware/release/releases.v1.json');

describe('getOnlyLocalFirmwareReleaseConfig returns releases signed file correctly', () => {
    it('should return local JWS', () => {
        const { config } = getOnlyLocalFirmwareReleaseConfig();
        expect(config).toEqual(releasesJwsLocal);
    });
});
