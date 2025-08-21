import { decode, verify } from 'jws';

import { FirmwareReleaseConfig } from '@trezor/device-utils';
import { getJWSPublicKey } from '@trezor/env-utils';

import { firmwareReleaseConfigAssets } from './assetUtils';
import { FirmwareUpdateSource, getOnlineFirmwareBaseUrl } from '../data/firmwareInfo';

const JWS_CONFIG = {
    SIGN_ALGORITHM: 'ES256',
    VERSION: 1,
    REMOTE_FILENAME: 'releases.v1.json',
    REQUEST_TIMEOUT_MS: 5000,
};

type JwsInfo = {
    jws: string;
    source: 'remote' | 'local';
    env: FirmwareUpdateSource;
};

const fetchRemoteJWS = async (): Promise<JwsInfo> => {
    const { BASE_URL, MIDDLE_PATH, env } = getOnlineFirmwareBaseUrl();

    const remoteReleasesUrl = new URL(BASE_URL);
    remoteReleasesUrl.pathname = `${MIDDLE_PATH}/${env === 'production' ? 'config/' : ''}${JWS_CONFIG.REMOTE_FILENAME}`;

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), JWS_CONFIG.REQUEST_TIMEOUT_MS);

        const response = await fetch(remoteReleasesUrl.toString(), { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`Fetching error with status: ${response.status}`);
        }

        const data = await response.json();

        return { jws: data.jws, source: 'remote', env };
    } catch (error) {
        console.error(
            `Fetching remote firmware release failed: ${error}. Falling back to local config.`,
        );

        // Fallback to the local asset if the remote fetch fails.
        return { jws: firmwareReleaseConfigAssets.jws, source: 'local', env };
    }
};

const decodeJwsPayload = (jws: string): any => {
    const decoded = decode(jws);
    if (!decoded || !decoded.payload) {
        throw new Error('Failed to decode JWS or payload is missing.');
    }

    return JSON.parse(decoded.payload);
};

const verifyJwsSignature = (jws: string, publicKey: string): void => {
    const decoded = decode(jws);
    if (decoded?.header.alg !== JWS_CONFIG.SIGN_ALGORITHM) {
        throw new Error(
            `Invalid JWS algorithm: expected ${JWS_CONFIG.SIGN_ALGORITHM}, got ${decoded?.header.alg}`,
        );
    }

    if (!verify(jws, JWS_CONFIG.SIGN_ALGORITHM, publicKey)) {
        throw new Error('JWS signature is invalid.');
    }
};

export const getFirmwareReleaseConfig = async () => {
    const { jws: remoteJws, source: initialSource, env } = await fetchRemoteJWS();

    let finalJws = remoteJws;
    let finalSource = initialSource;
    let config;

    if (initialSource === 'remote') {
        try {
            const remotePayload = decodeJwsPayload(remoteJws);
            const localPayload = decodeJwsPayload(firmwareReleaseConfigAssets.jws);

            // Sanity check local config version.
            if (localPayload.version !== JWS_CONFIG.VERSION) {
                throw new Error(`Local config has mismatched version: ${localPayload.version}`);
            }

            // If local is newer or same sequence, prefer it over remote.
            if (localPayload.sequence >= remotePayload.sequence) {
                finalJws = firmwareReleaseConfigAssets.jws;
                finalSource = 'local';
                config = localPayload;
            } else {
                config = remotePayload;
            }
        } catch (error) {
            console.error(`Error comparing remote/local JWS: ${error}. Using remote as is.`);
        }
    }

    const useProductionKey = ['test-signed', 'production'].includes(env) || finalSource === 'local';
    const publicKey = getJWSPublicKey('firmware-release', useProductionKey);

    verifyJwsSignature(finalJws, publicKey);
    // Only decode the JWS if we haven't already assigned the payload
    if (!config) {
        config = decodeJwsPayload(finalJws);
    }

    return {
        config,
        isRemote: finalSource === 'remote',
    };
};

export const getOnlyLocalFirmwareReleaseConfig = (): {
    config: FirmwareReleaseConfig;
    isRemote: false;
} => {
    const localJws = firmwareReleaseConfigAssets.jws;
    // For local-only, we always use the production signing key.
    const publicKey = getJWSPublicKey('firmware-release', true);

    verifyJwsSignature(localJws, publicKey);
    const config = decodeJwsPayload(localJws);

    return {
        config,
        isRemote: false,
    };
};
