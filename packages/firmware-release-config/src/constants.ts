import { resolve } from 'path';

export const JWS_SIGN_ALGORITHM = 'ES256';
export const VERSION = 1;
export const JSON_RELEASES_FILENAME = `releases.v${VERSION}.json`;
export const JWS_RELEASES_FILENAME_REMOTE = `releases.v${VERSION}.jws`;
export const JWS_RELEASES_FILENAME_LOCAL = `releases.v${VERSION}.ts`;

export const RELEASES_URL_REMOTE_BASE = 'https://data.trezor.io/releases';
export const RELEASES_URL_REMOTE = {
    stable: `${RELEASES_URL_REMOTE_BASE}/stable/${JWS_RELEASES_FILENAME_REMOTE}`,
    develop: `${RELEASES_URL_REMOTE_BASE}/develop/${JWS_RELEASES_FILENAME_REMOTE}`,
};

export const MESSAGE_RELEASE_PATH = resolve(__dirname, '..', 'releases', JSON_RELEASES_FILENAME);
export const MESSAGE_RELEASE_SCHEMA_PATH = resolve(
    __dirname,
    '..',
    'schema',
    `releases.schema.v${VERSION}.json`,
);

export const DEV_PRIVATE_KEY = `
-----BEGIN EC PRIVATE KEY-----
MHcCAQEEIEGiURJVYqYlJZZ5qPFGdJaHCagzTCVNomWcp6yS8P0WoAoGCCqGSM49
AwEHoUQDQgAEEKjWdvv8SJm/UN2lXoEXl3ID35b/hsz3etxANvUgLQ4r0eEhqVUE
L5l+dRMgEv4Ycvr3UEcMkSFRPoA8ktxX1A==
-----END EC PRIVATE KEY-----
`;

export const DEV_PUB_KEY = `
-----BEGIN PUBLIC KEY-----
MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEEKjWdvv8SJm/UN2lXoEXl3ID35b/
hsz3etxANvUgLQ4r0eEhqVUEL5l+dRMgEv4Ycvr3UEcMkSFRPoA8ktxX1A==
-----END PUBLIC KEY-----
`;
