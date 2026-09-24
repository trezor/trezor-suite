import { WebContentsView } from 'electron';

import { type InAppBrowserOpenPayload } from '@suite/desktop-app-api';
import { getAppsEmbeddingCatalogEntry } from '@suite-common/apps-embedding';
import { safeParseUrl } from '@trezor/utils';

import { SERVICE_NAME } from '../constants';
import { activeViewContext, inAppBrowserContext, inAppBrowserWebContentsIds } from '../context';
import { handleZoomChanged } from './dimensions';
import { getActiveWebContents, isNavigationToAllowedOrigin, sendEventToRenderer } from './general';
import { registerPopup, registerPopupOpener } from './popup';
import { resolveSessionForOpen } from './session';

// Unparsable entries are dropped rather than rejecting the whole open call: an allowlist that
// cannot be parsed can only ever widen nothing.
const toOrigins = (urls: string[]) =>
    urls
        .map(url => safeParseUrl(url)?.origin)
        .filter((origin): origin is string => origin !== undefined);

async function sendNavigationState() {
    const webContents = await getActiveWebContents();

    if (!webContents) return;

    const { navigationHistory } = webContents;
    const { mainWindowProxy } = await inAppBrowserContext.get();

    sendEventToRenderer(mainWindowProxy, {
        type: 'navigation-state',
        url: webContents.getURL(),
        canGoBack: navigationHistory.canGoBack(),
        canGoForward: navigationHistory.canGoForward(),
    });
}

/**
 * The global will-navigate lock in createDesktopMainApp.ts consults this predicate and then defers entirely:
 * the per-view listener installed in `openView` is what decides, so that a blocked navigation can be reported to the renderer from here.
 */
export function isWebContentsOfInAppBrowser(webContentsId: number) {
    return inAppBrowserWebContentsIds.has(webContentsId);
}

export async function closeView() {
    const { activeView, openPopups } = await activeViewContext.get();

    if (!activeView) {
        return;
    }

    logger.info(SERVICE_NAME, 'Closing embedded view');

    // Null at runtime (despite the typing) or destroyed once the page has closed itself, e.g.
    // `window.close()` on its only history entry; the view outlives its WebContents.
    const { webContents } = activeView;
    const liveWebContents = webContents && !webContents.isDestroyed() ? webContents : undefined;

    if (liveWebContents) inAppBrowserWebContentsIds.delete(liveWebContents.id);

    const { mainWindowProxy } = await inAppBrowserContext.get();
    const mainWindow = mainWindowProxy.getInstance();

    mainWindow?.webContents.off('zoom-changed', handleZoomChanged);
    mainWindow?.contentView.removeChildView(activeView);

    liveWebContents?.closeDevTools();

    Array.from(openPopups).forEach(popupWindow => popupWindow.destroy());

    liveWebContents?.close();

    await activeViewContext.insert(() => ({
        activeView: undefined,
        activeEntryId: undefined,
        allowedNavigationOrigins: new Set(),
        allowedPopupOrigins: new Set(),
        opensPopupInSystemBrowser: false,
    }));

    // `lastReportedRect` deliberately survives: switching sites tears the view down and builds
    // a new one, while the renderer's region stays exactly where it was and so never resizes.
    // Clearing here would leave the replacement with no geometry and permanently hidden.
}

