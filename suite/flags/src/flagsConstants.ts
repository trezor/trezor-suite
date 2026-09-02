export const FLAGS_MODULE_PREFIX = '@suite/flags';

export const NewContentIndicatorId = {
    Activity26_8: 'activity-26.8',
    Earn26_8: 'earn-26.8',
} as const;

export type NewContentIndicatorId =
    (typeof NewContentIndicatorId)[keyof typeof NewContentIndicatorId];
