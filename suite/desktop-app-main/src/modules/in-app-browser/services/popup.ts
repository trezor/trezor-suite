import { type BrowserWindow } from 'electron';

import { safeParseUrl } from '@trezor/utils';

import { isNavigationToAllowedOrigin, sendEventToRenderer } from './general';
import { SERVICE_NAME } from '../constants';
import { activeViewContext, inAppBrowserContext, inAppBrowserWebContentsIds } from '../context';

export async function registerPopup(popupWindow: BrowserWindow) {
    const popupContents = popupWindow.webContents;
    // Captured now: the id cannot be read off a destroyed webContents in the `closed` handler.
    const popupContentsId = popupContents.id;

    const { openPopups, allowedNavigationOrigins, allowedPopupOrigins } =
        await activeViewContext.get();
    const { mainWindowProxy } = await inAppBrowserContext.get();

    // A popup exists for a third-party origin, so it is allowed to move between everything the
    // entry declares plus the embedded site's own origin — a sheet that hands control back
    // navigates there itself. Anything else is blocked and reported, exactly as in the view.
    // Decided against the sets captured above, so that both guards below stay synchronous.
    const isPopupNavigationAllowed = (url: string) =>
        isNavigationToAllowedOrigin(url, allowedNavigationOrigins) ||
        isNavigationToAllowedOrigin(url, allowedPopupOrigins);

    openPopups.add(popupWindow);
    // Both halves are needed: registering makes the global lock in createDesktopMainApp.ts
    // defer, and the guard below is then the only thing standing between the popup and an
    // arbitrary origin.
    inAppBrowserWebContentsIds.add(popupContentsId);

    // As in the view: a STUN request over plain UDP would carry the real address past Tor.
    popupContents.setWebRTCIPHandlingPolicy('disable_non_proxied_udp');

    // One level of popups covers every flow the showcase is for.
    popupContents.setWindowOpenHandler(({ url: openedUrl }) => {
        sendEventToRenderer(mainWindowProxy, {
            type: 'window-open-attempt',
            url: openedUrl,
            outcome: 'denied',
        });

        return { action: 'deny' };
    });

    popupContents.on('will-navigate', details => {
        if (isPopupNavigationAllowed(details.url)) {
            return;
        }

        logger.warn(SERVICE_NAME, `Blocked popup navigation to ${details.url}`);
        details.preventDefault();
        sendEventToRenderer(mainWindowProxy, { type: 'navigation-blocked', url: details.url });
    });

    // Server-side redirects never reach `will-navigate`. Checked from the opening load on, like in
    // the view: the whole flow is expected to stay within the declared origins.
    popupContents.on('will-redirect', details => {
        if (!details.isMainFrame || isPopupNavigationAllowed(details.url)) {
            return;
        }

        logger.warn(SERVICE_NAME, `Blocked popup redirect to ${details.url}`);
        details.preventDefault();
        sendEventToRenderer(mainWindowProxy, { type: 'navigation-blocked', url: details.url });
    });

    popupContents.on('did-navigate', (_, navigationUrl) => {
        sendEventToRenderer(mainWindowProxy, { type: 'navigated', url: navigationUrl });
    });

    popupWindow.on('closed', () => {
        openPopups.delete(popupWindow);
        inAppBrowserWebContentsIds.delete(popupContentsId);
    });
}

/**
 * Registers the handler for window.open calls originating from the active view, ensuring that only allowed popup origins can open new windows.
 */
export async function registerPopupOpener() {
    const { activeView, allowedPopupOrigins } = await activeViewContext.get();

    if (!activeView) {
        throw new Error('No active view available to register popup opener');
    }

    const { mainWindowProxy } = await inAppBrowserContext.get();
    const mainWindow = mainWindowProxy.getInstance();

    // `setWindowOpenHandler` can't resolve async handler,
    // therefore we must past the already resolved mainWindowProxy to the handler rather than using `inAppBrowserContext.get()` inside it.
    activeView.webContents.setWindowOpenHandler(({ url: openedUrl }) => {
        const openedOrigin = safeParseUrl(openedUrl)?.origin;

        if (openedOrigin === undefined || !allowedPopupOrigins.has(openedOrigin)) {
            logger.warn(SERVICE_NAME, `Denied window.open for ${openedUrl}`);
            sendEventToRenderer(mainWindowProxy, {
                type: 'window-open-attempt',
                url: openedUrl,
                outcome: 'denied',
            });

            return { action: 'deny' };
        }

        sendEventToRenderer(mainWindowProxy, {
            type: 'window-open-attempt',
            url: openedUrl,
            outcome: 'opened-in-app',
        });

        return {
            action: 'allow',
            overrideBrowserWindowOptions: {
                // A child of the Suite window: it stays above it and dies with it.
                parent: mainWindow,
                autoHideMenuBar: false,
                minimizable: false,
                maximizable: false,
                fullscreenable: false,
                // It's not centered relative to in-app browser window but relative to the main Suite window, so it's off the center anyway
                center: false,
                resizable: false,
                movable: true,
                webPreferences: {
                    nodeIntegration: false,
                    /**
                     * !!! Don't change the security settings below for production, it's important to be strict as possible
                     */
                    sandbox: true,
                    contextIsolation: true,
                    webSecurity: true,
                    allowRunningInsecureContent: false,
                },
            },
        };
    });
}
