import { useCallback } from 'react';
import { useDispatch } from 'react-redux';

import { invariant } from '@suite-common/suite-utils';
import { type TradingType, tradingThunks } from '@suite-common/trading';

import type { BrowserAuthRet } from './useBrowserAuthTypes';
import { useBrowserStateChangeCallbacks } from './useBrowserStateChangeCallbacks';

// NOTE this is file is for E2E testing purposes only.
// It simulates the browser auth flow without actually opening a browser or listening for deep links.
// We do this because Detox does not support interaction with a Web browser.

export const useBrowserAuth = (tradingType: TradingType | undefined): BrowserAuthRet => {
    const dispatch = useDispatch();
    const { handleBrowserClosed, handleBrowserOpened } =
        useBrowserStateChangeCallbacks(tradingType);

    const openBrowser = useCallback(() => {
        invariant(tradingType, 'tradingType must be defined for browser auth');

        handleBrowserOpened();
        handleBrowserClosed();

        dispatch(
            tradingThunks.setLastErrorMessageByTradingType({
                // This string is targeted in E2E tests. Be careful when changing it, and update the tests if needed.
                errorMessage: 'E2E: Browser auth simulated',
                tradingType,
            }),
        );
    }, [dispatch, handleBrowserClosed, handleBrowserOpened, tradingType]);

    return {
        openBrowser,
        openBrowserForFormData: openBrowser,
    };
};
