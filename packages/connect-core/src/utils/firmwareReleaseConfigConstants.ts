import type { FirmwareChannel } from '@trezor/connect-common';

export interface RemoteUrlParts {
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

export const FIRMWARE_REMOTES_CONFIG: Record<FirmwareChannel, FirmwareRemoteConfig> = {
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
