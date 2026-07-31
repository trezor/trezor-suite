import { MANIFEST_VERSION } from '../src/releaseNotesConstants';
import { type ReleaseNotesManifest } from '../src/releaseNotesTypes';

export const mockReleaseNotesManifest = (
    manifest: Partial<ReleaseNotesManifest> = {},
): ReleaseNotesManifest => ({
    version: MANIFEST_VERSION,
    generatedAt: '2026-08-05T00:30:00.000Z',
    releases: [
        {
            version: '26.8.0',
            publishedAt: '2026-08-01T10:00:00.000Z',
            notes: 'Release notes of 26.8.0',
        },
        {
            version: '26.7.0',
            publishedAt: '2026-07-01T10:00:00.000Z',
            notes: 'Release notes of 26.7.0',
        },
    ],
    ...manifest,
});
