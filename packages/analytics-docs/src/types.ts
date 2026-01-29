import type { AppVersion } from '@suite-common/analytics';

export type NormalizedChangelog = {
    entries: {
        version: AppVersion;
        notes: string;
    }[];
    addedInVersion?: AppVersion;
    lastUpdatedInVersion?: AppVersion;
};

export type AttributeDoc = {
    description?: string;
    limitations?: string;
    runtimeType?: string;
    changelog: NormalizedChangelog;
};

export type EventDoc = {
    name: string;
    description?: string;
    descriptionTrigger: string;
    changelog: NormalizedChangelog;
    attributes: Record<string, AttributeDoc>;
    platform: string;
};
