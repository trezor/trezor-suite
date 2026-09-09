import { type Store, combineReducers } from '@reduxjs/toolkit';

import { mockActionType } from '@suite-common/redux-utils/mocks';
import { initialWalletSettingsState } from '@suite-common/wallet-core';
import { localeReducer } from '@suite-native/intl';
import {
    act,
    createLightStore,
    createStaticReducer,
    renderHookWithStoreProvider,
} from '@suite-native/test-utils-store';
import {
    type TradingRootState,
    selectTradingProviderConfirmationStatus,
    tradingSlice,
} from '@suite-native/trading-state';

import { useDispatchProviderConfirmationStatus } from './useDispatchProviderConfirmationStatus';

type State = TradingRootState;

describe('useDispatchProviderConfirmationStatus', () => {
    let store: Store<State>;

    const renderUseDispatchProviderConfirmationStatus = async () =>
        await renderHookWithStoreProvider(() => useDispatchProviderConfirmationStatus(), {
            services: { store },
        });

    beforeEach(() => {
        store = createLightStore({
            reducer: {
                locale: localeReducer,
                wallet: combineReducers({
                    settings: createStaticReducer(initialWalletSettingsState),
                    trading: tradingSlice.prepareReducer({
                        actionTypes: { storageLoad: mockActionType('storageLoad') },
                    }),
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
