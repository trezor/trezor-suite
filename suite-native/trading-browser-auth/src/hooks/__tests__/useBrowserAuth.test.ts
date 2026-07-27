import { type StateFromReducersMapObject, combineReducers } from '@reduxjs/toolkit';
import { WebBrowserResultType } from 'expo-web-browser';

import { extraDependenciesCommonMock } from '@suite-common/test-utils';
import { type TradingType, selectTradingSellLastErrorMessage } from '@suite-common/trading';
import { initialWalletSettingsState } from '@suite-common/wallet-core';
import { getTranslation, localeReducer } from '@suite-native/intl';
import {
    type PreloadedStatePartial,
    type TestStore,
    act,
    createLightStore,
    createStaticReducer,
    renderHookWithStoreProvider,
} from '@suite-native/test-utils-store';
import { getWalletState } from '@suite-native/trading-fixtures';
import {
    selectTradeToBeOpened,
    selectTradingProviderConfirmationStatus,
    tradingActions,
    tradingSlice,
} from '@suite-native/trading-state';

import { TRADING_URL_DEFAULT_BACK } from '../../consts';
import { useBrowserAuth } from '../useBrowserAuth';

const mockOpenBrowserAsync = jest.fn();
const mockDismissBrowser = jest.fn();

jest.mock('expo-web-browser', () => {
    const originalModule = jest.requireActual('expo-web-browser');

    return {
        ...originalModule,
        openBrowserAsync: (...args: unknown[]) => mockOpenBrowserAsync(...args),
        dismissBrowser: (...args: unknown[]) => mockDismissBrowser(...args),
    };
});

let mockLinkingURL: string | null;

jest.mock('expo-linking', () => ({
    useLinkingURL: () => mockLinkingURL,
}));

const mockCaptureSentryException = jest.fn();

jest.mock('@suite-native/sentry', () => ({
    captureSentryException: (...args: unknown[]) => mockCaptureSentryException(...args),
}));

const mockSetShouldWatchForForeground = jest.fn();

jest.mock('../useOnForegroundCallback', () => ({
    useOnForegroundCallback: (_: () => void) => ({
        setShouldWatchForForeground: mockSetShouldWatchForForeground,
    }),
}));

