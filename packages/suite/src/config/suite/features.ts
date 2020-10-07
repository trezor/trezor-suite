/**
 * Feature flags configuration file
 * @docs docs/misc/feature_flags.md
 */

// General flags
export const FLAGS = {
    EXAMPLE: true, // Example flag, just here for demo purpose
    // Add more flags here
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
    EXAMPLE: false,
} as const;

// Landing specific flags
export const FLAGS_LANDING = {
    ...FLAGS,
    // Add overrides below
} as const;

// List of all feature flags and their explanation
export type FeatureFlags = keyof typeof FLAGS;
