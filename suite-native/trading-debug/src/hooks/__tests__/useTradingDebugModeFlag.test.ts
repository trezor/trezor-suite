import { featureFlagsInitialState } from '@suite-native/feature-flags';
// eslint-disable-next-line local-rules/no-package-deep-imports
import { PreloadedState, renderHookWithStoreProvider } from '@suite-native/test-utils/store';

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
