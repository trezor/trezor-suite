import { WebView } from 'react-native-webview';

import { type AppsEmbeddingEvent } from '@suite-common/apps-embedding';
import { VStack } from '@suite-native/atoms';
import { type HttpsUrl } from '@trezor/type-utils';

import { EmbeddedAppWebViewToolbar } from './EmbeddedAppWebViewToolbar';
import { useEmbeddedAppWebView } from './hooks/useEmbeddedAppWebView';

// Every URL has to reach onShouldStartLoadWithRequest. The default list hands anything that is not
// http(s) to the OS before the guard is asked: tel:, intent:, another app's or Suite's own deep link.
const ORIGIN_WHITELIST = ['*'];

type EmbeddedAppWebViewProps = {
    targetUrl: HttpsUrl;
    onEvent: (event: AppsEmbeddingEvent) => void;
};

export const EmbeddedAppWebView = ({ targetUrl, onEvent }: EmbeddedAppWebViewProps) => {
    const {
        webViewRef,
        webViewKey,
        navigationState,
        isDebuggingEnabled,
        goBack,
        goForward,
        reload,
        handleShouldStartLoadWithRequest,
        handleLoadStart,
        handleLoad,
        handleError,
        handleOpenWindow,
        handleMessage,
        handleNavigationStateChange,
    } = useEmbeddedAppWebView({ targetUrl, onEvent });

    return (
        <VStack spacing="sp8" flex={1}>
            <EmbeddedAppWebViewToolbar
                url={navigationState.url}
                canGoBack={navigationState.canGoBack}
                canGoForward={navigationState.canGoForward}
                onBack={goBack}
                onForward={goForward}
                onReload={reload}
            />
            <WebView
                key={webViewKey}
                ref={webViewRef}
                source={{ uri: targetUrl }}
                originWhitelist={ORIGIN_WHITELIST}
                onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
                // iOS gives every opening a non-persistent data store. Android can only clear
                // cookies (app-wide, Suite's own included), cache, history and form data, so web
                // storage survives between openings there. Mobile has no per-entry store to keep.
                incognito
                cacheEnabled={false}
                domStorageEnabled
                allowsInlineMediaPlayback
                mediaPlaybackRequiresUserAction={false}
                // Popups are reported and never opened, as desktop does for a site without an
                // allowlist. Opening them automatically lets window.open calls without a user
                // gesture reach the report too. setSupportMultipleWindows keeps its default:
                // turned off, it lets an iframe escape into the top-level page.
                javaScriptCanOpenWindowsAutomatically
                onOpenWindow={handleOpenWindow}
                // Desktop denies every permission. Android WebView grants the camera whenever
                // Suite holds the permission and asks for it otherwise, and it saves downloads to
                // the device; the library offers no way to refuse either.
                geolocationEnabled={false}
                mediaCapturePermissionGrantType="deny"
                webviewDebuggingEnabled={isDebuggingEnabled}
                onLoadStart={handleLoadStart}
                onLoad={handleLoad}
                onError={handleError}
                onMessage={handleMessage}
                onNavigationStateChange={handleNavigationStateChange}
            />
        </VStack>
    );
};
