import {
    TestStore,
    act,
    initStore,
    renderHookWithStoreProviderAsync,
} from '@suite-native/test-utils';
import { selectTradingProviderConfirmationStatus } from '@suite-native/trading-state';

import { useDispatchProviderConfirmationStatus } from '../useDispatchProviderConfirmationStatus';

describe('useDispatchProviderConfirmationStatus', () => {
    let store: TestStore;

    const renderUseDispatchProviderConfirmationStatus = () =>
        renderHookWithStoreProviderAsync(() => useDispatchProviderConfirmationStatus(), { store });

    beforeEach(async () => {
        ({ store } = await initStore());
    });

    it('should provide callback for dispatching setProviderConfirmationStatus trading action', async () => {
        const { result } = await renderUseDispatchProviderConfirmationStatus();

        act(() => {
            result.current('window_opened');
        });

        expect(selectTradingProviderConfirmationStatus(store.getState())).toBe('window_opened');
    });
});
