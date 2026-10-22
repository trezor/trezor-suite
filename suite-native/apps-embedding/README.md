# @suite-native/apps-embedding

The in-app browser primitives of Suite mobile: everything needed to run a web app inside Suite, and
nothing specific to a showcase. The debug-only showcase that exercises them lives in
`@suite-native/apps-embedding-demo`.

Two ways of opening a site are offered, and they differ a lot in what Suite can see and control:

- `EmbeddedAppWebView` renders the site inline in a `react-native-webview` (WKWebView on iOS, the
  Android System WebView on Android), with a toolbar, a navigation guard that keeps the main frame
  within the origins its catalog entry allows, and `AppsEmbeddingEvent`s for every load,
  navigation, message, popup attempt and error.
- `useSystemBrowserSession` opens the site in the system browser on top of the app
  (SFSafariViewController on iOS, Chrome Custom Tabs on Android) through `expo-web-browser`, and
  keeps it open while the caller is mounted. The page is out of reach there: only the browser
  opening or closing is reported.

Both take a target: a catalog entry by id, or — for the showcase only, and refused outside develop
and debug builds — a custom https URL.

```tsx
import { EmbeddedAppWebView, useSystemBrowserSession } from '@suite-native/apps-embedding';

const target = { kind: 'catalog-entry', entryId: 'example-com' };

// Inline, inside the screen. Suite is told about every navigation, message and error.
<EmbeddedAppWebView target={target} onEvent={handleEvent} />;

// On top of the app, in the system browser. Suite only learns that it opened or closed.
useSystemBrowserSession({ target, onEvent: handleEvent });
```

## Catalog entries

As on desktop, a catalog entry is named, never described: the host reads everything about it from
`APPS_EMBEDDING_CATALOG` in `@suite-common/apps-embedding`, never from the caller — its page,
resolved against the Suite locale for a site with a page per language, and the entry's `mobile`
record:

- `originWhitelist` — origins besides the page's own that the main frame may navigate to, the
  mobile counterpart of the desktop `redirectExternalOrigins`. Every main-frame navigation off the
  list, a server-side redirect included, is blocked and reported; subframes are not held to it, as
  on desktop, but may load https pages and their own `about:`, `blob:` and `data:` content only —
  a scheme that hands the request to another app (`tel:`, `sms:`, `intent:`, Suite's own deep
  link) is refused in any frame. Only the origin of each item is matched, as the catalog promises:
  an item with a path matches by its origin. It is enforced by the host's own
  `onShouldStartLoadWithRequest` guard, not by the
  `originWhitelist` prop of `react-native-webview` it is named after: that prop matches origin
  prefixes, applies to iframe loads as well on iOS, and opens whatever it refuses in another app or
  the system browser through `Linking.openURL` instead of blocking it, so the prop stays `['*']`
  and every request reaches the guard.
- `persistSession` — whether the site keeps its cookies, web storage and cache between openings and
  Suite restarts. Off by default, as on desktop: the WebView then opens the site `incognito`, and
  the iOS system browser in an ephemeral `ASWebAuthenticationSession`, so nothing the site stored
  outlives the session. Mobile has no store per entry: a persisting entry shares the app's default
  WebView store with every other persisting entry, and Chrome Custom Tabs on Android persist
  whatever the flag says. See the table below.

A custom URL declares nothing: it may not leave its origin and persists nothing, and outside develop
and debug builds both hosts refuse it. An entry id the catalog does not know, or a refused custom
URL, is reported as a failed load and opens nothing.

## Feature support

What each host can do on each platform. "WebView" is `EmbeddedAppWebView`, "browser" is
`useSystemBrowserSession`. The cells describe the host's capability; the notes say where
`EmbeddedAppWebView` keeps a capability switched off today and what it would take to turn it on.
Checked on 2026-10-21 against `react-native-webview` 13.16.1 and `expo-web-browser` 57.0.1.

- ✅ works
- ⚠️ works with conditions, see the note
- ❌ does not work

