export const JWS_SIGN_ALGORITHM = 'ES256';
export const VERSION = 1;
export const JWS_RELEASES_FILENAME_REMOTE = `releases.v${VERSION}.jws`;

export const RELEASES_URL_REMOTE_BASE = 'https://data.trezor.io/releases';
export const RELEASES_URL_REMOTE = {
    stable: `${RELEASES_URL_REMOTE_BASE}/stable/${JWS_RELEASES_FILENAME_REMOTE}`,
    develop: `${RELEASES_URL_REMOTE_BASE}/develop/${JWS_RELEASES_FILENAME_REMOTE}`,
};
