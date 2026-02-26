import { TradingType } from '@suite-common/trading';
import { act } from '@suite-native/test-utils';
// eslint-disable-next-line local-rules/no-package-deep-imports
import { TestStore, initStore, renderHookWithStoreProvider } from '@suite-native/test-utils/store';
import { selectTradingProviderConfirmationStatus } from '@suite-native/trading-state';

import { useBrowserStateChangeCallbacks } from '../useBrowserStateChangeCallbacks';

const mockReportToAnalytics = jest.fn();

jest.mock('@suite-native/trading-analytics', () => ({
    ...jest.requireActual('@suite-native/trading-analytics'),
    useTradingAnalyticReportCallback: () => mockReportToAnalytics,
}));

describe('useBrowserStateChangeCallbacks', () => {
    let store: TestStore;

    const renderUseBrowserwStateChangeCallbacks = (tradingType: TradingType | undefined) =>
        renderHookWithStoreProvider(() => useBrowserStateChangeCallbacks(tradingType), {
            store,
        });

    beforeEach(() => {
        jest.clearAllMocks();
        ({ store } = initStore());
    });

    describe('handleBrowserOpened', () => {
        it('should set correct confirmation status', () => {
            const { result } = renderUseBrowserwStateChangeCallbacks('sell');

            act(() => {
                result.current.handleBrowserOpened();
            });

            expect(selectTradingProviderConfirmationStatus(store.getState())).toBe('window_opened');
        });

        it('should report browser open to analytics', () => {
            const { result } = renderUseBrowserwStateChangeCallbacks('sell');

            act(() => {
                result.current.handleBrowserOpened();
            });

            expect(mockReportToAnalytics).toHaveBeenCalledWith('webview', 'visit');
        });
    });

    describe('handleBrowserClosed', () => {
        it('should set correct confirmation status', () => {
            const { result } = renderUseBrowserwStateChangeCallbacks('sell');

            act(() => {
                result.current.handleBrowserOpened();
                result.current.handleBrowserClosed();
            });

            expect(selectTradingProviderConfirmationStatus(store.getState())).toBe(
                'window_closed_incomplete',
            );
        });
    });

    describe('handleBrowserSuccess', () => {
        it('should set correct confirmation status', () => {
            const { result } = renderUseBrowserwStateChangeCallbacks('sell');

            act(() => {
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
        tradingType => {
            const { result } = renderUseBrowserwStateChangeCallbacks(tradingType);

            const dispatchSpy = jest.spyOn(store, 'dispatch');

            act(() => {
                result.current.handleBrowserOpened();
                result.current.handleBrowserClosed();
                result.current.handleBrowserSuccess();
            });

            expect(selectTradingProviderConfirmationStatus(store.getState())).toBe('inactive');
            expect(dispatchSpy).not.toHaveBeenCalled();
            // note that analytics event should be still reported
            expect(mockReportToAnalytics).toHaveBeenCalledWith('webview', 'visit');
        },
    );

    it('should do nothing when trading type is undefined', () => {
        const { result } = renderUseBrowserwStateChangeCallbacks(undefined);

        const dispatchSpy = jest.spyOn(store, 'dispatch');

        act(() => {
            result.current.handleBrowserOpened();
            result.current.handleBrowserClosed();
            result.current.handleBrowserSuccess();
        });

        expect(selectTradingProviderConfirmationStatus(store.getState())).toBe('inactive');
        expect(dispatchSpy).not.toHaveBeenCalled();
        expect(mockReportToAnalytics).not.toHaveBeenCalled();
    });
});
