import { useEffect, useEffectEvent } from 'react';

import {
    WebBrowserPresentationStyle,
    WebBrowserResultType,
    dismissBrowser,
    openBrowserAsync,
} from 'expo-web-browser';

import { type AppsEmbeddingEvent } from '@suite-common/apps-embedding';
import { type HttpsUrl, exhaustive } from '@trezor/type-utils';

type UseSystemBrowserSessionParams = {
    targetUrl: HttpsUrl;
    onEvent: (event: AppsEmbeddingEvent) => void;
};

const dismissSystemBrowser = () => {
    dismissBrowser()?.catch(_ => {
        // It rejects on iOS when no browser is open, and by now the user has most likely closed it.
    });
};

/**
 * Keeps `targetUrl` open in SFSafariViewController / Chrome Custom Tabs while the caller is
 * mounted. The page itself is out of reach there: only the browser opening (Android) or the
 * session ending (iOS) can be reported.
 */
export const useSystemBrowserSession = ({ targetUrl, onEvent }: UseSystemBrowserSessionParams) => {
    // Reaches the latest callback without reopening the browser whenever the parent re-renders.
    const reportEvent = useEffectEvent(onEvent);

    useEffect(() => {
        let isDisposed = false;

        const openBrowser = async () => {
            try {
                const { type } = await openBrowserAsync(targetUrl, {
                    presentationStyle: WebBrowserPresentationStyle.OVER_FULL_SCREEN,
                    dismissButtonStyle: 'close',
                    showInRecents: true,
                });

                if (isDisposed) {
                    return;
                }

                switch (type) {
                    case WebBrowserResultType.CANCEL:
                    case WebBrowserResultType.DISMISS:
                        reportEvent({ type: 'closed', detail: `system browser ${type}` });
                        break;
                    case WebBrowserResultType.OPENED:
                        // Android resolves right away while the browser stays in the foreground,
                        // so its closing is not observable.
                        reportEvent({
                            type: 'loaded',
                            detail: 'system browser opened (content not observable)',
                        });
                        break;
                    case WebBrowserResultType.LOCKED:
                        reportEvent({
                            type: 'load-failed',
                            detail: 'system browser locked (another session is already open)',
                        });
                        break;
                    default:
                        exhaustive(type);
                }
            } catch (error) {
                if (!isDisposed) {
                    reportEvent({ type: 'load-failed', detail: String(error) });
                }
            }
        };

        openBrowser();

        return () => {
            isDisposed = true;
            dismissSystemBrowser();
        };
    }, [targetUrl]);
};
