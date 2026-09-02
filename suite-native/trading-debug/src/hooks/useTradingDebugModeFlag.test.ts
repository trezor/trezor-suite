import { featureFlagsInitialState } from '@suite-native/feature-flags';
import { renderHookWithStoreProvider } from '@suite-native/test-utils-store';

import { useTradingDebugModeFlag } from './useTradingDebugModeFlag';

describe('useTradingDebugModeFlag', () => {
    const renderUseDebugModeFlag = async (preloadedState = {}) =>
        await renderHookWithStoreProvider(() => useTradingDebugModeFlag(), { preloadedState });

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
