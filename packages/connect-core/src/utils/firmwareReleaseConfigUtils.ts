import { decode, verify } from 'jws';

import type { FirmwareChannel } from '@trezor/connect-common/src/types/firmware';
import { firmwareConfigCodesignPublicKey, firmwareConfigDevPublicKey } from '@trezor/connect-data';
import type { FirmwareReleaseConfig } from '@trezor/device-utils';

interface RemoteUrlParts {
    BASE_URL: string;
    MIDDLE_PATH: string;
    CONFIG_PATH: string;
}

const PRODUCTION_URL_REMOTE_BASE = {
    BASE_URL: 'https://data.trezor.io',
    MIDDLE_PATH: 'firmware',
    CONFIG_PATH: 'config/',
};

const PRODUCTION_EARLY_ACCESS_URL_REMOTE_BASE = {
    ...PRODUCTION_URL_REMOTE_BASE,
    CONFIG_PATH: 'config-early-access/',
};

const UNSIGNED_URL_REMOTE_BASE = {
    BASE_URL: 'https://data.trezor.io',
    MIDDLE_PATH: 'dev/firmware/releases/unsigned',
    CONFIG_PATH: '',
};
const UNSIGNED_STABLE_URL_REMOTE_BASE = {
    BASE_URL: 'https://data.trezor.io',
    MIDDLE_PATH: 'dev/firmware/releases/unsigned-stable',
    CONFIG_PATH: '',
};
const UNSIGNED_NIGHTLY_URL_REMOTE_BASE = {
    BASE_URL: 'https://data.trezor.io',
    MIDDLE_PATH: 'dev/firmware/firmware-nightly',
    CONFIG_PATH: '',
};
const SIGNED_URL_REMOTE_BASE = {
    BASE_URL: 'https://suite.corp.sldev.cz',
    MIDDLE_PATH: 'firmware/signed',
    CONFIG_PATH: '',
};
const SIGNED_LOCALHOST = {
    BASE_URL: 'http://localhost:3000',
    MIDDLE_PATH: 'firmware/signed',
    CONFIG_PATH: '',
};
const UNSIGNED_LOCALHOST = {
    BASE_URL: 'http://localhost:3000',
    MIDDLE_PATH: 'firmware/unsigned',
    CONFIG_PATH: '',
};

interface FirmwareRemoteConfig {
    remoteUrlParts: RemoteUrlParts;
    // If set to `true`, the JWS is verified against production pubKey, otherwise against dev pubKey.
    useProductionKey: boolean;
    // If set to `true`, accept also raw JSON besides the JWS signed by the specified key.
    isSignatureOptional: boolean;
}

const FIRMWARE_REMOTES_CONFIG: Record<FirmwareChannel, FirmwareRemoteConfig> = {
    /*
     Remotes that serve production-signed FW binaries
    */
    production: {
        remoteUrlParts: PRODUCTION_URL_REMOTE_BASE,
        useProductionKey: true,
        isSignatureOptional: false,
    },
    'production-early-access': {
        remoteUrlParts: PRODUCTION_EARLY_ACCESS_URL_REMOTE_BASE,
        useProductionKey: true,
        isSignatureOptional: false,
    },
    'test-signed': {
        remoteUrlParts: SIGNED_URL_REMOTE_BASE,
        useProductionKey: true,
        isSignatureOptional: false,
    },
    /*
     Remotes that serve unsigned FW binaries
    */
    'test-unsigned': {
        remoteUrlParts: UNSIGNED_URL_REMOTE_BASE,
        useProductionKey: false,
        isSignatureOptional: false,
    },
    'test-unsigned-stable': {
        remoteUrlParts: UNSIGNED_STABLE_URL_REMOTE_BASE,
        useProductionKey: false,
        isSignatureOptional: false,
    },
    'test-unsigned-nightly': {
        remoteUrlParts: UNSIGNED_NIGHTLY_URL_REMOTE_BASE,
        useProductionKey: false,
        // Nightly does not use JWS signing.
        isSignatureOptional: true,
    },
    /*
     The two localhost "remotes" differ only semantically (one is meant to serve signed FW, the other unsigned), but
     the JWS signing is not necessarily related to FW signature, so developers can use it with or without JWS signing.
    */
    'localhost-signed': {
        remoteUrlParts: SIGNED_LOCALHOST,
        useProductionKey: false,
        isSignatureOptional: true,
    },
    'localhost-unsigned': {
        remoteUrlParts: UNSIGNED_LOCALHOST,
        useProductionKey: false,
        isSignatureOptional: true,
    },
};

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

const fetchAndDecodeConfig = async (
    firmwareChannel: FirmwareChannel,
    publicKey: string,
    isSignatureOptional: boolean,
): Promise<FirmwareReleaseConfig> => {
    const data = await fetchRemoteFwConfig(firmwareChannel);

    // Even if `isSignatureOptional`, when JWS is present, always parse it strictly.
    if (typeof data.jws === 'string') return verifyAndDecodeJws(data.jws, publicKey);

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
