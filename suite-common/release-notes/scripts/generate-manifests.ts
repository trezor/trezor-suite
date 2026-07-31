/* eslint-disable no-console */

import { mkdirSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';

import { OUTPUT_DIR } from './constants';
import {
    MANIFEST_FILENAME,
    MANIFEST_VERSION,
    PUBLISHED_RELEASES_LIMIT,
} from '../src/releaseNotesConstants';
import {
    type ReleaseNotesManifest,
    ReleaseNotesPlatform,
    type ReleaseNotesRelease,
} from '../src/releaseNotesTypes';
import { parseReleaseTag, sortReleasesDescending } from '../src/releaseNotesUtils';

type GithubRelease = {
    tag_name: string;
    published_at: string | null;
    body: string | null;
    draft: boolean;
    prerelease: boolean;
};

const GITHUB_API_URL = 'https://api.github.com/repos/trezor/trezor-suite/releases';
const PAGE_SIZE = 100;
/* One page per platform limit, plus headroom for drafts and non-Suite tags. */
const PAGES_TO_FETCH = 3;

const fetchReleasesPage = async (page: number): Promise<GithubRelease[]> => {
    const headers: Record<string, string> = {
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
    };

    if (process.env.GITHUB_TOKEN) {
        headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    }

    const response = await fetch(`${GITHUB_API_URL}?per_page=${PAGE_SIZE}&page=${page}`, {
        headers,
    });

    if (!response.ok) {
        throw Error(`GitHub API request failed: ${response.status} ${response.statusText}`);
    }

    return (await response.json()) as GithubRelease[];
};

const fetchReleases = async () => {
    const releases: GithubRelease[] = [];

    for (let page = 1; page <= PAGES_TO_FETCH; page++) {
        const pageReleases = await fetchReleasesPage(page);

        releases.push(...pageReleases);

        if (pageReleases.length < PAGE_SIZE) break;
    }

    return releases;
};

const groupByPlatform = (githubReleases: GithubRelease[]) => {
    const byPlatform: Record<ReleaseNotesPlatform, ReleaseNotesRelease[]> = {
        [ReleaseNotesPlatform.Desktop]: [],
        [ReleaseNotesPlatform.Mobile]: [],
    };

    githubReleases.forEach(githubRelease => {
        const { tag_name, published_at, body, draft, prerelease } = githubRelease;

        if (draft || prerelease || published_at === null) return;

        const parsedTag = parseReleaseTag(tag_name);

        if (!parsedTag) return;

        const notes = body?.trim();

        if (!notes) {
            console.warn(`Skipping ${tag_name} because it has empty release notes.`);

            return;
        }

        byPlatform[parsedTag.platform].push({
            version: parsedTag.version,
            publishedAt: published_at,
            notes,
        });
    });

    return byPlatform;
};

const writeManifest = (platform: ReleaseNotesPlatform, releases: ReleaseNotesRelease[]) => {
    const manifest: ReleaseNotesManifest = {
        version: MANIFEST_VERSION,
        generatedAt: new Date().toISOString(),
        releases: sortReleasesDescending(releases).slice(0, PUBLISHED_RELEASES_LIMIT),
    };

    const destination = join(OUTPUT_DIR, platform, MANIFEST_FILENAME);

    mkdirSync(dirname(destination), { recursive: true });
    writeFileSync(destination, `${JSON.stringify(manifest, null, 2)}\n`);
    console.log(`${manifest.releases.length} ${platform} releases saved to ${destination}`);
};

const generateManifests = async () => {
    const githubReleases = await fetchReleases();

    console.log(`Fetched ${githubReleases.length} GitHub releases.`);

    const byPlatform = groupByPlatform(githubReleases);

    Object.values(ReleaseNotesPlatform).forEach(platform => {
        const releases = byPlatform[platform];

        if (releases.length === 0) {
            throw Error(`No ${platform} releases found, refusing to publish an empty manifest.`);
        }

        writeManifest(platform, releases);
    });
};

generateManifests().catch(error => {
    console.error(error);
    process.exit(1);
});
