/**
 * Feature flags configuration file
 * @docs docs/misc/feature_flags.md
 */

// General flags
export const FLAGS = {
    GOOGLE_DRIVE_SYNC: true, // Google Drive sync (used for labeling)
    RBF: true, // replace by fee feature in the send form
    FILE_SYSTEM_SYNC: false, // File system sync (used for labeling)
    ONION_LOCATION_META: true, // Show TOR onion-location meta tag in page head
    EXPORT_TRANSACTIONS: true, // Display export option on transactions
    SEARCH_TRANSACTIONS: true, // Display search option on transactions
    DESKTOP_AUTO_UPDATER: true, // Runs auto updater code on desktop
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

// Landing specific flags
export const FLAGS_LANDING = {
    ...FLAGS,
    // Add overrides below
} as const;

// List of all feature flags and their explanation
export type FeatureFlags = keyof typeof FLAGS;
