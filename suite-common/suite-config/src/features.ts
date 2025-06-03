/**
 * Feature flags configuration file
 * @docs docs/feature-flags.md
 */

// General flags
export const FLAGS = {
    FILE_SYSTEM_SYNC: false, // File system sync (used for labeling)
    ONION_LOCATION_META: true, // Show TOR onion-location meta tag in page head
    DESKTOP_AUTO_UPDATER: true, // Runs auto updater code on desktop
    CROWDIN_IN_ENABLED: false, // Inject Crowdin in-context script for translation ui
} as const;

// Web specific flags
export const FLAGS_WEB = {
    ...FLAGS,
    // Add overrides below
} as const;

// Desktop specific flags
export const FLAGS_DESKTOP = {
    ...FLAGS,
    FILE_SYSTEM_SYNC: true,
    // Add overrides below
} as const;

// List of all feature flags and their explanation
export type FeatureFlags = keyof typeof FLAGS;
