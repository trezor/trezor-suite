import { isNewer } from '@trezor/utils/src/versionUtils';

export type ChangelogData = {
    versionOverview: string;
    changelog: string;
    upgradeBanner?: string;
};

const loadNPMVersions = (tag: string): Promise<string> =>
    fetch(`https://registry.npmjs.org/@trezor/connect/${tag}`)
        .then(res => res.json())
        .then(data => data.version);

export const loadChangelog = (branch: string): Promise<ChangelogData> =>
    fetch(
        `https://raw.githubusercontent.com/trezor/trezor-suite/${branch}/packages/connect/CHANGELOG.md`,
    )
        .then(res => {
            if (!res.ok) {
                throw new Error(`Changelog not found for ref "${branch}" (${res.status})`);
            }

            return res.text();
        })
        .then(content => {
            // Reduce headings by one level
            content = content.replace(/^(#+)/gm, '$1#');
            // Add links to commit hashes
            content = content.replace(
                /([a-f0-9]{7,10})([),])/g,
                `[$1](https://github.com/trezor/trezor-suite/commit/$1)$2`,
            );
            // A leading blockquote (the "Upgrading from Connect 9?" banner) is pulled out of the
            // markdown so the page can render it as a prominent callout at the top, rather than as
            // a quote buried under the version overview. CHANGELOG.md stays the single source, so
            // the banner still renders on GitHub and on the npm package page.
            let upgradeBanner: string | undefined;
            const bannerMatch = content.match(/^(?:[^\S\n]*>.*\n?)+/);
            if (bannerMatch) {
                upgradeBanner = bannerMatch[0].replace(/^[^\S\n]*> ?/gm, '').trim();
                content = content.slice(bannerMatch[0].length).trimStart();
            }

            const versionOverview =
                `## Version overview\n\n` + content.substring(0, content.indexOf('##'));
            const changelog = content.substring(content.indexOf('##'));

            return { versionOverview, changelog, upgradeBanner };
        });

// On dev.suite.sldev.cz the explorer is deployed per-branch at /connect/{branch}, with the branch
// baked into CONNECT_EXPLORER_FULL_URL at build time (see .github/actions/release-connect). Extract
// it so a preview build shows its own branch's CHANGELOG.md rather than the latest release.
const getSldevBranch = (): string | undefined => {
    const match = process.env.CONNECT_EXPLORER_FULL_URL?.match(
        /^https:\/\/dev\.suite\.sldev\.cz\/connect\/(.+)$/,
    );

    return match?.[1]?.replace(/\/+$/, '') || undefined;
};

const loadReleaseChangelog = async (): Promise<ChangelogData> => {
    const [latest, beta] = await Promise.all([loadNPMVersions('latest'), loadNPMVersions('beta')]);
    const isBetaNewer = isNewer(beta.split('-')[0] ?? beta, latest);
    const newestVersion = isBetaNewer ? beta : latest;

    return loadChangelog(`release/connect/${newestVersion}`);
};

export const loadData = async (): Promise<ChangelogData> => {
    const sldevBranch = getSldevBranch();
    if (sldevBranch) {
        try {
            return await loadChangelog(sldevBranch);
        } catch {
            // Branch has no CHANGELOG.md yet (or is unreachable) — fall back to the latest release.
        }
    }

    return loadReleaseChangelog();
};
