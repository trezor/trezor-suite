import { decode, verify } from 'jws';

import { FirmwareReleaseConfig } from '@trezor/device-utils';
import { getJWSPublicKey, isCodesignBuild } from '@trezor/env-utils';

import { JWS_SIGN_ALGORITHM, RELEASES_URL_REMOTE } from './constants';
import { jws as releasesJwsLocal } from '../files/releases.v1';

// Enable this for local development purposes:
// set to true to always fetch local JWS
// TODO: WIP: for now we are foring local since it was not deployed yet.
const FORCE_LOCAL_JWS = true;

const getReleaseJWS = async () => {
    if (FORCE_LOCAL_JWS) {
        return {
            releasesJws: releasesJwsLocal,
            isRemote: false,
        };
    }

    const remoteReleasesUrl = isCodesignBuild()
        ? RELEASES_URL_REMOTE.stable
        : RELEASES_URL_REMOTE.develop;

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5_000);

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
            releasesJws: releasesJwsLocal,
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
        const decodedJwsLocal = decode(releasesJwsLocal);

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
