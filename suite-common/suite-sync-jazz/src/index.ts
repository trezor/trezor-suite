/**
 * IMPORTANT: Do not export internal Jazz implementation details.
 *
 * We shall NOT leak Jazz implementation details to maintain compatibility
 * if we need to switch to a different sync technology in the future.
 *
 * Note: createJazzInstanceFactory is now platform-specific and exported from:
 * - suite/suite-sync/src/createJazzInstanceBrowser.ts (for desktop/web)
 * - suite-native/suite-sync/src/createJazzInstanceNative.ts (for mobile)
 */
export { createJazzStorageFactory } from './jazzStorage';
export { jazzCreateSuiteSyncOwner } from './jazzCreateSuiteSyncOwner';

// Re-export schema for platform-specific implementations to use
export { SuiteSyncAccount } from './schema';
