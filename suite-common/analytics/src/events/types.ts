export type AppVersion = `${number}.${number}.${number}`;

export type BaseData = {
    changelog: string;
    limitations?: string;
    removedInVersion?: AppVersion;
};

export type AnalyticsBaseAttribute = BaseData & {
    definition?: string;
    addedInVersion: AppVersion;
    lastUpdatedInVersion?: AppVersion;
};

export type AnalyticsBaseEvent = BaseData & {
    name: string;
    descriptionTrigger: string;
    addedInVersion: AppVersion;
    lastUpdatedInVersion: AppVersion;
};
