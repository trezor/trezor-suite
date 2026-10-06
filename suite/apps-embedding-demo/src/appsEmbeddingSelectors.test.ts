import { type DebugRootState, debugInitialState } from '@suite/debug';
import { type SuiteSettingsRootState, suiteSettingsInitialState } from '@suite/settings';

import { selectIsAppsEmbeddingAvailable } from './appsEmbeddingSelectors';

type CreateStateParams = {
    isDebugModeActive: boolean;
    isAppsEmbeddingEnabled: boolean;
};

const createState = ({
    isDebugModeActive,
    isAppsEmbeddingEnabled,
}: CreateStateParams): DebugRootState & SuiteSettingsRootState => ({
    debug: { ...debugInitialState, showDebugMenu: isDebugModeActive },
    suiteSettings: {
        ...suiteSettingsInitialState,
        debug: { ...suiteSettingsInitialState.debug, isAppsEmbeddingEnabled },
    },
});

describe('selectIsAppsEmbeddingAvailable', () => {
    it('is available once debug mode and the switch are both on', () => {
        const state = createState({ isDebugModeActive: true, isAppsEmbeddingEnabled: true });

        expect(selectIsAppsEmbeddingAvailable(state)).toBe(true);
    });

    it('stays unavailable in debug mode while the switch is off', () => {
        const state = createState({ isDebugModeActive: true, isAppsEmbeddingEnabled: false });

        expect(selectIsAppsEmbeddingAvailable(state)).toBe(false);
    });

    it('becomes unavailable when debug mode is turned off, even with the switch left on', () => {
        const state = createState({ isDebugModeActive: false, isAppsEmbeddingEnabled: true });

        expect(selectIsAppsEmbeddingAvailable(state)).toBe(false);
    });
});
