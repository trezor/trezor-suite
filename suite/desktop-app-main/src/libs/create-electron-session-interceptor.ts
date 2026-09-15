import { session } from 'electron';

import { hasSwitch } from './process-switches';

/**
 * Create an electron Renderer interceptor with API to add/remove custom handlers. In the Renderer process,
 * network requests are made from the electron binary itself (the browser), so we use the electron api.
 * Session.webRequest interceptor allows only one onBeforeRequest handler, but sometimes we need to bind more.
 *
 * This applies on all Renderer process traffic + also electron-updater traffic (it uses an electron Session too).
 * Note that this DOESN'T apply to network requests directly from nodejs, that's done in packages/request-manager
 */
export const createElectronSessionInterceptor = (): RequestInterceptor => {
    let beforeRequestListeners: BeforeRequestListener[] = [];
    const filter = { urls: ['*://*/*'] };

    // URLs that should work even in offline mode (e.g., localhost, test servers)
    const offlineModeAllowedUrls = [
        'http://localhost:8000', // Development server (app itself)
        'file://', // App's own local resources
        'devtools://', // Chrome DevTools
        'chrome-extension://', // Browser extensions
        'data:', // Inline data URLs
        'blob:', // Blob URLs
        // Note: Intentionally NOT allowing other localhost ports or ws:// to force blockchain/discovery to fail
    ];

    const isUrlAllowedInOfflineMode = (url: string): boolean =>
        offlineModeAllowedUrls.some(allowedUrl => url.startsWith(allowedUrl));

    const handleRequest = (
        details: Electron.OnBeforeRequestListenerDetails,
        callback: (response: Electron.CallbackResponse) => void,
    ) => {
        // In offline mode, block all requests from Electron Renderer process (except localhost).
        // This immediately cancels requests, preventing hangs during app initialization.
        if (hasSwitch('offline-mode') && !isUrlAllowedInOfflineMode(details.url)) {
            callback({ cancel: true });

            return;
        }

        for (let i = 0; i < beforeRequestListeners.length; ++i) {
            const listener = beforeRequestListeners[i];
            const res = listener?.(details);
            if (res) {
                callback(res);

                return;
            }
        }
        callback({ cancel: false });
    };

    // Adds listener for electron-updater session.
    const updaterSession = session.fromPartition('electron-updater');
    updaterSession.webRequest.onBeforeRequest(filter, handleRequest);

    // Adds listener for electron default session.
    session.defaultSession.webRequest.onBeforeRequest(filter, handleRequest);

    const onBeforeRequest = (listener: BeforeRequestListener) => {
        beforeRequestListeners.push(listener);
    };

    const offBeforeRequest = (listener: BeforeRequestListener) => {
        beforeRequestListeners = beforeRequestListeners.filter(f => f !== listener);
    };

    return {
        onBeforeRequest,
        offBeforeRequest,
    };
};