describe('useBrowserAuth', () => {
    let store: TestStore;

    const renderUseBrowserAuth = (tradingType: TradingType = 'sell') =>
        renderHookWithStoreProvider(() => useBrowserAuth(tradingType), { store });

    const defaultWalletState = getWalletState();

    const reducer = {
        locale: localeReducer,
        wallet: combineReducers({
            settings: createStaticReducer(initialWalletSettingsState),
            trading: tradingSlice.prepareReducer(extraDependenciesCommonMock),
            accounts: createStaticReducer(defaultWalletState.accounts),
            fiat: createStaticReducer(defaultWalletState.fiat),
            send: createStaticReducer(defaultWalletState.send),
        }),
    } as const;

    beforeEach(() => {
        jest.clearAllMocks();
        mockLinkingURL = null;
        mockDismissBrowser.mockReturnValue(Promise.resolve({ type: WebBrowserResultType.DISMISS }));
        store = createLightStore({
            reducer,
            preloadedState: {
                wallet: {
                    trading: defaultWalletState.trading,
                    accounts: defaultWalletState.accounts,
                    fiat: defaultWalletState.fiat,
                    send: defaultWalletState.send,
                },
            } satisfies PreloadedStatePartial<StateFromReducersMapObject<typeof reducer>>,
        });
    });

    it('should return openBrowser callback', () => {
        const { result } = renderUseBrowserAuth();

        expect(result.current.openBrowser).toBeInstanceOf(Function);
    });

    describe('openBrowser', () => {
        it('should log error to sentry and return early when called with undefined tradingType', async () => {
            const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
            mockOpenBrowserAsync.mockResolvedValue({ type: WebBrowserResultType.OPENED });
            const { result } = renderHookWithStoreProvider(() => useBrowserAuth(undefined), {
                store,
            });

            await act(async () => {
                await result.current.openBrowser('URL', 'CALLBACK_URL');
            });

            expect(selectTradingSellLastErrorMessage(store.getState())).toBe(undefined);
            expect(mockOpenBrowserAsync).not.toHaveBeenCalled();
            expect(selectTradingProviderConfirmationStatus(store.getState())).toBe('inactive');
            expect(consoleWarnSpy).toHaveBeenCalledWith(
                'Attempted to openBrowser without a tradingType provided.',
            );
            expect(mockCaptureSentryException).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Attempted to openBrowser without a tradingType provided.',
                }),
            );
        });

        it('should call openBrowserAsync', () => {
            mockOpenBrowserAsync.mockResolvedValue({ type: WebBrowserResultType.OPENED });
            const { result } = renderUseBrowserAuth();

            act(() => {
                result.current.openBrowser('URL', 'CALLBACK_URL');
            });

            expect(selectTradingSellLastErrorMessage(store.getState())).toBe(undefined);
            expect(mockOpenBrowserAsync).toHaveBeenCalledWith('URL', expect.any(Object));
            expect(selectTradingProviderConfirmationStatus(store.getState())).toBe('window_opened');
        });

        it.each([WebBrowserResultType.CANCEL, WebBrowserResultType.DISMISS])(
            'should call handleBrowserClosed when openBrowserAsync resolves with %s',
            async type => {
                mockOpenBrowserAsync.mockResolvedValue({ type });
                const { result } = renderUseBrowserAuth();

                await act(async () => {
                    await result.current.openBrowser('URL', 'CALLBACK_URL');
                });

                expect(selectTradingProviderConfirmationStatus(store.getState())).toBe(
                    'window_closed_incomplete',
                );
            },
        );

        it('should call setShouldWatchForForeground when openBrowserAsync resolves with opened', async () => {
            mockOpenBrowserAsync.mockResolvedValue({ type: WebBrowserResultType.OPENED });
            const { result } = renderUseBrowserAuth();

            await act(async () => {
                await result.current.openBrowser('URL', 'CALLBACK_URL');
            });

            expect(selectTradingProviderConfirmationStatus(store.getState())).toBe('window_opened');
            expect(mockSetShouldWatchForForeground).toHaveBeenCalledTimes(1);
            expect(mockSetShouldWatchForForeground).toHaveBeenCalledWith(true);
        });

        it('should set last error message when openBrowserAsync resolves with locked', async () => {
            mockOpenBrowserAsync.mockResolvedValue({ type: WebBrowserResultType.LOCKED });
            const { result } = renderUseBrowserAuth();

            await act(async () => {
                await result.current.openBrowser('URL', 'CALLBACK_URL');
            });

            expect(selectTradingProviderConfirmationStatus(store.getState())).toBe('window_opened');
            expect(selectTradingSellLastErrorMessage(store.getState())).toBe(
                getTranslation('moduleTrading.browser.browserLocked'),
            );
        });

        it('should set last error message when openBrowserAsync throws', async () => {
            const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            const error = new Error('Browser error');

            mockOpenBrowserAsync.mockRejectedValue(error);
            const { result } = renderUseBrowserAuth();

            await act(async () => {
                await result.current.openBrowser('URL', 'CALLBACK_URL');
            });

            expect(selectTradingProviderConfirmationStatus(store.getState())).toBe('window_opened');
            expect(selectTradingSellLastErrorMessage(store.getState())).toBe(
                getTranslation('moduleTrading.browser.browserError'),
            );
            expect(errorSpy).toHaveBeenCalledWith('Error opening web browser:', error);
        });
    });

    describe('checkForGoBackOnUrl', () => {
        beforeEach(() => {
            store.dispatch(tradingActions.setProviderConfirmationStatus('window_opened'));
        });

        it('should do nothing when url is empty', () => {
            mockOpenBrowserAsync.mockResolvedValue({ type: WebBrowserResultType.CANCEL });
            renderUseBrowserAuth();

            expect(selectTradeToBeOpened(store.getState())).toBeUndefined();
            expect(selectTradingProviderConfirmationStatus(store.getState())).toBe('window_opened');
            expect(mockDismissBrowser).not.toHaveBeenCalled();
        });

        it('should do nothing when url is not closeCallbackUrl', () => {
            mockLinkingURL = 'https://some.other.url';
            mockOpenBrowserAsync.mockResolvedValue({ type: WebBrowserResultType.CANCEL });
            const { result } = renderUseBrowserAuth();

            act(() => {
                result.current.openBrowser('URL', 'CALLBACK_URL');
            });

            expect(selectTradeToBeOpened(store.getState())).toBeUndefined();
            expect(selectTradingProviderConfirmationStatus(store.getState())).toBe('window_opened');
            expect(mockDismissBrowser).not.toHaveBeenCalled();
        });

        it('should call dismissBrowser and handleBrowserSuccess for sell tradingType when url matches closeCallbackUrl ', () => {
            mockLinkingURL = TRADING_URL_DEFAULT_BACK;
            mockOpenBrowserAsync.mockResolvedValue({ type: WebBrowserResultType.CANCEL });
            const { result } = renderUseBrowserAuth();

            act(() => {
                result.current.openBrowser('URL', TRADING_URL_DEFAULT_BACK);
            });

            expect(selectTradeToBeOpened(store.getState())).toBeUndefined();
            expect(selectTradingProviderConfirmationStatus(store.getState())).toBe(
                'window_closed_with_success',
            );
            expect(mockDismissBrowser).toHaveBeenCalledTimes(1);
        });

        it('should call handleBrowserSuccess and set tradeToBeOpened for buy ', () => {
            mockLinkingURL = TRADING_URL_DEFAULT_BACK;
            mockOpenBrowserAsync.mockResolvedValue({ type: WebBrowserResultType.CANCEL });
            const { result } = renderUseBrowserAuth('buy');

            act(() => {
                result.current.openBrowser('URL', TRADING_URL_DEFAULT_BACK, 'trade-order-id-1');
            });

            expect(selectTradeToBeOpened(store.getState())).toEqual(
                expect.objectContaining({
                    data: expect.objectContaining({ orderId: 'trade-order-id-1' }),
                }),
            );
            expect(mockDismissBrowser).toHaveBeenCalledTimes(1);
        });

        it('should handle dismissBrowser returning undefined', () => {
            mockLinkingURL = TRADING_URL_DEFAULT_BACK;
            mockOpenBrowserAsync.mockResolvedValue({ type: WebBrowserResultType.CANCEL });
            mockDismissBrowser.mockReturnValue(undefined);
            const { result } = renderUseBrowserAuth();

            act(() => {
                result.current.openBrowser('URL', TRADING_URL_DEFAULT_BACK);
            });

            expect(selectTradingProviderConfirmationStatus(store.getState())).toBe(
                'window_closed_with_success',
            );
            expect(mockDismissBrowser).toHaveBeenCalledTimes(1);
        });
    });

    describe('openBrowserForFormData', () => {
        it('should call openBrowserAsync with URL extracted from formData', () => {
            mockOpenBrowserAsync.mockResolvedValue({ type: WebBrowserResultType.OPENED });
            const { result } = renderUseBrowserAuth();

            act(() => {
                result.current.openBrowserForFormData(
                    {
                        formMethod: 'GET',
                        formAction: 'URL',
                        fields: {},
                    },
                    'CALLBACK_URL',
                );
            });

            expect(selectTradingSellLastErrorMessage(store.getState())).toBe(undefined);
            expect(mockOpenBrowserAsync).toHaveBeenCalledWith('URL', expect.any(Object));
            expect(selectTradingProviderConfirmationStatus(store.getState())).toBe('window_opened');
        });

        it('should log error and dispatch error message when method is not supported', () => {
            const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
            mockOpenBrowserAsync.mockResolvedValue({ type: WebBrowserResultType.OPENED });
            const { result } = renderUseBrowserAuth();

            act(() => {
                result.current.openBrowserForFormData(
                    {
                        formMethod: 'IFRAME',
                        formAction: 'URL',
                        fields: {},
                    },
                    'CALLBACK_URL',
                );
            });

            expect(mockOpenBrowserAsync).not.toHaveBeenCalled();
            expect(consoleWarnSpy).toHaveBeenCalledWith('Unable to open browser, no URI provided.');
            expect(mockCaptureSentryException).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Unable to open browser, no URI provided.',
                }),
            );
            expect(selectTradingSellLastErrorMessage(store.getState())).toBe(
                getTranslation('moduleTrading.browser.noURL'),
            );
        });

        it('should call handleBrowserSuccess and set tradeToBeOpened for buy ', () => {
            mockLinkingURL = TRADING_URL_DEFAULT_BACK;
            mockOpenBrowserAsync.mockResolvedValue({ type: WebBrowserResultType.CANCEL });
            const { result } = renderUseBrowserAuth('buy');

            act(() => {
                result.current.openBrowserForFormData(
                    {
                        formMethod: 'GET',
                        formAction: 'URL',
                        fields: {},
                    },
                    TRADING_URL_DEFAULT_BACK,
                    'trade-order-id-1',
                );
            });

            expect(selectTradeToBeOpened(store.getState())).toEqual(
                expect.objectContaining({
                    data: expect.objectContaining({ orderId: 'trade-order-id-1' }),
                }),
            );
            expect(mockDismissBrowser).toHaveBeenCalledTimes(1);
        });
    });
});
