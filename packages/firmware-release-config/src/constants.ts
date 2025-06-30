import { FirmwareUpdateSource } from "./types";

export const JWS_SIGN_ALGORITHM = 'ES256';
export const VERSION = 1;
export const JSON_RELEASES_FILENAME = `releases.v${VERSION}.json`;
export const JWS_RELEASES_FILENAME_REMOTE = `releases.v${VERSION}.jws`;
export const JWS_RELEASES_FILENAME_LOCAL = `releases.v${VERSION}.ts`;

export const RELEASES_URL_REMOTE_BASE = 'https://data.trezor.io/suite/firmware';
export const RELEASES_URL_REMOTE: Record<FirmwareUpdateSource, string> = {
    // TODO: WIP: this is just for dev until we have avail\able data.trezor.io files deployed.
    production: 'https://raw.githubusercontent.com/trezor/trezor-suite/refs/heads/feat/separate-firmware-release-config/packages/firmware-release-config/static/releases.v1.jws',
    'test-unsigned':'https://raw.githubusercontent.com/trezor/trezor-suite/refs/heads/feat/separate-firmware-release-config/packages/firmware-release-config/static/releases.v1.jws',
    'test-signed':'https://raw.githubusercontent.com/trezor/trezor-suite/refs/heads/feat/separate-firmware-release-config/packages/firmware-release-config/static/releases.v1.jws',
    // production: `${RELEASES_URL_REMOTE_BASE}/production/${JWS_RELEASES_FILENAME_REMOTE}`,
    // 'test-unsigned': `${RELEASES_URL_REMOTE_BASE}/unsigned/${JWS_RELEASES_FILENAME_REMOTE}`,
    // 'test-signed': `${RELEASES_URL_REMOTE_BASE}/signed/${JWS_RELEASES_FILENAME_REMOTE}`,
};
