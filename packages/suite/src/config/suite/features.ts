/**
 * Feature flags configuration file
 * @docs docs/misc/feature_flags.md
 */

// General flags
export const FLAGS = {
    GOOGLE_DRIVE_SYNC: false, // Google Drive sync (used for labeling)
} as const;

// Web specific flags
export const FLAGS_WEB = {
    ...FLAGS,
    // Add overrides below
} as const;

// Desktop specific flags
export const FLAGS_DESKTOP = {
    ...FLAGS,
    // Add overrides below
} as const;

// Landing specific flags
export const FLAGS_LANDING = {
    ...FLAGS,
    // Add overrides below
} as const;

// List of all feature flags and their explanation
export type FeatureFlags = keyof typeof FLAGS;
