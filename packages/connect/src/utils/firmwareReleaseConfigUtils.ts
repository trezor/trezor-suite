import { decode, verify } from 'jws';

import { FirmwareReleaseConfig } from '@trezor/device-utils';
import { getJWSPublicKey } from '@trezor/env-utils';

import { firmwareReleaseConfigAssets } from './assetUtils';
import { getOnlineFirmwareBaseUrl } from '../data/firmwareInfo';

const JWS_SIGN_ALGORITHM = 'ES256';
const VERSION = 1;
const JWS_RELEASES_FILENAME_REMOTE = `releases.v${VERSION}.json`;

// Enable this for local development purposes: set to true to always fetch local JWS
const FORCE_LOCAL_JWS = false;

const getReleaseJWS = async () => {
    if (FORCE_LOCAL_JWS) {
        return {
            releasesJws: firmwareReleaseConfigAssets.jws,
            isRemote: false,
        };
    }

    const onlineFirmwareBaseUrl = getOnlineFirmwareBaseUrl();
    const remoteReleasesUrl = `${onlineFirmwareBaseUrl}/firmware/unsigned/${JWS_RELEASES_FILENAME_REMOTE}`;

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

        const parsedConfig = JSON.parse(releasesJws);

        return {
            releasesJws: parsedConfig.jws,
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

const verifyFirmwareRelease = (releasesJws: string, isRemote: boolean) => {
    let decodedJws = decode(releasesJws);
    if (!decodedJws) {
        throw new Error('Decoding of releases failed.');
    }

    if (isRemote) {
        const decodedJwsLocal = decode(firmwareReleaseConfigAssets.jws);
        if (!decodedJwsLocal || !decodedJwsLocal.payload) {
            // Sanity check, local config should always be there and should be possible to decode it.
            throw new Error('Local firmware release config missing.');
        }
        const localJws = JSON.parse(decodedJwsLocal?.payload);
        if (localJws.version !== VERSION) {
            // Sanity check, local config should always be the hard-coded version.
            throw new Error(`Local firmware release config expected version ${VERSION}.`);
        }
        if (localJws.sequence >= decodedJws.payload.sequence) {
            // If we fetch remote but local is newer or equal to remote then we use local.
            decodedJws = decodedJwsLocal;
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

        return JSON.parse(decodedJws.payload);
    } catch (error) {
        console.error('Error validating:', error);
        throw new Error(`Failed to validate release message: ${error.message}`);
    }
};

export const getFirmwareReleaseConfig = async () => {
    const { releasesJws, isRemote } = await getReleaseJWS();
    const config: FirmwareReleaseConfig = verifyFirmwareRelease(releasesJws, isRemote);

    return {
        config,
        isRemote
    };
};

export const getOnlyLocalFirmwareReleaseConfig = (): FirmwareReleaseConfig =>
    verifyFirmwareRelease(firmwareReleaseConfigAssets.jws, false);