export async function openView({
    url,
    redirectExternalOrigins,
    popupExternalOrigins,
    entryId,
}: InAppBrowserOpenPayload) {
    const { mainWindowProxy } = await inAppBrowserContext.get();
    const mainWindow = mainWindowProxy.getInstance();

    if (!mainWindow) {
        logger.error(SERVICE_NAME, 'Cannot open embedded view without the main window');

        return;
    }

    const origin = safeParseUrl(url)?.origin;

    if (origin === undefined) {
        logger.error(SERVICE_NAME, `Refusing to open an unparsable url: ${url}`);

        return;
    }

    const { clearingEntryIds } = await activeViewContext.get();

    if (entryId !== undefined && clearingEntryIds.has(entryId)) {
        logger.warn(SERVICE_NAME, `Refusing to open "${entryId}" while its data is cleared`);
        sendEventToRenderer(mainWindowProxy, {
            type: 'load-failed',
            url,
            error: 'the stored data of this app is still being cleared',
        });

        return;
    }

    const entry = entryId === undefined ? undefined : getAppsEmbeddingCatalogEntry(entryId);

    // An id naming no entry is a caller inventing one. Nothing downstream should act on it:
    // the catalog is the allowlist that keeps ids compile-time constants.
    if (entryId !== undefined && entry === undefined) {
        const error = `"${entryId}" is not a catalog entry`;

        logger.error(SERVICE_NAME, `Refusing to open ${url}: ${error}`);
        sendEventToRenderer(mainWindowProxy, { type: 'load-failed', url, error });

        return;
    }

    // Resolved before anything is torn down. Creating a session touches the filesystem and can
    // fail, and failing after `closeView` would leave the region blank with the previous site
    // gone and nothing in the event log to explain it.
    const openSession = await resolveSessionForOpen(entry);

    if (!openSession.success) {
        logger.error(SERVICE_NAME, `Refusing to open ${url}: ${openSession.error}`);
        sendEventToRenderer(mainWindowProxy, {
            type: 'load-failed',
            url,
            error: openSession.error,
        });

        return;
    }

    // The showcase embeds a single site at a time.
    await closeView();

    logger.info(
        SERVICE_NAME,
        `Opening embedded view for ${url}${openSession.payload.storagePath === null ? '' : ' with a persistent session'}`,
    );

    const view = new WebContentsView({
        webPreferences: {
            session: openSession.payload,
            nodeIntegration: false,

            /**
             * !!! Don't change the security settings below, it's important to be strict as possible
             */
            sandbox: true,
            contextIsolation: true,
            webSecurity: true,
            allowRunningInsecureContent: false,
        },
    });

    // The origin the view is opened with is always navigable; everything beyond it — and every popup,
    // including a same-origin one — is opted into per site instead of being allowed for every site.
    const allowedNavigationOrigins = new Set([origin, ...toOrigins(redirectExternalOrigins)]);

    await activeViewContext.insert(() => ({
        activeView: view,
        activeEntryId: entryId,
        allowedNavigationOrigins,
        allowedPopupOrigins: new Set(toOrigins(popupExternalOrigins)),
    }));

    inAppBrowserWebContentsIds.add(view.webContents.id);

    view.setVisible(false);
    mainWindow.contentView.addChildView(view);
    mainWindow.webContents.on('zoom-changed', handleZoomChanged);

    const { webContents } = view;
    const webContentsId = webContents.id;

    // The page can destroy its own WebContents, and nothing else would take the view down: it would
    // stay attached to the window as the active view. Checked against the active view because a
    // regular `closeView` destroys the WebContents too, possibly after a replacement has opened.
    webContents.once('destroyed', async () => {
        inAppBrowserWebContentsIds.delete(webContentsId);

        const { activeView } = await activeViewContext.get();

        if (activeView === view) {
            await closeView();
        }
    });

    await registerPopupOpener();

    webContents.on('did-create-window', registerPopup);

    const reportBlockedNavigation = (blockedUrl: string, kind: 'navigation' | 'redirect') => {
        logger.warn(
            SERVICE_NAME,
            `Blocked ${kind} to ${blockedUrl}, allowed origins: ${[...allowedNavigationOrigins].join(', ')}`,
        );
        sendEventToRenderer(mainWindowProxy, { type: 'navigation-blocked', url: blockedUrl });
    };

    // Nothing else reports an open that a refused redirect cuts short: the cancelled navigation
    // ends in ERR_ABORTED, for which Electron emits no `did-fail-load`, and the region would stay
    // blank with only the blocked hop in the log.
    let hasCommitted = false;

    // Origin-scoped rather than "this is the embedding view, allow anything": following links
    // within the embedded site is the point, leaving it for an arbitrary origin is not.
    webContents.on('will-navigate', details => {
        if (isNavigationToAllowedOrigin(details.url, allowedNavigationOrigins)) {
            return;
        }

        details.preventDefault();
        reportBlockedNavigation(details.url, 'navigation');
    });

    // `will-navigate` only sees the URL a navigation starts with, so an allowed origin answering
    // 30x with an arbitrary one would otherwise be followed silently. Server-side redirects are
    // held to the same list from the opening load on: an entry whose URL redirects elsewhere on
    // open has to declare that origin like any other hop. Cancelling here cancels the whole
    // navigation, not just the redirect.
    webContents.on('will-redirect', details => {
        if (
            !details.isMainFrame ||
            isNavigationToAllowedOrigin(details.url, allowedNavigationOrigins)
        ) {
            return;
        }

        details.preventDefault();
        reportBlockedNavigation(details.url, 'redirect');

        if (!hasCommitted) {
            sendEventToRenderer(mainWindowProxy, {
                type: 'load-failed',
                url,
                error: `redirected outside the allowed origins, to ${details.url}`,
            });
        }
    });

    // Both carry the url already, but the history flags come from the WebContents rather than
    // from the event, so the bar's state is sent as its own message next to the log line.
    webContents.on('did-navigate', (_, navigationUrl) => {
        hasCommitted = true;
        sendEventToRenderer(mainWindowProxy, { type: 'navigated', url: navigationUrl });
        sendNavigationState();
    });
    webContents.on('did-navigate-in-page', (_, navigationUrl) => {
        sendEventToRenderer(mainWindowProxy, { type: 'navigated', url: navigationUrl });
        sendNavigationState();
    });
    webContents.on('did-finish-load', () => {
        sendEventToRenderer(mainWindowProxy, { type: 'loaded', url: webContents.getURL() });
    });
    webContents.on('did-fail-load', (_, errorCode, errorDescription, validatedUrl) => {
        sendEventToRenderer(mainWindowProxy, {
            type: 'load-failed',
            url: validatedUrl,
            error: `${errorDescription} (${errorCode})`,
        });
    });

    webContents.loadURL(url).catch(error => {
        // The renderer has already heard of the failure — from `did-fail-load`, or from the
        // redirect guard when the opening load was refused, which Electron cancels without one —
        // so this only keeps the rejection from surfacing as an unhandled one.
        logger.warn(SERVICE_NAME, `loadURL failed: ${error}`);
    });
}
