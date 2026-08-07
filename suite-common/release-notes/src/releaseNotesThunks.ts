import { createThunk } from '@suite-common/redux-utils';
import { decodeJws, verifyJws } from '@suite-common/suite-utils';
import { publicKey } from '@trezor/env-utils';
import { scheduleAction } from '@trezor/utils';

import {
    ACTION_PREFIX,
    FETCH_INTERVAL_IN_MS,
    FETCH_TIMEOUT_IN_MS,
    JWS_SIGN_ALGORITHM,
    MANIFEST_VERSION,
    getManifestUrl,
} from './releaseNotesConstants';
import {
    releaseNotesActions,
    selectReleaseNotesFetchedAt,
    selectReleaseNotesGeneratedAt,
} from './releaseNotesSlice';
import { type ReleaseNotesPlatform } from './releaseNotesTypes';
import { isManifestFresh, isManifestSupported, sortReleasesDescending } from './releaseNotesUtils';

type FetchReleaseNotesParams = {
    platform: ReleaseNotesPlatform;
    isForced?: boolean;
};

/**
 * Downloads the release notes manifest published to data.trezor.io. Failures are expected (offline
 * use, blocked requests) and leave the already persisted releases untouched — the app always has the
 * release notes of the running version bundled.
 */
export const fetchReleaseNotesThunk = createThunk<void, FetchReleaseNotesParams>(
    `${ACTION_PREFIX}/fetchReleaseNotes`,
    async ({ platform, isForced = false }, { dispatch, getState }) => {
        const fetchedAt = selectReleaseNotesFetchedAt(getState());
        const isFresh = fetchedAt !== null && Date.now() < fetchedAt + FETCH_INTERVAL_IN_MS;

        if (isFresh && !isForced) return;

        dispatch(releaseNotesActions.fetchStart());

        try {
            const response = await scheduleAction(
                signal => fetch(getManifestUrl(platform), { signal }),
                { timeout: FETCH_TIMEOUT_IN_MS },
            );

            if (!response.ok) {
                throw Error(response.statusText);
            }

            const manifestJws = await response.text();
            const decodedJws = decodeJws(manifestJws);

            if (!decodedJws) {
                throw Error('Decoding of the release notes manifest failed');
            }

            const algorithmInHeader = decodedJws.header.alg;

            if (algorithmInHeader !== JWS_SIGN_ALGORITHM) {
                throw Error(`Wrong algorithm in the manifest JWS header: ${algorithmInHeader}`);
            }

            // The manifest is published to a single location, so it is always signed by the
            // production key - unlike the message system, there is no develop variant to verify.
            const isAuthenticityValid = await verifyJws(
                manifestJws,
                JWS_SIGN_ALGORITHM,
                publicKey.codesign,
            );

            if (!isAuthenticityValid) {
                throw Error('Release notes manifest authenticity is invalid');
            }

            const manifest: unknown = JSON.parse(decodedJws.payload);

            if (!isManifestSupported(manifest, MANIFEST_VERSION)) {
                throw Error('Release notes manifest version is not supported');
            }

            if (!isManifestFresh(manifest.generatedAt, selectReleaseNotesGeneratedAt(getState()))) {
                throw Error('Release notes manifest is older than the stored one');
            }

            dispatch(
                releaseNotesActions.fetchSuccess({
                    releases: sortReleasesDescending(manifest.releases),
                    fetchedAt: Date.now(),
                    generatedAt: manifest.generatedAt,
                }),
            );
        } catch (error) {
            console.warn(`Fetching of release notes failed: ${error}`);
            dispatch(releaseNotesActions.fetchError());
        }
    },
);
