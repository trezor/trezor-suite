import { decode, verify } from 'jws';

import type { FirmwareChannel } from '@trezor/connect-common/src/types/firmware';
import { firmwareConfigCodesignPublicKey, firmwareConfigDevPublicKey } from '@trezor/connect-data';
import type { FirmwareReleaseConfig } from '@trezor/device-utils';

interface RemoteBaseInfo {
    BASE_URL: string;
    MIDDLE_PATH: string;
}

const RELEASES_URL_REMOTE_BASE = {
    BASE_URL: 'https://data.trezor.io',
    MIDDLE_PATH: 'firmware',
};
const UNSIGNED_URL_REMOTE_BASE = {
    BASE_URL: 'https://data.trezor.io',
    MIDDLE_PATH: 'dev/firmware/releases/unsigned',
};
const UNSIGNED_STABLE_URL_REMOTE_BASE = {
    BASE_URL: 'https://data.trezor.io',
    MIDDLE_PATH: 'dev/firmware/releases/unsigned-stable',
};
const UNSIGNED_NIGHTLY_URL_REMOTE_BASE = {
    BASE_URL: 'https://data.trezor.io',
    MIDDLE_PATH: 'dev/firmware/firmware-nightly',
};
const SIGNED_URL_REMOTE_BASE = {
    BASE_URL: 'https://suite.corp.sldev.cz',
    MIDDLE_PATH: 'firmware/signed',
};
const SIGNED_LOCALHOST = {
    BASE_URL: 'http://localhost:3000',
    MIDDLE_PATH: 'firmware/signed',
};
const UNSIGNED_LOCALHOST = {
    BASE_URL: 'http://localhost:3000',
    MIDDLE_PATH: 'firmware/unsigned',
};
const FIRMWARE_REMOTE_BASE_URLS: Record<FirmwareChannel, RemoteBaseInfo> = {
    production: RELEASES_URL_REMOTE_BASE,
    'production-early-access': RELEASES_URL_REMOTE_BASE,
    'test-unsigned': UNSIGNED_URL_REMOTE_BASE,
    'test-unsigned-stable': UNSIGNED_STABLE_URL_REMOTE_BASE,
    'test-unsigned-nightly': UNSIGNED_NIGHTLY_URL_REMOTE_BASE,
    'test-signed': SIGNED_URL_REMOTE_BASE,
    'localhost-unsigned': UNSIGNED_LOCALHOST,
    'localhost-signed': SIGNED_LOCALHOST,
};

/**
 * Obtains the base URL and middle path where to find firmware releases, based on the current settings.
 * Examples:
 *   { BASE_URL: 'https://data.trezor.io', MIDDLE_PATH: 'firmware', firmwareChannel: 'production' }
 *   { BASE_URL: 'https://data.trezor.io', MIDDLE_PATH: 'firmware', firmwareChannel: 'production-early-access' }
 *   { BASE_URL: 'https://suite.corp.sldev.cz', MIDDLE_PATH: 'firmware/signed', firmwareChannel: 'test-signed' }
 *   { BASE_URL: 'http://localhost:3000', MIDDLE_PATH: 'firmware/unsigned', firmwareChannel: 'localhost-unsigned' }
 */
export const getOnlineFirmwareBaseUrl = (firmwareChannel?: FirmwareChannel): RemoteBaseInfo =>
    FIRMWARE_REMOTE_BASE_URLS[firmwareChannel ?? 'production'];

const JWS_CONFIG = {
    SIGN_ALGORITHM: 'ES256',
    VERSION: 1,
    REMOTE_FILENAME: 'releases.v1.json',
    REQUEST_TIMEOUT_MS: 5000,
};

const CONFIG_PATH_BY_CHANNEL: Partial<Record<FirmwareChannel, string>> = {
    production: 'config/',
    'production-early-access': 'config-early-access/',
};

const fetchRemoteFwConfig = async (firmwareChannel: FirmwareChannel) => {
    const { BASE_URL, MIDDLE_PATH } = getOnlineFirmwareBaseUrl(firmwareChannel);
    const configPath = CONFIG_PATH_BY_CHANNEL[firmwareChannel] ?? '';
    const path = `${MIDDLE_PATH}/${configPath}${JWS_CONFIG.REMOTE_FILENAME}`;
    const remoteReleasesUrl = new URL(path, BASE_URL);

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(
            () => controller.abort('Request timed out'),
            JWS_CONFIG.REQUEST_TIMEOUT_MS,
        );

        const response = await fetch(remoteReleasesUrl.toString(), { signal: controller.signal });
        clearTimeout(timeoutId);

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
    }
};

const fetchRemoteJws = async (firmwareChannel: FirmwareChannel): Promise<string> => {
    const data = await fetchRemoteFwConfig(firmwareChannel);

    // Assuming the response JSON has a 'jws' property.
    if (typeof data.jws !== 'string') {
        throw new Error('Invalid response format: "jws" property missing or not a string.');
    }

    return data.jws;
};

const verifyAndDecodeJws = (jws: string, publicKey: string): FirmwareReleaseConfig => {
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

export const fetchFirmwareReleaseConfig = async (firmwareChannel: FirmwareChannel) => {
    try {
        if (firmwareChannel === 'test-unsigned-nightly') {
            // Nightly does not use JWS signing
            const data = await fetchRemoteFwConfig(firmwareChannel);

            return data as FirmwareReleaseConfig;
        }

        const jws = await fetchRemoteJws(firmwareChannel);
        const useProductionKey = ['test-signed', 'production-early-access', 'production'].includes(
            firmwareChannel,
        );
        const publicKey = useProductionKey
            ? firmwareConfigCodesignPublicKey
            : firmwareConfigDevPublicKey;

        return verifyAndDecodeJws(jws, publicKey);
    } catch {
        // empty
    }
};
