import { useCallback, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';

import { useLinkingURL } from 'expo-linking';
import {
    WebBrowserPresentationStyle,
    WebBrowserResultType,
    dismissBrowser,
    openBrowserAsync,
} from 'expo-web-browser';

import { invariant } from '@suite-common/suite-utils';
import { type TradingType, tradingThunks } from '@suite-common/trading';
import { useTranslate } from '@suite-native/intl';
import { captureSentryException } from '@suite-native/sentry';
import { tradingActions } from '@suite-native/trading-state';
import { exhaustive } from '@trezor/type-utils';
import { noop } from '@trezor/utils';

import type { BrowserAuthRet } from './useBrowserAuthTypes';
import { useBrowserStateChangeCallbacks } from './useBrowserStateChangeCallbacks';
import { useOnForegroundCallback } from './useOnForegroundCallback';
import { getSourceForForm } from '../utils/formUtils';
import { doesUrlContainCloseCallbackUrl } from '../utils/utils';

export type * from './useBrowserAuthTypes';

class BrowserAuthError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'BrowserAuthError';
    }
}

const useLastErrorMessageDispatcher = (tradingType: TradingType | undefined) => {
    const dispatch = useDispatch();

    const dispatchLastErrorMessage = useCallback(
        (errorMessage: string) => {
            invariant(tradingType, 'tradingType must be defined for browser auth');

            dispatch(
                tradingThunks.setLastErrorMessageByTradingType({
                    errorMessage,
                    tradingType,
                }),
            );
        },
        [dispatch, tradingType],
    );

    return tradingType ? dispatchLastErrorMessage : noop;
};

export const useBrowserAuth = (tradingType: TradingType | undefined): BrowserAuthRet => {
    const dispatch = useDispatch();
    const { translate } = useTranslate();

    const [lastCallbackData, setLastCallbackData] = useState<
        { callbackUrl: string; orderId: string | undefined } | undefined
    >(undefined);

    const receivedDeeplinkUrl = useLinkingURL();
    const dispatchLastErrorMessage = useLastErrorMessageDispatcher(tradingType);
    const { handleBrowserSuccess, handleBrowserClosed, handleBrowserOpened } =
        useBrowserStateChangeCallbacks(tradingType);
    const { setShouldWatchForForeground } = useOnForegroundCallback(handleBrowserClosed);

    // when the url contains lastCallbackUrl, dismissBrowser and mark the trade to be opened for buy
    useEffect(() => {
        if (!lastCallbackData || !receivedDeeplinkUrl) {
            return;
        }

        const { callbackUrl, orderId } = lastCallbackData;
        if (!callbackUrl || !doesUrlContainCloseCallbackUrl(receivedDeeplinkUrl, callbackUrl)) {
            return;
        }

        if (orderId && tradingType === 'buy') {
            dispatch(tradingActions.setTradeOrderIdToBeOpened(orderId));
        }

        setLastCallbackData(undefined);
        handleBrowserSuccess();
        dismissBrowser()?.catch(_ => {
            // Ignore the error, the browser might have been already closed.
            // (And in fact it most probably already is.)
        });
    }, [lastCallbackData, tradingType, dispatch, handleBrowserSuccess, receivedDeeplinkUrl]);

    const openBrowser = useCallback(
        async (url: string, callbackUrl: string, orderId?: string) => {
            if (!tradingType) {
                const msg = 'Attempted to openBrowser without a tradingType provided.';
                console.warn(msg);
                captureSentryException(new BrowserAuthError(msg));

                return;
            }

            setLastCallbackData({ callbackUrl, orderId });

            // Note that provider confirmation status is set "window_opened" even when `openBrowserAsync` fails (error is thrown / browser is locked).
            // There is no need to set it back to "inactive" in that case, because a user has no other option than
            // to read the error message and close the preview screen to try again.
            handleBrowserOpened();

            try {
                const { type } = await openBrowserAsync(url, {
                    presentationStyle: WebBrowserPresentationStyle.OVER_FULL_SCREEN,
                    dismissButtonStyle: 'close',
                    enableBarCollapsing: false,
                    // this allows keeping the browser open in the background on android, so user can switch
                    // from and back to it (e.g., to copy the 2FA code from an authenticator app)
                    // without it being killed by the system
                    showInRecents: true,
                });

                switch (type) {
                    case WebBrowserResultType.CANCEL:
                    case WebBrowserResultType.DISMISS:
                        handleBrowserClosed();
                        break;

                    case WebBrowserResultType.OPENED:
                        setShouldWatchForForeground(true);
                        break;

                    case WebBrowserResultType.LOCKED:
                        dispatchLastErrorMessage(translate('moduleTrading.browser.browserLocked'));
                        break;

                    default:
                        return exhaustive(type);
                }
            } catch (error: unknown) {
                console.error('Error opening web browser:', error);
                dispatchLastErrorMessage(translate('moduleTrading.browser.browserError'));
            }
        },
        [
            tradingType,
            dispatchLastErrorMessage,
            handleBrowserClosed,
            handleBrowserOpened,
            setShouldWatchForForeground,
            translate,
        ],
    );

    const openBrowserForFormData = useCallback<BrowserAuthRet['openBrowserForFormData']>(
        async (formData, returnUrl, orderId?: string) => {
            const source = getSourceForForm(formData);
            if (!source?.uri) {
                const msg = 'Unable to open browser, no URI provided.';
                console.warn(msg);
                captureSentryException(new BrowserAuthError(msg));
                dispatchLastErrorMessage(translate('moduleTrading.browser.noURL'));

                return;
            }

            await openBrowser(source.uri, returnUrl, orderId);
        },
        [openBrowser, dispatchLastErrorMessage, translate],
    );

    return { openBrowser, openBrowserForFormData };
};