| Feature                                                            | iOS WebView | iOS browser | Android WebView | Android browser |
| ------------------------------------------------------------------ | ----------- | ----------- | --------------- | --------------- |
| Sites that refuse framing (`X-Frame-Options`, `frame-ancestors`)   | ✅ [1]      | ✅ [1]      | ✅ [1]          | ✅ [1]          |
| Page events for Suite (load, navigation, errors)                   | ✅          | ❌ [2]      | ✅              | ❌ [2]          |
| Messages from the page (`postMessage`)                             | ✅ [3]      | ❌          | ✅ [3]          | ❌              |
| Keeping the page within its allowed origins (navigation guard)     | ✅          | ❌          | ⚠️ [4]          | ❌              |
| Return to Suite (callback URL, deep link)                          | ✅ [5]      | ✅ [6]      | ✅ [5]          | ✅ [6]          |
| Popups (`window.open`)                                             | ⚠️ [7]      | ✅          | ⚠️ [7]          | ✅              |
| Camera and microphone (`getUserMedia`)                             | ⚠️ [8]      | ✅          | ⚠️ [9]          | ✅              |
| Apple Pay                                                          | ⚠️ [10]     | ✅          | ❌              | ❌              |
| Google Pay                                                         | ❌ [11]     | ✅ [12]     | ⚠️ [13]         | ✅              |
| Payment Request API                                                | ⚠️ [10]     | ⚠️ [10]     | ⚠️ [13]         | ✅              |
| Sign-in with Google and other providers that reject embedded views | ❌ [14]     | ✅          | ❌ [14]         | ✅              |
| Passkeys (WebAuthn)                                                | ⚠️ [15]     | ✅          | ❌ [16]         | ✅              |
| Persistence between openings (`persistSession` on)                 | ⚠️ [17]     | ✅ [18]     | ⚠️ [19]         | ✅ [20]         |
| Nothing left behind (`persistSession` off, the default)            | ✅ [17]     | ✅ [18]     | ⚠️ [19]         | ❌ [20]         |
| Session shared with the system browser                             | ❌          | ❌ [18]     | ❌              | ✅ [20]         |
| Suite can clear the site's data                                    | ⚠️ [17]     | ❌          | ⚠️ [19]         | ❌              |
| File upload (`<input type="file">`)                                | ✅          | ✅          | ✅ [21]         | ✅              |
| Downloads                                                          | ⚠️ [22]     | ⚠️ [23]     | ✅ [24]         | ✅              |
| Geolocation                                                        | ⚠️ [25]     | ✅          | ⚠️ [25]         | ✅              |
| HTTP Basic authentication                                          | ⚠️ [26]     | ✅          | ⚠️ [26]         | ✅              |
| Remote inspection (Web Inspector, `chrome://inspect`)              | ✅ [27]     | ❌          | ✅ [27]         | ❌              |
| JavaScript dialogs (`alert`, `confirm`, `prompt`)                  | ✅ [28]     | ✅          | ⚠️ [28]         | ✅              |

1. Every mobile host is a top-level browsing context, so the framing rules that stop the web iframe
   do not apply.
2. Suite is told only that the browser closed (iOS) or that it opened (Android, where its closing is
   not observable).
3. Through `window.ReactNativeWebView.postMessage`, which turns everything into a string; on iOS a
   page can also call `window.webkit.messageHandlers.ReactNativeWebView.postMessage` underneath it
   with any value, which arrives as it is. `EmbeddedAppWebView` reports messages from the opened
   origin and drops the rest, and it drops a message over 64 KiB (UTF-16 code units of the string,
   or of the JSON a value serializes to) before parsing it, reporting the drop instead. On iOS the
   bridge is gone once Apple Pay is enabled, see [10].
4. Android asks the guard only about top-level http(s) GET navigations (plus custom-scheme requests
   from any frame; https iframes and POST navigations never reach it) and gives it 250 ms.
   `EmbeddedAppWebView` re-checks every load start and takes a page that got past the guard back.
