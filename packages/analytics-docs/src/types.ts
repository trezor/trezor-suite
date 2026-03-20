import type { AppVersion } from '@suite-common/analytics';

export const sorts = ['az', 'za', 'added', 'updated'];
export type Sort = (typeof sorts)[number];

export const platforms = ['desktop', 'mobile', 'shared'];
export type Platform = (typeof platforms)[number];

export const allPlatforms = [...platforms, 'all'];
export type AllPlatform = (typeof allPlatforms)[number];

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
    runtimeType?: string;
    changelog: NormalizedChangelog;
};

export type EventDoc = {
    name: string;
    description?: string;
    possibleImprovements?: string;
    descriptionTrigger: string;
    changelog: NormalizedChangelog;
    attributes: Record<string, AttributeDoc>;
    platform: string;
};

/** Event received by the live log server from Suite (GET /log). */
export type LiveLogEvent = {
    id: string;
    type: string;
    timestamp: string;
    payload: Record<string, string>;
    meta: {
        version?: string;
        commit?: string;
        instanceId?: string;
        sessionId?: string;
        messageId?: string;
    };
    receivedAt: number;
};
