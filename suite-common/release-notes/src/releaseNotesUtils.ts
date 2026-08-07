import { versionUtils } from '@trezor/utils';

import { DISPLAYED_RELEASES_LIMIT } from './releaseNotesConstants';
import {
    type ReleaseNotesManifest,
    ReleaseNotesPlatform,
    type ReleaseNotesRelease,
} from './releaseNotesTypes';

export type DisplayedRelease = ReleaseNotesRelease & {
    isCurrent: boolean;
};

type GetDisplayedReleasesParams = {
    releases: ReleaseNotesRelease[];
    currentVersion: string;
    currentVersionNotes: string | null;
    limit?: number;
};

/**
 * Desktop releases are tagged `v26.7.3`, mobile ones `v26.7.3@mobile`.
 */
export const parseReleaseTag = (
    tagName: string,
): { version: string; platform: ReleaseNotesPlatform } | null => {
    const match = tagName.match(/^v(\d+\.\d+\.\d+)(@mobile)?$/);

    if (!match) return null;

    const [, version, mobileSuffix] = match;

    if (version === undefined) return null;

    return {
        version,
        platform: mobileSuffix ? ReleaseNotesPlatform.Mobile : ReleaseNotesPlatform.Desktop,
    };
};

/** `versionUtils.tryParse` is typed as returning `null`, but yields `undefined` on malformed input. */
const isVersionValid = (version: string) => !!versionUtils.tryParse(version);

/**
 * Unlike `versionUtils.isNewer`, this never throws on malformed input coming from a remote manifest.
 */
export const isVersionNewer = (versionX: string, versionY: string) => {
    const parsedX = versionUtils.tryParse(versionX);
    const parsedY = versionUtils.tryParse(versionY);

    if (!parsedX || !parsedY) return false;

    return versionUtils.isNewer(parsedX, parsedY);
};

const compareByVersionDescending = (
    releaseA: ReleaseNotesRelease,
    releaseB: ReleaseNotesRelease,
) => {
    if (isVersionNewer(releaseA.version, releaseB.version)) return -1;
    if (isVersionNewer(releaseB.version, releaseA.version)) return 1;

    return 0;
};

export const sortReleasesDescending = (releases: ReleaseNotesRelease[]) =>
    [...releases].sort(compareByVersionDescending);

export const isManifestSupported = (
    manifest: unknown,
    supportedVersion: number,
): manifest is ReleaseNotesManifest => {
    if (typeof manifest !== 'object' || manifest === null) return false;

    const { version, releases, generatedAt } = manifest as Partial<ReleaseNotesManifest>;

    return (
        version === supportedVersion && Array.isArray(releases) && typeof generatedAt === 'string'
    );
};

/**
 * A valid signature does not stop anyone with write access to the CDN from replaying an older, also
 * validly signed manifest and hiding the existence of a newer release that way. Re-accepting the
 * same manifest is fine, going backwards is not.
 */
export const isManifestFresh = (generatedAt: string, storedGeneratedAt: string | null) => {
    const generatedAtTime = Date.parse(generatedAt);

    if (Number.isNaN(generatedAtTime)) return false;

    if (storedGeneratedAt === null) return true;

    const storedTime = Date.parse(storedGeneratedAt);

    return Number.isNaN(storedTime) || generatedAtTime >= storedTime;
};

/**
 * Combines the remote manifest with the release notes bundled in the app. The current version is
 * always present, so the list stays useful offline and while the manifest lags behind a fresh release.
 */
export const getDisplayedReleases = ({
    releases,
    currentVersion,
    currentVersionNotes,
    limit = DISPLAYED_RELEASES_LIMIT,
}: GetDisplayedReleasesParams): DisplayedRelease[] => {
    const remoteReleases = sortReleasesDescending(
        releases.filter(release => isVersionValid(release.version)),
    ).slice(0, limit);

    const hasCurrentVersion = remoteReleases.some(release => release.version === currentVersion);

    const displayedReleases =
        hasCurrentVersion || !isVersionValid(currentVersion) || currentVersionNotes === null
            ? remoteReleases
            : sortReleasesDescending([
                  ...remoteReleases,
                  { version: currentVersion, publishedAt: '', notes: currentVersionNotes },
              ]);

    return displayedReleases.map(release => ({
        ...release,
        notes:
            release.version === currentVersion && !release.notes
                ? (currentVersionNotes ?? '')
                : release.notes,
        isCurrent: release.version === currentVersion,
    }));
};

export const getUpdatableRelease = ({
    releases,
    currentVersion,
}: {
    releases: DisplayedRelease[];
    currentVersion: string;
}) => releases.find(release => isVersionNewer(release.version, currentVersion));
