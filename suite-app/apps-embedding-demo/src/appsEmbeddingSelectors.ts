import { type DebugRootState, selectIsDebugModeActive } from '@suite/debug';
import { type SuiteSettingsRootState, selectIsAppsEmbeddingEnabled } from '@suite/settings';

type AppsEmbeddingRootState = DebugRootState & SuiteSettingsRootState;

/**
 * The Debug settings switch only counts while debug mode is on: turning debug mode off takes the
 * showcase away with the rest of the debug tooling, and turning it back on restores it as it was.
 */
export const selectIsAppsEmbeddingAvailable = (state: AppsEmbeddingRootState) =>
    selectIsDebugModeActive(state) && selectIsAppsEmbeddingEnabled(state);