5. A navigation to a callback URL, like any URL off the allowed origins, reaches
   `onShouldStartLoadWithRequest` before it loads, so the host can intercept it. The guard blocks and
   reports it today; no callback contract is wired yet.
6. Through the `trezorsuite://` scheme or Suite's app links (the `applinks:` associated domains on
   iOS, the intent filters on Android). On iOS the browser stays presented after Suite comes to the
   foreground, until it is dismissed; `useSystemBrowserSession` dismisses it on unmount. An
   ephemeral session (see [18]) ends on a navigation to the `trezorsuite://` scheme instead and
   reports that URL. The system browser is a browser like any other: a page there can open Suite's
   deep links and app links just as a page in Safari or Chrome can, and the host has no guard to
   refuse them, so they are handled as a deep link from anywhere is.
7. Reported through `onOpenWindow`; showing one would mean rendering another WebView.
   `EmbeddedAppWebView` denies and reports every popup. On iOS `javaScriptCanOpenWindowsAutomatically`
   makes calls without a user gesture reach the report too; on Android the library allocates a
   native WebView for every call that reaches it and never frees it, so there the view keeps the
   setting off and only a call backed by a user gesture is reported.
8. WKWebView exposes `getUserMedia` since iOS 14.3 when the app can capture natively (Suite
   declares the camera usage description; its microphone one says the app does not use it). Since
   iOS 15 the host answers each request through `mediaCapturePermissionGrantType`;
   `EmbeddedAppWebView` denies.
9. `react-native-webview` grants the camera and microphone to any frame once Suite holds the runtime
   permission and asks the user otherwise, so a host that grants needs `CAMERA` and `RECORD_AUDIO` in
   the manifest. The library implements `mediaCapturePermissionGrantType` on iOS only; Suite's patch
   of it (`.yarn/patches/react-native-webview-npm-13.16.1-in-app-browser.patch`) makes `deny` and
   `grantIfSameHostElseDeny` apply on Android too, and `EmbeddedAppWebView` denies.
10. iOS 13+, only with `enableApplePay`, which switches off every injected script:
    `injectJavaScript`, the history shim, `sharedCookiesEnabled` and the `window.ReactNativeWebView`
    bridge (a page then has to call `window.webkit.messageHandlers.ReactNativeWebView.postMessage`).
    The merchant also needs its Apple Pay web registration. WebKit's Payment Request API supports
    Apple Pay as its only payment method, in Safari too.
11. Google's web SDK does not support iOS web views, and the pay sheet needs a popup to
    `pay.google.com` with a signed-in Google session, see [7].
12. Safari's engine, with a Google account signed in inside the view's own storage, see [18], not
    the one in Safari.
13. Android System WebView 137+ with the Payment Request API switched on (`paymentRequestEnabled`,
    which calls `WebSettingsCompat.setPaymentRequestEnabled` from androidx.webkit 1.14+), `<queries>`
    for the Chromium `PAY`, `IS_READY_TO_PAY` and `UPDATE_PAYMENT_DETAILS` intents in the manifest,
    and Google Play services 25.18.30+ for the native sheet. Off by default and not enabled in Suite.
14. Google refuses OAuth in embedded web views (`disallowed_useragent`); other providers apply the
    same policy. The page itself loads.
15. iOS 16+, and only for relying parties listed among Suite's associated domains with the
    `webcredentials` service (Suite lists `applinks:` only). Hardware security keys are not supported
    in WKWebView.
16. The host has to route `navigator.credentials` to Credential Manager (androidx.webkit 1.12+
    `setWebAuthenticationSupport` plus Digital Asset Links for the site); `react-native-webview`
    13.16 does not wire it.
17. WKWebView keeps a persistent store per app by default. With `persistSession` off
    `EmbeddedAppWebView` opens the site `incognito`, in a non-persistent store, so nothing survives
    closing and there is nothing left to clear. A persisting entry uses the app's default store,
    which every persisting entry shares — there is no store per entry as on desktop. `clearCache` on
    the view's ref removes that store's caches, web storage and IndexedDB, but not its cookies;
    nothing is wired.
