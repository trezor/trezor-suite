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
import { TradingType, tradingThunks } from '@suite-common/trading';
import { useTranslate } from '@suite-native/intl';
import { captureSentryException } from '@suite-native/sentry';
import { tradingActions } from '@suite-native/trading-state';
import { exhaustive } from '@trezor/type-utils';

import { BrowserAuthProps, BrowserAuthRet } from './useBrowserAuthTypes';
import { useBrowserStateChangeCallbacks } from './useBrowserStateChangeCallbacks';
import { useOnForegroundCallback } from './useOnForegroundCallback';
import { getSourceForForm } from '../../../utils/general/formUtils';
import { doesUrlContainCloseCallbackUrl } from '../../../utils/general/utils';

export * from './useBrowserAuthTypes';

class BrowserAuthError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'BrowserAuthError';
    }
}

const noop = () => {};

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

export const useBrowserAuth = ({ tradingType, orderId }: BrowserAuthProps): BrowserAuthRet => {
    const dispatch = useDispatch();
    const { translate } = useTranslate();

    const [lastCallbackUrl, setLastCallbackUrl] = useState<string | undefined>(undefined);

    const receivedDeeplinkUrl = useLinkingURL();
    const dispatchLastErrorMessage = useLastErrorMessageDispatcher(tradingType);
    const { handleBrowserSuccess, handleBrowserClosed, handleBrowserOpened } =
        useBrowserStateChangeCallbacks(tradingType);
    const { setShouldWatchForForeground } = useOnForegroundCallback(handleBrowserClosed);

    // when url contains lastCallbackUrl, dismissBrowser and mark the trade to be opened for buy
    useEffect(() => {
        if (
            !lastCallbackUrl ||
            !doesUrlContainCloseCallbackUrl(receivedDeeplinkUrl ?? '', lastCallbackUrl)
        ) {
            return;
        }

        if (orderId && tradingType === 'buy') {
            dispatch(tradingActions.setTradeOrderIdToBeOpened(orderId));
        }

        handleBrowserSuccess();
        dismissBrowser();
    }, [
        lastCallbackUrl,
        orderId,
        tradingType,
        dispatch,
        handleBrowserSuccess,
        receivedDeeplinkUrl,
    ]);

    const openBrowser = useCallback(
        async (url: string, callbackUrl: string) => {
            if (!tradingType) {
                const msg = 'Attempted to openBrowser without a tradingType provided.';
                console.warn(msg);
                captureSentryException(new BrowserAuthError(msg));

                return;
            }

            setLastCallbackUrl(callbackUrl);

            // Note that provider confirmation status is set "window_opened" even when `openBrowserAsync` fails (error is thrown / browser is locked).
            // There is no need to set it back to "inactive" in that case, because user has no other option than
            // read the error message and close the preview screen to try again.
            handleBrowserOpened();

            try {
                const { type } = await openBrowserAsync(url, {
                    presentationStyle: WebBrowserPresentationStyle.OVER_FULL_SCREEN,
                    dismissButtonStyle: 'close',
                    enableBarCollapsing: false,
                    // this allows to keep the browser open in the background on android, so user can switch
                    // from and back to it (e.g. to copy the 2FA code from authenticator app)
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
        async (formData, returnUrl) => {
            const source = getSourceForForm(formData);
            if (!source?.uri) {
                const msg = 'Unable to open browser, no URI provided.';
                console.warn(msg);
                captureSentryException(new BrowserAuthError(msg));

                return;
            }

            await openBrowser(source.uri, returnUrl);
        },
        [openBrowser],
    );

    return { openBrowser, openBrowserForFormData };
};
