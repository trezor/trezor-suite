import { createPublicKey } from 'crypto';
import { decode, verify } from 'jws';

import { getJWSPublicKey, isCodesignBuild } from '@trezor/env-utils';

import { JWS_SIGN_ALGORITHM, RELEASES_URL_REMOTE } from './constants';
import { ReleaseMessage } from './types';
import { jws as releasesJwsLocal } from '../files/releases.v1';

// Enable this for local development purposes:
// set to true to always fetch local JWS
// TODO: WIP: for now we are foring local since it was not deployed yet.
const FORCE_LOCAL_JWS = true;

export const getReleasesJws = async () => {
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
            releasesJws: releasesJwsLocal,
            isRemote: false,
        };
    }
};

export const getReleasesMessage = async () => {
    const { releasesJws } = await getReleasesJws();

    const decodedJws = decode(releasesJws);

    if (!decodedJws) {
        throw new Error('Decoding of releases failed.');
    }

    const algorithmInHeader = decodedJws?.header.alg;
    if (algorithmInHeader !== JWS_SIGN_ALGORITHM) {
        throw Error(`Wrong algorithm in JWS config header: ${algorithmInHeader}`);
    }

    const JWSPublicKey = getJWSPublicKey();
    if (!JWSPublicKey) {
        throw new Error('JWS public key is not defined!');
    }

    try {
        const publicKey = createPublicKey(JWSPublicKey);
        const publicKeyString = publicKey.export({ type: 'spki', format: 'pem' });
        const isAuthenticityValid = verify(releasesJws, JWS_SIGN_ALGORITHM, publicKeyString);

        if (!isAuthenticityValid) {
            throw new Error('Config authenticity is invalid');
        }

        const releases: ReleaseMessage = JSON.parse(decodedJws.payload);

        return releases;
    } catch (error) {
        console.error('Error validating:', error);
        throw new Error(`Failed to validate release message: ${error.message}`);
    }
};
