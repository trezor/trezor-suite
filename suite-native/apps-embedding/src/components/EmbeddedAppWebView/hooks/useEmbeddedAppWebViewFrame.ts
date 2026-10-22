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

import { getMessageDataLength } from '../utils/getMessageDataLength';
import { isNavigationAllowed } from '../utils/isNavigationAllowed';
import { parseMessageData } from '../utils/parseMessageData';

// The library exports no names for these event types, only the props that carry them.
type WebViewHandler<K extends keyof WebViewProps> = NonNullable<WebViewProps[K]>;

// Enough for any structured message, and far from what a page could cost Suite by posting in a
// loop. UTF-16 code units, as the bridge carries them: 64 KiB of ASCII.
const MAX_MESSAGE_DATA_LENGTH = 64 * 1024;

type EmbeddedAppNavigationState = {
    url: string;
    canGoBack: boolean;
    canGoForward: boolean;
};

type UseEmbeddedAppWebViewFrameParams = {
    targetUrl: HttpsUrl;
    /** Origins the main frame may navigate to, the origin of `targetUrl` among them. */
    allowedOrigins: string[];
    onEvent: (event: AppsEmbeddingEvent) => void;
};

export const useEmbeddedAppWebViewFrame = ({
    targetUrl,
    allowedOrigins,
    onEvent,
}: UseEmbeddedAppWebViewFrameParams) => {
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

    // Messages are accepted from the origin the page was opened with only, whatever else the main
    // frame may navigate to.
    const openedOrigin = safeParseUrl(targetUrl)?.origin;

    // Reported once the decision has been returned: a consumer that throws must not keep a refusal
    // from reaching the WebView, which on Android allows the navigation after 250 ms without an answer.
    const reportAfterDecision = (events: AppsEmbeddingEvent[]) => {
        queueMicrotask(() => events.forEach(onEvent));
    };

    const handleShouldStartLoadWithRequest: WebViewHandler<'onShouldStartLoadWithRequest'> = ({
        url,
        isTopFrame,
        mainDocumentURL,
        navigationType,
    }) => {
        if (isNavigationAllowed({ url, isTopFrame, mainDocumentURL, allowedOrigins })) {
            return true;
        }

        const blockedEvent: AppsEmbeddingEvent = { type: 'navigation-blocked', url };

        // A refused redirect ends the opening load without an error event, so the log has to say
        // why the view stays blank. iOS marks redirects as 'other', and Android refuses nothing
        // else before its first commit.
        const isRedirect = Platform.OS === 'android' || navigationType === 'other';

        reportAfterDecision(
            !hasCommittedRef.current && isRedirect
                ? [
                      blockedEvent,
                      {
                          type: 'load-failed',
                          detail: `${targetUrl}: redirected outside the allowed origins, to ${url}`,
                      },
                  ]
                : [blockedEvent],
        );

        return false;
    };

    // iOS reports a navigation the guard allowed here, Android a committed one. Android asks the
    // guard neither about POST navigations nor for longer than 250 ms, so a page that got past it
    // is taken back here.
    const handleLoadStart: WebViewHandler<'onLoadStart'> = ({ nativeEvent }) => {
        if (!isNavigationAllowed({ url: nativeEvent.url, allowedOrigins })) {
            webViewRef.current?.stopLoading();

            if (nativeEvent.canGoBack) {
                webViewRef.current?.goBack();
            } else {
                setWebViewKey(currentKey => currentKey + 1);
            }

            // Reported once the page has been taken back, so that a consumer that throws cannot
            // leave it in place.
            onEvent({ type: 'navigation-blocked', url: nativeEvent.url });

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
        if (openedOrigin === undefined || safeParseUrl(nativeEvent.url)?.origin !== openedOrigin) {
            return;
        }

        // Typed as a string, but on iOS a page can post any value through the WebKit handler,
        // which is why both utils take the data as unknown.
        const dataLength = getMessageDataLength(nativeEvent.data);

        if (dataLength > MAX_MESSAGE_DATA_LENGTH) {
            onEvent({
                type: 'message-dropped',
                detail: `${dataLength} characters, over the limit of ${MAX_MESSAGE_DATA_LENGTH}`,
            });

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
