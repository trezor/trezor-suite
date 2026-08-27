import { combineReducers } from '@reduxjs/toolkit';

import { extraDependenciesCommonMock } from '@suite-common/test-utils';
import { initialWalletSettingsState } from '@suite-common/wallet-core';
import { localeReducer } from '@suite-native/intl';
import {
    type TestStore,
    act,
    createLightStore,
    createStaticReducer,
    renderHookWithStoreProvider,
} from '@suite-native/test-utils-store';
import { selectTradingProviderConfirmationStatus, tradingSlice } from '@suite-native/trading-state';

import { useDispatchProviderConfirmationStatus } from './useDispatchProviderConfirmationStatus';

describe('useDispatchProviderConfirmationStatus', () => {
    let store: TestStore;

    const renderUseDispatchProviderConfirmationStatus = async () =>
        await renderHookWithStoreProvider(() => useDispatchProviderConfirmationStatus(), { store });

    beforeEach(() => {
        store = createLightStore({
            reducer: {
                locale: localeReducer,
                wallet: combineReducers({
                    settings: createStaticReducer(initialWalletSettingsState),
                    trading: tradingSlice.prepareReducer(extraDependenciesCommonMock),
                }),
            },
        });
    });

    it('should provide callback for dispatching setProviderConfirmationStatus trading action', async () => {
        const { result } = await renderUseDispatchProviderConfirmationStatus();

        await act(() => {
            result.current('window_opened');
        });

        expect(selectTradingProviderConfirmationStatus(store.getState())).toBe('window_opened');
    });
});