18. Persistent per app, but isolated from Safari and from other apps since iOS 11; Suite can neither
    read nor clear it. With `persistSession` off `useSystemBrowserSession` opens an ephemeral
    `ASWebAuthenticationSession` instead (`openAuthSessionAsync` with `preferEphemeralSession`),
    which keeps nothing and shares nothing; whether the request is honoured depends on the default
    browser. The non-ephemeral variant of that API is the one that shares Safari's cookies, for
    sign-in flows only; it is not used.
19. The app's single WebView profile: cookies are app-wide, so clearing them clears Suite's own —
    the cookie jar of React Native's own `fetch` included, since its `ForwardingCookieHandler`
    stores cookies in the WebView `CookieManager`. With `persistSession` off `incognito` removes
    cookies, cache, history and form data when the view opens — the persisting entries' included —
    and web storage survives between openings regardless. Nothing is removed when the view closes:
    a non-persisting site's cookies stay on disk until the next incognito mount of any entry, and
    its web storage stays whatever is mounted next. `clearCache`, `clearHistory` and
    `clearFormData` on the view's ref clear the profile; nothing is wired.
20. Chrome's own profile: cookies and sign-ins are shared with the Chrome app in both directions, and
    they persist whatever `persistSession` says. `openBrowserAsync` has no ephemeral mode,
    `preferEphemeralSession` is iOS-only, and the ephemeral Custom Tabs of androidx.browser 1.9 are
    not exposed by `expo-web-browser` 57.
21. `react-native-webview` answers `onShowFileChooser` with the photo picker or the camera; a
    `capture` input needs the camera permission.
22. iOS 13+ reports a download through `onFileDownload` and leaves the download to the app; without a
    handler the WebView tries to render the file instead (PDFs render inline). Not wired.
23. The browser's own handling: files open through its share and "Open in" sheet rather than a
    download manager.
24. `react-native-webview` hands downloads to `DownloadManager`, which saves them to the device; the
    host cannot refuse.
25. iOS prompts through the page once the app declares `NSLocationWhenInUseUsageDescription` (Suite
    has none). Android needs `geolocationEnabled` and `ACCESS_FINE_LOCATION` in the manifest; the
    library asks the user when the page does. `EmbeddedAppWebView` keeps it off.
26. No prompt: the host has to supply `basicAuthCredential` up front. `EmbeddedAppWebView` passes
    none, so a challenge ends as a 401 page.
27. `webviewDebuggingEnabled` turns on Safari Web Inspector (iOS 16.4+) and `chrome://inspect`;
    `EmbeddedAppWebView` enables it in builds that are not codesigned.
28. A dialog looks like one of the app unless it says who asked. On iOS a patch of
    `react-native-webview` (see `.yarn/patches`) titles each dialog with the host of the frame that
    opened it, so a third-party iframe cannot pass a prompt off as Suite's own, and shows none for a
    frame without an identifiable host. Android's own dialog names the page, but the top-level one
    whatever frame asked.

### Sources

- [Adding support for Google Pay within Android WebView](https://developers.googleblog.com/en/adding-support-for-google-pay-within-android-webview/)
- [Chrome Custom Tabs security FAQ](https://chromium.googlesource.com/chromium/src/+/main/docs/security/custom-tabs-faq.md)
- [Supporting passkeys (Apple)](https://developer.apple.com/documentation/authenticationservices/supporting-passkeys)
- [Authenticate users with WebView (Android Credential Manager)](https://developer.android.com/identity/sign-in/credential-manager-webview)
- [Apple Pay in WKWebView, WebKit bug 282078](https://bugs.webkit.org/show_bug.cgi?id=282078)
- [react-native-webview reference](https://github.com/react-native-webview/react-native-webview/blob/master/docs/Reference.md)
