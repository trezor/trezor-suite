import { session } from 'electron';

import { hasSwitch } from './process-switches';

/**
 * Should be used for all webRequest.on* events as there can be only
 * one listener for each of them, but sometimes we need to bind more
 * of them.
 */
export const createInterceptor = (): RequestInterceptor => {
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
            const res = beforeRequestListeners[i](details);
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
