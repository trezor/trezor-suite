import { decode, verify } from 'jws';

import { FirmwareReleaseConfig } from '@trezor/device-utils';
import { getJWSPublicKey } from '@trezor/env-utils';

import { firmwareReleaseConfigAssets } from './assetUtils';

type FirmwareUpdateSource = 'production' | 'test-unsigned' | 'test-signed';

const JWS_SIGN_ALGORITHM = 'ES256';
const VERSION = 1;
const JWS_RELEASES_FILENAME_REMOTE = `releases.v${VERSION}.jws`;

export const RELEASES_URL_REMOTE_BASE = 'https://data.trezor.io/suite/firmware';
export const RELEASES_URL_REMOTE: Record<FirmwareUpdateSource, string> = {
    production: `${RELEASES_URL_REMOTE_BASE}/production/${JWS_RELEASES_FILENAME_REMOTE}`,
    'test-unsigned': `${RELEASES_URL_REMOTE_BASE}/unsigned/${JWS_RELEASES_FILENAME_REMOTE}`,
    'test-signed': `${RELEASES_URL_REMOTE_BASE}/signed/${JWS_RELEASES_FILENAME_REMOTE}`,
};

// Enable this for local development purposes:
// set to true to always fetch local JWS
// TODO: WIP: for now we are forcing local since it was not deployed yet.
const FORCE_LOCAL_JWS = true;

const getReleaseJWS = async (firmwareUpdateSource: FirmwareUpdateSource = 'production') => {
    if (FORCE_LOCAL_JWS) {
        return {
            releasesJws: firmwareReleaseConfigAssets.jws,
            isRemote: false,
        };
    }

    const remoteReleasesUrl = RELEASES_URL_REMOTE[firmwareUpdateSource];

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

        const response = await fetch(remoteReleasesUrl, {
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(response.statusText);
        }

        const releasesJws = await response.text();

        return {
            releasesJws,
            isRemote: true,
        };
    } catch (error) {
        console.error(`Fetching of remote JWS config failed: ${error}`);

        return {
            releasesJws: firmwareReleaseConfigAssets.jws,
            isRemote: false,
        };
    }
};

export const getFirmwareReleaseConfig = async () => {
    const { releasesJws, isRemote } = await getReleaseJWS();

    const decodedJws = decode(releasesJws);

    if (!decodedJws) {
        throw new Error('Decoding of releases failed.');
    }

    if (isRemote) {
        const decodedJwsLocal = decode(firmwareReleaseConfigAssets.jws);

        if (decodedJwsLocal && decodedJwsLocal.payload.sequence > decodedJws.payload.sequence) {
            throw new Error(
                'Local firmware release config cannot have greater sequence than remote.',
            );
        }
    }

    const algorithmInHeader = decodedJws?.header.alg;
    if (algorithmInHeader !== JWS_SIGN_ALGORITHM) {
        throw Error(`Wrong algorithm in JWS config header: ${algorithmInHeader}`);
    }

    const JWSPublicKey = getJWSPublicKey('firmware-release');
    if (!JWSPublicKey) {
        throw new Error('JWS public key is not defined!');
    }

    try {
        const isAuthenticityValid = verify(releasesJws, JWS_SIGN_ALGORITHM, JWSPublicKey);

        if (!isAuthenticityValid) {
            throw new Error('Config authenticity is invalid');
        }

        const releases: FirmwareReleaseConfig = JSON.parse(decodedJws.payload);

        return releases;
    } catch (error) {
        console.error('Error validating:', error);
        throw new Error(`Failed to validate release message: ${error.message}`);
    }
};
