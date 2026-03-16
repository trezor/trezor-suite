import {
    type TestStore,
    act,
    initStore,
    renderHookWithStoreProvider,
} from '@suite-native/test-utils';
import { selectTradingProviderConfirmationStatus } from '@suite-native/trading-state';

import { useDispatchProviderConfirmationStatus } from '../useDispatchProviderConfirmationStatus';

describe('useDispatchProviderConfirmationStatus', () => {
    let store: TestStore;

    const renderUseDispatchProviderConfirmationStatus = () =>
        renderHookWithStoreProvider(() => useDispatchProviderConfirmationStatus(), { store });

    beforeEach(() => {
        ({ store } = initStore());
    });

    it('should provide callback for dispatching setProviderConfirmationStatus trading action', () => {
        const { result } = renderUseDispatchProviderConfirmationStatus();

        act(() => {
            result.current('window_opened');
        });

        expect(selectTradingProviderConfirmationStatus(store.getState())).toBe('window_opened');
    });
});
