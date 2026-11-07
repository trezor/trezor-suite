import type * as JwsLibrary from 'jws';

import type { FirmwareChannel } from '@trezor/connect-common/src/types/firmware';
import { firmwareConfigCodesignPublicKey, firmwareConfigDevPublicKey } from '@trezor/connect-data';
import type { FirmwareReleaseConfig } from '@trezor/device-utils';

import { FIRMWARE_REMOTES_CONFIG, type RemoteUrlParts } from './firmwareReleaseConfigConstants';

/**
 * Obtains the base URL and middle path where to find firmware releases, based on the current settings.
 * Examples:
 *   { BASE_URL: 'https://data.trezor.io', MIDDLE_PATH: 'firmware' }
 *   { BASE_URL: 'https://data.trezor.io', MIDDLE_PATH: 'firmware' }
 *   { BASE_URL: 'https://suite.corp.sldev.cz', MIDDLE_PATH: 'firmware/signed' }
 *   { BASE_URL: 'http://localhost:3000', MIDDLE_PATH: 'firmware/unsigned' }
 */
export const getOnlineFirmwareBaseUrl = (
    firmwareChannel: FirmwareChannel = 'production',
): RemoteUrlParts => FIRMWARE_REMOTES_CONFIG[firmwareChannel].remoteUrlParts;

const JWS_CONFIG = {
    SIGN_ALGORITHM: 'ES256',
    VERSION: 1,
    REMOTE_FILENAME: 'releases.v1.json',
    REQUEST_TIMEOUT_MS: 5000,
};

const fetchRemoteFwConfig = async (firmwareChannel: FirmwareChannel) => {
    const { BASE_URL, MIDDLE_PATH, CONFIG_PATH } = getOnlineFirmwareBaseUrl(firmwareChannel);
    const path = `${MIDDLE_PATH}/${CONFIG_PATH}${JWS_CONFIG.REMOTE_FILENAME}`;
    const remoteReleasesUrl = new URL(path, BASE_URL);

    const controller = new AbortController();
    const timeoutId = setTimeout(
        () => controller.abort('Request timed out'),
        JWS_CONFIG.REQUEST_TIMEOUT_MS,
    );

    try {
        const response = await fetch(remoteReleasesUrl.toString(), { signal: controller.signal });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();

        return data;
    } catch (error) {
        throw new Error(
            `Failed to fetch remote: ${error instanceof Error ? error.message : String(error)}`,
            { cause: error },
        );
    } finally {
        clearTimeout(timeoutId);
    }
};

const verifyAndDecodeJws = (
    jws: string,
    publicKey: string,
    { decode, verify }: Pick<typeof JwsLibrary, 'decode' | 'verify'>,
): FirmwareReleaseConfig => {
    const decoded = decode(jws);

    if (!decoded?.payload || !decoded.header) {
        throw new Error('Invalid JWS structure.');
    }

    const parsedPayload = JSON.parse(decoded.payload);

    if (decoded.header.alg !== JWS_CONFIG.SIGN_ALGORITHM) {
        throw new Error('Invalid JWS algorithm');
    }

    if (parsedPayload.version !== JWS_CONFIG.VERSION) {
        throw new Error('Config version mismatch.');
    }

    if (!verify(jws, JWS_CONFIG.SIGN_ALGORITHM, publicKey)) {
        throw new Error('JWS signature is invalid.');
    }

    return parsedPayload;
};

const fetchAndDecodeConfig = async (
    firmwareChannel: FirmwareChannel,
    publicKey: string,
    isSignatureOptional: boolean,
): Promise<FirmwareReleaseConfig> => {
    // `jws` loads on demand, alongside the config, so verification does not wait for a second download.
    // A failed download matters only when the config is signed.
    const jwsLibraryPromise = import('jws').catch(() => undefined);

    const data = await fetchRemoteFwConfig(firmwareChannel);

    // Even if `isSignatureOptional`, when JWS is present, always parse it strictly.
    if (typeof data.jws === 'string') {
        const jwsLibrary = await jwsLibraryPromise;

        if (!jwsLibrary) {
            throw new Error('Failed to load the JWS library.');
        }

        return verifyAndDecodeJws(data.jws, publicKey, jwsLibrary);
    }

    if (isSignatureOptional) return data as FirmwareReleaseConfig;

    throw new Error('Invalid response format: "jws" property missing or not a string.');
};

export const fetchFirmwareReleaseConfig = async (firmwareChannel: FirmwareChannel) => {
    try {
        const { useProductionKey, isSignatureOptional } = FIRMWARE_REMOTES_CONFIG[firmwareChannel];
        const publicKey = useProductionKey
            ? firmwareConfigCodesignPublicKey
            : firmwareConfigDevPublicKey;

        return await fetchAndDecodeConfig(firmwareChannel, publicKey, isSignatureOptional);
    } catch {
        // empty
    }
};
