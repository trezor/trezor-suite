import { type ReleaseNotesPlatform } from './releaseNotesTypes';

export const ACTION_PREFIX = '@suite-common/release-notes';

/**
 * Bump when the manifest shape stops being backward compatible. Older apps ignore
 * manifests they cannot read and fall back to the bundled release notes.
 */
export const MANIFEST_VERSION = 1;

/** Unsigned manifest produced by the generator. Reviewed as a CI artifact, never published. */
export const MANIFEST_FILENAME = 'releases.json';

/** Signed manifest published to data.trezor.io and consumed by the app. */
export const JWS_MANIFEST_FILENAME = `releases.v${MANIFEST_VERSION}.jws`;

export const JWS_SIGN_ALGORITHM = 'ES256';

const MANIFEST_URL_BASE = 'https://data.trezor.io/suite/release-notes';

export const getManifestUrl = (platform: ReleaseNotesPlatform) =>
    `${MANIFEST_URL_BASE}/${platform}/${JWS_MANIFEST_FILENAME}`;

/** How many releases the generator publishes to data.trezor.io. */
export const PUBLISHED_RELEASES_LIMIT = 30;

/** How many releases the app displays. The current version is always included on top of these. */
export const DISPLAYED_RELEASES_LIMIT = 10;

export const FETCH_TIMEOUT_IN_MS = 15_000;

/** Persisted manifests are reused until they get this old. */
export const FETCH_INTERVAL_IN_MS = 6 * 60 * 60 * 1000; // 6 hours
