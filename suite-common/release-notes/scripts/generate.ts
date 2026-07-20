/**
 * Build/CI-time generator for bundled release notes.
 *
 * Fetches the last N minor version lines from GitHub Releases and writes them as local assets
 * (`files/<platform>/<minor>.md` + `index.json`). The app then reads these bundled files at
 * runtime — it never talks to GitHub itself.
 *
 * Usage: tsx scripts/generate.ts --platform desktop|mobile [--max 10]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { MAX_RELEASE_NOTES, type ReleaseNotesManifest, sortAndPrune, toMinorKey } from '../src';

type Platform = 'desktop' | 'mobile';

type GithubRelease = {
    tag_name: string;
    body: string | null;
    published_at: string | null;
    draft: boolean;
    prerelease: boolean;
};

type MinorGroup = {
    minor: string;
    version: string;
    date: string;
    body: string;
};

const GITHUB_API = 'https://api.github.com/repos/trezor/trezor-suite';
const MOBILE_SUFFIX = '@mobile';
// Matches desktop (`v26.8.4`) and mobile (`v26.8.4@mobile`) release tags, skips anything else.
const RELEASE_TAG = /^v\d+\.\d+\.\d+(@mobile)?$/;

const parseArgs = () => {
    const args = process.argv.slice(2);
    const getFlag = (name: string) => {
        const index = args.indexOf(`--${name}`);

        return index !== -1 ? args[index + 1] : undefined;
    };

    return {
        platform: (getFlag('platform') ?? 'desktop') as Platform,
        max: Number(getFlag('max')) || MAX_RELEASE_NOTES,
    };
};

const fetchAllReleases = async (token?: string): Promise<GithubRelease[]> => {
    const releases: GithubRelease[] = [];

    for (let page = 1; page <= 5; page++) {
        const response = await fetch(`${GITHUB_API}/releases?per_page=100&page=${page}`, {
            headers: {
                Accept: 'application/vnd.github+json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
        });

        if (!response.ok) {
            throw new Error(`GitHub API request failed: ${response.status} ${response.statusText}`);
        }

        const data = (await response.json()) as GithubRelease[];
        releases.push(...data);

        if (data.length < 100) {
            break;
        }
    }

    return releases;
};

const isPlatformTag = (tag: string, platform: Platform) => {
    const isMobile = tag.endsWith(MOBILE_SUFFIX);

    return platform === 'mobile' ? isMobile : !isMobile;
};

const toVersion = (tag: string) => tag.replace(/^v/, '').replace(MOBILE_SUFFIX, '');

const patchOf = (version: string) => Number(version.split('.')[2]) || 0;

// Groups releases by minor line, keeping the highest patch of each minor as the representative
// changelog (the latest patch note is a superset of earlier ones).
const buildGroups = (releases: GithubRelease[], platform: Platform): MinorGroup[] => {
    const groups = new Map<string, MinorGroup>();

    releases.forEach(release => {
        if (release.draft || release.prerelease) return;
        if (!RELEASE_TAG.test(release.tag_name)) return;
        if (!isPlatformTag(release.tag_name, platform)) return;

        const version = toVersion(release.tag_name);
        const minor = toMinorKey(version);
        const existing = groups.get(minor);

        if (!existing || patchOf(version) > patchOf(existing.version)) {
            groups.set(minor, {
                minor,
                version,
                date: (release.published_at ?? '').slice(0, 10),
                body: (release.body ?? '').trim(),
            });
        }
    });

    return [...groups.values()];
};

const main = async () => {
    const { platform, max } = parseArgs();
    const currentDir = path.dirname(fileURLToPath(import.meta.url));
    const outDir = path.join(currentDir, '..', 'files', platform);
    const indexPath = path.join(outDir, 'index.json');
    fs.mkdirSync(outDir, { recursive: true });

    try {
        const releases = await fetchAllReleases(process.env.GITHUB_TOKEN);
        const groups = buildGroups(releases, platform);
        const manifest: ReleaseNotesManifest = sortAndPrune(
            groups.map(({ version, minor, date }) => ({ version, minor, date })),
            max,
        );

        fs.readdirSync(outDir)
            .filter(file => file.endsWith('.md'))
            .forEach(file => fs.rmSync(path.join(outDir, file)));

        manifest.forEach(entry => {
            const group = groups.find(item => item.minor === entry.minor);
            fs.writeFileSync(path.join(outDir, `${entry.minor}.md`), `${group?.body ?? ''}\n`);
        });
        fs.writeFileSync(indexPath, `${JSON.stringify(manifest, null, 2)}\n`);

        // eslint-disable-next-line no-console
        console.log(`Wrote ${manifest.length} release notes for "${platform}" to ${outDir}`);
    } catch (error) {
        // Release notes are non-critical: never fail the build. Keep any existing files, and make
        // sure at least an empty manifest exists so bundling and the runtime degrade gracefully.
        console.warn('Failed to generate release notes, keeping existing files if any:', error);
        if (!fs.existsSync(indexPath)) {
            fs.writeFileSync(indexPath, '[]\n');
        }
    }
};

main().catch(error => {
    console.error(error);
    process.exit(1);
});
