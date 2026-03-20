import type { AppVersion } from '@suite-common/analytics';

export type NormalizedChangelog = {
    entries: Array<{
        version: AppVersion;
        notes: string;
    }>;
    addedInVersion?: AppVersion;
    lastUpdatedInVersion?: AppVersion;
};

const parseVersion = (v: string): [number, number, number] => {
    const [a = 0, b = 0, c = 0] = v.split('.').map(n => Number(n) || 0);

    return [a, b, c];
};

const compareVersions = (va: string, vb: string): number => {
    const [a1, b1, c1] = parseVersion(va);
    const [a2, b2, c2] = parseVersion(vb);

    if (a1 !== a2) return a1 - a2;
    if (b1 !== b2) return b1 - b2;
    if (c1 !== c2) return c1 - c2;

    return 0;
};

export const normalizeChangelog = (
    changelog?: Array<{ version: AppVersion; notes: string }>,
): NormalizedChangelog => {
    if (!changelog?.length) return { entries: [] };

    const uniqueVersions = new Map<string, { version: AppVersion; notes: string }[]>();
    for (const entry of changelog) {
        const existing = uniqueVersions.get(entry.version) || [];
        existing.push(entry);
        uniqueVersions.set(entry.version, existing);
    }

    const sortedVersions = Array.from(uniqueVersions.keys()).sort(compareVersions);

    const sortedEntries = sortedVersions.flatMap(version => uniqueVersions.get(version) || []);

    const first = sortedVersions[0] as AppVersion;
    const last = sortedVersions[sortedVersions.length - 1] as AppVersion;

    return {
        entries: sortedEntries,
        addedInVersion: first,
        lastUpdatedInVersion: last !== first ? last : undefined,
    };
};
