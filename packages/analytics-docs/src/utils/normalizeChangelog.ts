import type { AppVersion } from '@suite-common/analytics';

export type NormalizedChangelog = {
    entries: Array<{
        version: AppVersion;
        notes: string;
    }>;
    addedInVersion?: AppVersion;
    lastUpdatedInVersion?: AppVersion;
};

export const normalizeChangelog = (
    changelog?: Array<{ version: AppVersion; notes: string }>,
): NormalizedChangelog => {
    if (!changelog?.length) return { entries: [] };
    const first = changelog[0].version;
    const last = changelog[changelog.length - 1].version;

    return {
        entries: changelog,
        addedInVersion: first,
        lastUpdatedInVersion: last !== first ? last : undefined,
    };
};
