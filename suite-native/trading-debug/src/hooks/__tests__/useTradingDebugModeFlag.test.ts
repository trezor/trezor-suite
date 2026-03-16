import { featureFlagsInitialState } from '@suite-native/feature-flags';
import { type PreloadedState, renderHookWithStoreProvider } from '@suite-native/test-utils';

import { useTradingDebugModeFlag } from '../useTradingDebugModeFlag';

describe('useTradingDebugModeFlag', () => {
    const renderUseDebugModeFlag = (preloadedState: PreloadedState = {}) =>
        renderHookWithStoreProvider(() => useTradingDebugModeFlag(), { preloadedState });

    it.each([true, false])('should respect FF [%s]', ffValue => {
        const { result } = renderUseDebugModeFlag({
            featureFlags: {
                ...featureFlagsInitialState,
                isTradingDebugEnabled: ffValue,
            },
        });

        expect(result.current).toEqual(ffValue);
    });
});
