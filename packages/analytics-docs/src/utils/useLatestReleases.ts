import { useEffect, useState } from 'react';

const GITHUB_RELEASES_URL = 'https://api.github.com/repos/trezor/trezor-suite/releases?per_page=50';

type GitHubRelease = {
    tag_name: string;
    prerelease: boolean;
};

export type LatestReleases = {
    desktop: string | null;
    mobile: string | null;
};

const parseVersionFromTag = (tagName: string): string => {
    const withoutPrefix = tagName.startsWith('v') ? tagName.slice(1) : tagName;

    return withoutPrefix.replace(/@mobile$/i, '');
};

export const useLatestReleases = (): {
    desktop: string | null;
    mobile: string | null;
    isLoading: boolean;
    error: string | null;
} => {
    const [desktop, setDesktop] = useState<string | null>(null);
    const [mobile, setMobile] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        const fetchReleases = async () => {
            try {
                const res = await fetch(GITHUB_RELEASES_URL);
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const data = (await res.json()) as GitHubRelease[];
                if (cancelled) return;

                let latestDesktop: string | null = null;
                let latestMobile: string | null = null;

                for (const release of data) {
                    if (release.prerelease) continue;
                    const tag = release.tag_name;
                    const version = parseVersionFromTag(tag);
                    if (tag.includes('@mobile')) {
                        if (latestMobile === null) latestMobile = version;
                    } else {
                        if (latestDesktop === null) latestDesktop = version;
                    }
                    if (latestDesktop !== null && latestMobile !== null) break;
                }

                setDesktop(latestDesktop);
                setMobile(latestMobile);
                setError(null);
            } catch (e) {
                if (!cancelled) {
                    setError(e instanceof Error ? e.message : 'Failed to fetch');
                }
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        };

        fetchReleases();

        return () => {
            cancelled = true;
        };
    }, []);

    return { desktop, mobile, isLoading, error };
};
