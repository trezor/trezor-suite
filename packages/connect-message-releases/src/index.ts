import { getJWSPublicKey, isCodesignBuild } from '@trezor/env-utils';
import {
    decode,
    // verify
} from 'jws';

import { jws as releasesJwsLocal } from '../files/releases.v1';
import { JWS_SIGN_ALGORITHM, RELEASES_URL_REMOTE } from './constants';
import { ReleaseMessage } from './types';

// Enable this for local development purposes:
// set to true to always fetch local JWS
// TODO(karliatto): WIP: for now we are foring local since it was not deployed yet.
const FORCE_LOCAL_JWS = true;

const getReleasesJws = async () => {
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
        const response = await fetch(remoteReleasesUrl);
        console.log('response', response);

        if (!response.ok) {
            throw new Error(response.statusText);
        }
        3;

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

    const authenticityPublicKey = getJWSPublicKey();
    console.log('authenticityPublicKey', authenticityPublicKey);
    if (!authenticityPublicKey) {
        throw new Error('JWS public key is not defined!');
    }

    console.log('releasesJws', releasesJws);

    console.log('JWS_SIGN_ALGORITHM', JWS_SIGN_ALGORITHM);
    console.log('verifying');
    try {
        // There is an issue running this in electron. It works well on web.
        // https://github.com/electron/electron/issues/28027
        // const isAuthenticityValid = verify(releasesJws, JWS_SIGN_ALGORITHM, authenticityPublicKey);

        // console.log('isAuthenticityValid', isAuthenticityValid);

        // if (!isAuthenticityValid) {
        //     throw new Error('Config authenticity is invalid');
        // }

        const releases: ReleaseMessage = JSON.parse(decodedJws.payload);
        console.log('releases', releases);
        return releases;
    } catch (error) {
        console.log('error', error);
    }
};
