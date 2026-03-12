import { FirmwareChannel } from '../types/firmware';

interface RemoteBaseInfo {
    BASE_URL: string;
    MIDDLE_PATH: string;
}

export type OnlineFirmwareBaseUrl = RemoteBaseInfo & { firmwareChannel: FirmwareChannel };

const RELEASES_URL_REMOTE_BASE: RemoteBaseInfo = {
    BASE_URL: 'https://data.trezor.io',
    MIDDLE_PATH: 'firmware',
};
const UNSIGNED_URL_REMOTE_BASE: RemoteBaseInfo = {
    BASE_URL: 'https://data.trezor.io',
    MIDDLE_PATH: 'dev/firmware/releases/unsigned',
};
const UNSIGNED_STABLE_URL_REMOTE_BASE: RemoteBaseInfo = {
    BASE_URL: 'https://data.trezor.io',
    MIDDLE_PATH: 'dev/firmware/releases/unsigned-stable',
};
const SIGNED_URL_REMOTE_BASE: RemoteBaseInfo = {
    BASE_URL: 'https://suite.corp.sldev.cz',
    MIDDLE_PATH: 'firmware/signed',
};
const SIGNED_LOCALHOST: RemoteBaseInfo = {
    BASE_URL: 'http://localhost:3000',
    MIDDLE_PATH: 'firmware/signed',
};
const UNSIGNED_LOCALHOST: RemoteBaseInfo = {
    BASE_URL: 'http://localhost:3000',
    MIDDLE_PATH: 'firmware/unsigned',
};

const FIRMWARE_REMOTE_BASE_URLS: Record<FirmwareChannel, RemoteBaseInfo> = {
    production: RELEASES_URL_REMOTE_BASE,
    'production-early-access': RELEASES_URL_REMOTE_BASE,
    'test-unsigned': UNSIGNED_URL_REMOTE_BASE,
    'test-unsigned-stable': UNSIGNED_STABLE_URL_REMOTE_BASE,
    'test-signed': SIGNED_URL_REMOTE_BASE,
    'localhost-unsigned': UNSIGNED_LOCALHOST,
    'localhost-signed': SIGNED_LOCALHOST,
};

/**
 * Obtains the base URL and middle path where to find firmware releases, based on the firmware channel.
 * Examples:
 *   { BASE_URL: 'https://data.trezor.io', MIDDLE_PATH: 'firmware', firmwareChannel: 'production' }
 *   { BASE_URL: 'https://data.trezor.io', MIDDLE_PATH: 'firmware', firmwareChannel: 'production-early-access' }
 *   { BASE_URL: 'https://suite.corp.sldev.cz', MIDDLE_PATH: 'firmware/signed', firmwareChannel: 'test-signed' }
 *   { BASE_URL: 'http://localhost:3000', MIDDLE_PATH: 'firmware/unsigned', firmwareChannel: 'localhost-unsigned' }
 */
export const getFirmwareBaseUrl = (
    firmwareChannel: FirmwareChannel | null | undefined,
): OnlineFirmwareBaseUrl => {
    if (!firmwareChannel) {
        // If for some reason `firmwareChannel` settings is not set we return production one.
        return {
            ...FIRMWARE_REMOTE_BASE_URLS['production'],
            firmwareChannel: 'production',
        };
    }

    return {
        ...FIRMWARE_REMOTE_BASE_URLS[firmwareChannel],
        firmwareChannel,
    };
};
