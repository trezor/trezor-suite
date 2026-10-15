import { useRef, useState } from 'react';
import { Platform } from 'react-native';
import {
    type WebView,
    type WebViewMessageEvent,
    type WebViewNavigation,
    type WebViewProps,
} from 'react-native-webview';

import { type AppsEmbeddingEvent } from '@suite-common/apps-embedding';
import { isCodesignBuild } from '@trezor/env-utils';
import { type HttpsUrl } from '@trezor/type-utils';
import { safeParseUrl } from '@trezor/utils';

import { isNavigationAllowed } from '../utils/isNavigationAllowed';
import { parseMessageData } from '../utils/parseMessageData';

// The library exports no names for these event types, only the props that carry them.
type WebViewHandler<K extends keyof WebViewProps> = NonNullable<WebViewProps[K]>;

type EmbeddedAppNavigationState = {
    url: string;
    canGoBack: boolean;
    canGoForward: boolean;
};

type UseEmbeddedAppWebViewParams = {
    targetUrl: HttpsUrl;
    onEvent: (event: AppsEmbeddingEvent) => void;
};

export const useEmbeddedAppWebView = ({ targetUrl, onEvent }: UseEmbeddedAppWebViewParams) => {
    const [navigationState, setNavigationState] = useState<EmbeddedAppNavigationState>({
        url: targetUrl,
        canGoBack: false,
        canGoForward: false,
    });
    // Bumped to load the site from scratch when a page that got past the guard has no history to
    // go back through.
    const [webViewKey, setWebViewKey] = useState(0);
    const webViewRef = useRef<WebView>(null);
    const hasCommittedRef = useRef(false);

    // The mobile catalog names no external origins, so the main frame stays on the one it opened.
    const allowedOrigin = safeParseUrl(targetUrl)?.origin;

    const handleShouldStartLoadWithRequest: WebViewHandler<'onShouldStartLoadWithRequest'> = ({
        url,
        isTopFrame,
        navigationType,
    }) => {
        if (
            allowedOrigin !== undefined &&
            isNavigationAllowed({ url, isTopFrame, allowedOrigin })
        ) {
            return true;
        }

        onEvent({ type: 'navigation-blocked', url });

        // A refused redirect ends the opening load without an error event, so the log has to say
        // why the view stays blank. iOS marks redirects as 'other', and Android refuses nothing
        // else before its first commit.
        const isRedirect = Platform.OS === 'android' || navigationType === 'other';

        if (!hasCommittedRef.current && isRedirect) {
            onEvent({
                type: 'load-failed',
                detail: `${targetUrl}: redirected outside the allowed origin, to ${url}`,
            });
        }

        return false;
    };

    // iOS reports a navigation the guard allowed here, Android a committed one. Android asks the
    // guard neither about POST navigations nor for longer than 250 ms, so a page that got past it
    // is taken back here.
    const handleLoadStart: WebViewHandler<'onLoadStart'> = ({ nativeEvent }) => {
        if (
            allowedOrigin !== undefined &&
            !isNavigationAllowed({ url: nativeEvent.url, allowedOrigin })
        ) {
            webViewRef.current?.stopLoading();
            onEvent({ type: 'navigation-blocked', url: nativeEvent.url });

            if (nativeEvent.canGoBack) {
                webViewRef.current?.goBack();
            } else {
                setWebViewKey(currentKey => currentKey + 1);
            }

            return;
        }

        if (Platform.OS === 'android') {
            hasCommittedRef.current = true;
        }

        onEvent({ type: 'navigated', url: nativeEvent.url });
    };

    // Android also reports a failed load as finished, right before the error.
    const handleLoad: WebViewHandler<'onLoad'> = ({ nativeEvent }) => {
        hasCommittedRef.current = true;
        onEvent({ type: 'loaded', detail: nativeEvent.url });
    };

    const handleError: WebViewHandler<'onError'> = ({ nativeEvent }) => {
        onEvent({
            type: 'load-failed',
            detail: `${nativeEvent.url}: ${nativeEvent.description} (${nativeEvent.code})`,
        });
    };

    const handleOpenWindow: WebViewHandler<'onOpenWindow'> = ({ nativeEvent }) => {
        onEvent({ type: 'window-open-attempt', url: nativeEvent.targetUrl, outcome: 'denied' });
    };

    // Both platforms name the frame that posted, so a message from an iframe of another origin
    // never reaches the log.
    const handleMessage = ({ nativeEvent }: WebViewMessageEvent) => {
        if (
            allowedOrigin === undefined ||
            safeParseUrl(nativeEvent.url)?.origin !== allowedOrigin
        ) {
            return;
        }

        onEvent({ type: 'message', data: parseMessageData(nativeEvent.data) });
    };

    const handleNavigationStateChange = ({ url, canGoBack, canGoForward }: WebViewNavigation) => {
        setNavigationState({ url, canGoBack, canGoForward });
    };

    return {
        webViewRef,
        webViewKey,
        navigationState,
        // Desktop opens the in-app browser's dev tools only in builds that are not codesigned.
        isDebuggingEnabled: !isCodesignBuild(),
        goBack: () => webViewRef.current?.goBack(),
        goForward: () => webViewRef.current?.goForward(),
        reload: () => webViewRef.current?.reload(),
        handleShouldStartLoadWithRequest,
        handleLoadStart,
        handleLoad,
        handleError,
        handleOpenWindow,
        handleMessage,
        handleNavigationStateChange,
    };
};
