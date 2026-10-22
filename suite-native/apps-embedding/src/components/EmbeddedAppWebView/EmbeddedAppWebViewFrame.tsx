import { Platform } from 'react-native';
import { WebView } from 'react-native-webview';

import { type AppsEmbeddingEvent } from '@suite-common/apps-embedding';
import { VStack } from '@suite-native/atoms';
import { type HttpsUrl } from '@trezor/type-utils';

import { EmbeddedAppWebViewToolbar } from './EmbeddedAppWebViewToolbar';
import { useEmbeddedAppWebViewFrame } from './hooks/useEmbeddedAppWebViewFrame';

// Wide open on purpose, so that every request reaches the guard in the hook. A URL off this list
// is not blocked by the library but handed to the OS through Linking.openURL — another app, the
// system browser, Suite's own deep link — and on iOS that goes for iframe loads too, since every
// frame's navigation passes this check. The per-entry allowlist is enforced by the guard instead,
// which blocks and reports.
const ORIGIN_WHITELIST = ['*'];

type EmbeddedAppWebViewFrameProps = {
    url: HttpsUrl;
    allowedOrigins: string[];
    persistSession: boolean;
    onEvent: (event: AppsEmbeddingEvent) => void;
};

/**
 * The view of one target: rendered under a key of the target's url and persistence by
 * `EmbeddedAppWebView`, so that a switch gets a fresh frame — the toolbar state, the guard's
 * record of what has committed and the WebView's data store all belong to the page that was
 * opened, and iOS cannot switch the store of a live view.
 */
export const EmbeddedAppWebViewFrame = ({
    url,
    allowedOrigins,
    persistSession,
    onEvent,
}: EmbeddedAppWebViewFrameProps) => {
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
        handleFileDownload,
        handleMessage,
        handleNavigationStateChange,
    } = useEmbeddedAppWebViewFrame({ targetUrl: url, allowedOrigins, onEvent });

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
                source={{ uri: url }}
                originWhitelist={ORIGIN_WHITELIST}
                onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
                // A long press on a link would open a preview of it that the guard never hears
                // about.
                allowsLinkPreview={false}
                // Off by default, as on desktop: iOS then gives the opening a non-persistent data
                // store, and Android clears the app's cookies, cache, history and form data up
                // front. A persisting entry keeps its data in the app's default store instead,
                // which every persisting entry shares — mobile has no store per entry.
                incognito={!persistSession}
                cacheEnabled={persistSession}
                domStorageEnabled
                allowsInlineMediaPlayback
                mediaPlaybackRequiresUserAction={true}
                // Popups are reported and never opened, as desktop does for a site without an
                // allowlist. On iOS opening them automatically lets window.open calls without a
                // user gesture reach the report too, at no cost, since the library answers each
                // with no view. Android allocates a native WebView per call and never frees it,
                // so a page there gets one per user gesture only. setSupportMultipleWindows
                // keeps its default: turned off, it lets an iframe escape into the top-level page.
                javaScriptCanOpenWindowsAutomatically={Platform.OS === 'ios'}
                onOpenWindow={handleOpenWindow}
                // Desktop denies every permission. The camera and the microphone are refused on
                // both platforms: the library implements the grant type on iOS only and would grant
                // them on Android whenever Suite holds the permission, to any frame, so Suite's
                // patch of it (.yarn/patches) makes the prop apply there too.
                geolocationEnabled={false}
                mediaCapturePermissionGrantType="deny"
                // Downloads are refused and reported, as on desktop. iOS cancels an attachment
                // response as soon as a handler is set; Android would save the file to the
                // device with the site's cookies and no prompt, so the patched library reports
                // it through the same handler instead (see .yarn/patches/README.md).
                downloadsEnabled={false}
                onFileDownload={handleFileDownload}
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
