import { featureFlagsInitialState } from '@suite-native/feature-flags';
import { PreloadedState, renderHookWithStoreProviderAsync } from '@suite-native/test-utils';

import { useTradingDebugModeFlag } from '../useTradingDebugModeFlag';

describe('useTradingDebugModeFlag', () => {
    const renderUseDebugModeFlag = (preloadedState: PreloadedState = {}) =>
        renderHookWithStoreProviderAsync(() => useTradingDebugModeFlag(), { preloadedState });

    it.each([true, false])('should respect FF [%s]', async ffValue => {
        const { result } = await renderUseDebugModeFlag({
            featureFlags: {
                ...featureFlagsInitialState,
                isTradingDebugEnabled: ffValue,
            },
        });

        expect(result.current).toEqual(ffValue);
    });
});
