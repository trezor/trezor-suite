import { type Store, combineReducers } from '@reduxjs/toolkit';

import { mockActionType } from '@suite-common/redux-utils/mocks';
import { type TradingType } from '@suite-common/trading';
import { initialWalletSettingsState } from '@suite-common/wallet-core';
import { events } from '@suite-native/analytics';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
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

import { useBrowserStateChangeCallbacks } from './useBrowserStateChangeCallbacks';

type State = TradingRootState;

const mockAnalyticsReport = jest.fn();

describe('useBrowserStateChangeCallbacks', () => {
    let store: Store<State>;

    const renderUseBrowserwStateChangeCallbacks = async (tradingType: TradingType | undefined) =>
        await renderHookWithStoreProvider(() => useBrowserStateChangeCallbacks(tradingType), {
            services: { analytics: mockNativeAnalytics(mockAnalyticsReport), store },
        });

    beforeEach(() => {
        jest.clearAllMocks();
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

    describe('handleBrowserOpened', () => {
        it('should set correct confirmation status', async () => {
            const { result } = await renderUseBrowserwStateChangeCallbacks('sell');

            await act(() => {
                result.current.handleBrowserOpened();
            });

            expect(selectTradingProviderConfirmationStatus(store.getState())).toBe('window_opened');
        });

        it('should report browser open to analytics', async () => {
            const { result } = await renderUseBrowserwStateChangeCallbacks('sell');

            await act(() => {
                result.current.handleBrowserOpened();
            });

            expect(mockAnalyticsReport).toHaveBeenCalledWith({
                type: events.tradingSellEvent.name,
                payload: expect.objectContaining({ step: 'webview', action: 'visit' }),
            });
        });
    });

    describe('handleBrowserClosed', () => {
        it('should set correct confirmation status', async () => {
            const { result } = await renderUseBrowserwStateChangeCallbacks('sell');

            await act(() => {
                result.current.handleBrowserOpened();
                result.current.handleBrowserClosed();
            });

            expect(selectTradingProviderConfirmationStatus(store.getState())).toBe(
                'window_closed_incomplete',
            );
        });
    });

    describe('handleBrowserSuccess', () => {
        it('should set correct confirmation status', async () => {
            const { result } = await renderUseBrowserwStateChangeCallbacks('sell');

            await act(() => {
                result.current.handleBrowserOpened();
                result.current.handleBrowserSuccess();
            });

            expect(selectTradingProviderConfirmationStatus(store.getState())).toBe(
                'window_closed_with_success',
            );
        });
    });

    it.each<TradingType>(['buy', 'exchange'])(
        'should not dispatch confirmation status change for tradingType [%s]',
        async tradingType => {
            const { result } = await renderUseBrowserwStateChangeCallbacks(tradingType);

            const dispatchSpy = jest.spyOn(store, 'dispatch');

            await act(() => {
                result.current.handleBrowserOpened();
                result.current.handleBrowserClosed();
                result.current.handleBrowserSuccess();
            });

            expect(selectTradingProviderConfirmationStatus(store.getState())).toBe('inactive');
            expect(dispatchSpy).not.toHaveBeenCalled();
            if (tradingType === 'exchange') {
                expect(mockAnalyticsReport).toHaveBeenCalledWith({
                    type: events.tradingExchangeEvent.name,
                    payload: expect.objectContaining({ step: 'webview', action: 'visit' }),
                });
            } else {
                expect(mockAnalyticsReport).not.toHaveBeenCalled();
            }
        },
    );

    it('should do nothing when trading type is undefined', async () => {
        const { result } = await renderUseBrowserwStateChangeCallbacks(undefined);

        const dispatchSpy = jest.spyOn(store, 'dispatch');

        await act(() => {
            result.current.handleBrowserOpened();
            result.current.handleBrowserClosed();
            result.current.handleBrowserSuccess();
        });

        expect(selectTradingProviderConfirmationStatus(store.getState())).toBe('inactive');
        expect(dispatchSpy).not.toHaveBeenCalled();
        expect(mockAnalyticsReport).not.toHaveBeenCalled();
    });
});
