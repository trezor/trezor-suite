import { TradingType } from '@suite-common/trading/';
import {
    TestStore,
    act,
    initStore,
    renderHookWithStoreProviderAsync,
} from '@suite-native/test-utils';
import { selectTradingProviderConfirmationStatus } from '@suite-native/trading-state';

import { useProviderWebViewLifecycle } from '../useProviderWebViewLifecycle';

describe('useProviderWebViewLifecycle', () => {
    let store: TestStore;

    const renderUseProviderWebViewLifecycle = (tradingType: TradingType = 'sell') =>
        renderHookWithStoreProviderAsync(() => useProviderWebViewLifecycle(tradingType), { store });

    beforeEach(async () => {
        ({ store } = await initStore());
    });

    it('should set providerConfirmationStatus to "window_opened" on mount', async () => {
        await renderUseProviderWebViewLifecycle();

        expect(selectTradingProviderConfirmationStatus(store.getState())).toBe('window_opened');
    });

    it('should set providerConfirmationStatus to "window_closed_incomplete" on unmount', async () => {
        const { unmount } = await renderUseProviderWebViewLifecycle();

        unmount();

        expect(selectTradingProviderConfirmationStatus(store.getState())).toBe(
            'window_closed_incomplete',
        );
    });

    it('should provide callback for setting providerConfirmationStatus to "window_closed_with_success"', async () => {
        const { result, unmount } = await renderUseProviderWebViewLifecycle();

        act(() => {
            result.current.handleWebViewSuccess();
        });
        unmount();

        expect(selectTradingProviderConfirmationStatus(store.getState())).toBe(
            'window_closed_with_success',
        );
    });

    it('should do nothing when tradingType is not [sell]', async () => {
        const { result, unmount } = await renderUseProviderWebViewLifecycle('buy');
        expect(selectTradingProviderConfirmationStatus(store.getState())).toBe('inactive');

        act(() => {
            result.current.handleWebViewSuccess();
        });
        expect(selectTradingProviderConfirmationStatus(store.getState())).toBe('inactive');

        unmount();
        expect(selectTradingProviderConfirmationStatus(store.getState())).toBe('inactive');
    });
});
