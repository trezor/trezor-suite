export const FLAGS_MODULE_PREFIX = '@suite/flags';

// Keep one active ID per section. Replace it for a qualifying change or retire it explicitly.
export const NewContentIndicatorId = {
    Activity26_8: 'activity-26.8',
    Earn26_8: 'earn-26.8',
    Swap26_10: 'swap-26.10',
} as const;

export type NewContentIndicatorId =
    (typeof NewContentIndicatorId)[keyof typeof NewContentIndicatorId];
