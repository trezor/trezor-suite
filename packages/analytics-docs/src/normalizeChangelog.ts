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
    if (!changelog || changelog.length === 0) {
        return { entries: [] };
    }

    const entries = changelog;

    const addedInVersion = entries[0].version;
    const last = entries[entries.length - 1].version;

    return {
        entries,
        addedInVersion,
        lastUpdatedInVersion: last !== addedInVersion ? last : undefined,
    };
};
