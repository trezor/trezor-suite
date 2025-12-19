export type AppVersion = `${number}.${number}.${number}`;

export type BaseData = {
    changelog: Array<{ version: AppVersion; notes: string }>;
    limitations?: string;
    description?: string;
};

export type AnalyticsBaseAttribute = BaseData & {
    definition?: string;
};

export type AnalyticsBaseEvent = BaseData & {
    name: string;
    descriptionTrigger: string;
};
