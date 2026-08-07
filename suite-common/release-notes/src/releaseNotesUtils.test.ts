import { MANIFEST_VERSION } from './releaseNotesConstants';
import { type ReleaseNotesRelease } from './releaseNotesTypes';
import {
    getDisplayedReleases,
    getUpdatableRelease,
    isManifestSupported,
    isVersionNewer,
    parseReleaseTag,
    sortReleasesDescending,
} from './releaseNotesUtils';

const mockRelease = (version: string, notes = `notes of ${version}`): ReleaseNotesRelease => ({
    version,
    publishedAt: '2026-07-30T13:11:29Z',
    notes,
});

describe('parseReleaseTag', () => {
    it('parses a desktop release tag', () => {
        expect(parseReleaseTag('v26.7.3')).toEqual({ version: '26.7.3', platform: 'desktop' });
    });

    it('parses a mobile release tag', () => {
        expect(parseReleaseTag('v26.7.1@mobile')).toEqual({
            version: '26.7.1',
            platform: 'mobile',
        });
    });

    it('rejects tags that are not Suite releases', () => {
        expect(parseReleaseTag('@trezor/connect@9.4.0')).toBeNull();
        expect(parseReleaseTag('v26.7')).toBeNull();
        expect(parseReleaseTag('26.7.3')).toBeNull();
        expect(parseReleaseTag('v26.7.3-beta')).toBeNull();
    });
});

describe('isVersionNewer', () => {
    it('compares patch versions', () => {
        expect(isVersionNewer('26.7.3', '26.7.2')).toBe(true);
        expect(isVersionNewer('26.7.2', '26.7.3')).toBe(false);
        expect(isVersionNewer('26.7.3', '26.7.3')).toBe(false);
    });

    it('compares minor and major versions', () => {
        expect(isVersionNewer('26.8.0', '26.7.9')).toBe(true);
        expect(isVersionNewer('27.0.0', '26.12.9')).toBe(true);
    });

    it('returns false instead of throwing on malformed input', () => {
        expect(isVersionNewer('nonsense', '26.7.2')).toBe(false);
        expect(isVersionNewer('26.7.2', '')).toBe(false);
    });
});

describe('sortReleasesDescending', () => {
    it('sorts from the newest to the oldest', () => {
        const sorted = sortReleasesDescending([
            mockRelease('26.5.1'),
            mockRelease('26.7.3'),
            mockRelease('26.6.1'),
        ]);

        expect(sorted.map(release => release.version)).toEqual(['26.7.3', '26.6.1', '26.5.1']);
    });

    it('does not mutate the input', () => {
        const releases = [mockRelease('26.5.1'), mockRelease('26.7.3')];
        sortReleasesDescending(releases);

        expect(releases.map(release => release.version)).toEqual(['26.5.1', '26.7.3']);
    });
});

describe('isManifestSupported', () => {
    it('accepts a manifest of the supported version', () => {
        expect(
            isManifestSupported(
                { version: MANIFEST_VERSION, generatedAt: '', releases: [] },
                MANIFEST_VERSION,
            ),
        ).toBe(true);
    });

    it('rejects unsupported or malformed manifests', () => {
        expect(isManifestSupported({ version: 2, releases: [] }, MANIFEST_VERSION)).toBe(false);
        expect(isManifestSupported({ version: MANIFEST_VERSION }, MANIFEST_VERSION)).toBe(false);
        expect(isManifestSupported(null, MANIFEST_VERSION)).toBe(false);
        expect(isManifestSupported('releases.json', MANIFEST_VERSION)).toBe(false);
    });
});

describe('getDisplayedReleases', () => {
    it('marks the running version as current', () => {
        const displayed = getDisplayedReleases({
            releases: [mockRelease('26.7.3'), mockRelease('26.7.2')],
            currentVersion: '26.7.2',
            currentVersionNotes: 'bundled notes',
        });

        expect(displayed.map(({ version, isCurrent }) => ({ version, isCurrent }))).toEqual([
            { version: '26.7.3', isCurrent: false },
            { version: '26.7.2', isCurrent: true },
        ]);
    });

    it('adds the running version when the manifest does not list it yet', () => {
        const displayed = getDisplayedReleases({
            releases: [mockRelease('26.7.3'), mockRelease('26.7.1')],
            currentVersion: '26.7.2',
            currentVersionNotes: 'bundled notes',
        });

        expect(displayed.map(release => release.version)).toEqual(['26.7.3', '26.7.2', '26.7.1']);
        expect(displayed[1]?.notes).toBe('bundled notes');
    });

    it('falls back to the bundled notes only, when the manifest is unavailable', () => {
        const displayed = getDisplayedReleases({
            releases: [],
            currentVersion: '26.7.2',
            currentVersionNotes: 'bundled notes',
        });

        expect(displayed).toEqual([
            {
                version: '26.7.2',
                publishedAt: '',
                notes: 'bundled notes',
                isCurrent: true,
            },
        ]);
    });

    it('returns an empty list when neither the manifest nor the bundled notes are available', () => {
        expect(
            getDisplayedReleases({
                releases: [],
                currentVersion: '26.7.2',
                currentVersionNotes: null,
            }),
        ).toEqual([]);
    });

    it('keeps the running version even when it falls outside of the limit', () => {
        const releases = Array.from({ length: 12 }, (_, index) =>
            mockRelease(`26.7.${12 - index}`),
        );

        const displayed = getDisplayedReleases({
            releases,
            currentVersion: '26.7.1',
            currentVersionNotes: 'bundled notes',
            limit: 3,
        });

        expect(displayed.map(release => release.version)).toEqual([
            '26.7.12',
            '26.7.11',
            '26.7.10',
            '26.7.1',
        ]);
    });

    it('drops releases with a malformed version', () => {
        const displayed = getDisplayedReleases({
            releases: [mockRelease('26.7.3'), mockRelease('nonsense')],
            currentVersion: '26.7.3',
            currentVersionNotes: 'bundled notes',
        });

        expect(displayed.map(release => release.version)).toEqual(['26.7.3']);
    });

    it('uses the bundled notes when the manifest entry of the running version has none', () => {
        const displayed = getDisplayedReleases({
            releases: [mockRelease('26.7.2', '')],
            currentVersion: '26.7.2',
            currentVersionNotes: 'bundled notes',
        });

        expect(displayed[0]?.notes).toBe('bundled notes');
    });
});

describe('getUpdatableRelease', () => {
    const currentVersion = '26.7.2';
    const releases = getDisplayedReleases({
        releases: [mockRelease('26.7.3'), mockRelease('26.7.2'), mockRelease('26.7.1')],
        currentVersion,
        currentVersionNotes: 'bundled notes',
    });

    it('returns the newest release that is newer than the running version', () => {
        expect(getUpdatableRelease({ releases, currentVersion })?.version).toBe('26.7.3');
    });

    it('returns undefined when the running version is the newest one', () => {
        expect(getUpdatableRelease({ releases, currentVersion: '26.7.3' })).toBeUndefined();
    });
});
