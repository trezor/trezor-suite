import { activeViewContext, inAppBrowserContext } from './context';
import { ipcMain } from '../../ipcMain';
import { toggleDevTools } from './services/devTools';
import { applyBounds } from './services/dimensions';
import { closeView, openView } from './services/webContentsView';
import { isDevToolsEnabled } from '../../libs/dev-tools-policy';
import { type ModuleInit } from '../module';
import { getActiveWebContents } from './services/general';
import { clearSession, flushPersistentSessions } from './services/session';

export const init: ModuleInit = ({ mainWindowProxy, store }) => {
    // Seeded once, here, rather than in `onLoad`: that runs again after every renderer reload and
    // would drop a live view, and anything awaiting an unset context (`onQuit` before the first
    // handshake included) would wait forever.
    inAppBrowserContext.set({
        mainWindowProxy,
        store,
        sessions: new Map(),
    });

    activeViewContext.set({
        activeView: undefined,
        activeEntryId: undefined,
        clearingEntryIds: new Set(),
        lastReportedRect: undefined,
        isVisibleRequested: true,
        allowedNavigationOrigins: new Set(),
        allowedPopupOrigins: new Set(),
        openPopups: new Set(),
    });

    ipcMain.handle('in-app-browser/open-view', async (_, payload) => {
        await openView(payload);
    });

    ipcMain.handle('in-app-browser/close-view', async () => {
        await closeView();
        // The region itself is going away, so its geometry is no longer meaningful.
        await activeViewContext.insert(() => ({ lastReportedRect: undefined }));
    });

    ipcMain.handle('in-app-browser/set-bounds', async (_, bounds) => {
        await activeViewContext.insert(() => ({ lastReportedRect: bounds }));
        await applyBounds();
    });

    ipcMain.handle('in-app-browser/set-visible', async (_, visible) => {
        await activeViewContext.insert(() => ({ isVisibleRequested: visible }));
        await applyBounds();
    });

    /**
     * `will-navigate` does not fire for a history move, so these cannot be checked against
     * [allowedNavigationOrigins] the way a link click is — and do not need to be. A view's history
     * only ever holds what that view was allowed to reach, and switching sites builds a new view
     * with a new history rather than reusing this one.
     */
    ipcMain.handle('in-app-browser/go-back', async () => {
        const { navigationHistory } = (await getActiveWebContents()) ?? {};

        if (navigationHistory?.canGoBack()) {
            navigationHistory.goBack();
        }
    });

    ipcMain.handle('in-app-browser/go-forward', async () => {
        const { navigationHistory } = (await getActiveWebContents()) ?? {};

        if (navigationHistory?.canGoForward()) {
            navigationHistory.goForward();
        }
    });

    ipcMain.handle('in-app-browser/reload', async () => {
        const webContents = await getActiveWebContents();
        webContents?.reload();
    });

    /**
     * Lets the bar ask before it draws the button, so a build where DevTools are off has no dead
     * control rather than one that answers a click with a log line. Reporting it leaks nothing the
     * View menu does not already show.
     */
    ipcMain.handle('in-app-browser/can-open-dev-tools', () => isDevToolsEnabled);

    /**
     * Gated on the build, not on the caller.
     *
     * The showcase is behind Suite's debug mode, but that is redux state in the renderer: it decides
     * whether the button is drawn and can be flipped by anything running in the page, so it cannot
     * be what decides whether an inspector may be attached. `isDevToolsEnabled` is read from the
     * build and the command line, which is the same answer the View menu and the F12 shortcuts get.
     */
    ipcMain.handle('in-app-browser/toggle-dev-tools', toggleDevTools);

    ipcMain.handle('in-app-browser/clear-data', (_, entryId) => clearSession(entryId, closeView));

    mainWindowProxy.on('destroy', async () => {
        await closeView();
        await activeViewContext.insert(() => ({ lastReportedRect: undefined }));
    });

    return {
        async onLoad() {
            // Runs on every handshake, so also after a renderer reload, which drops the page that
            // owned the view without running its cleanup.
            await closeView();
            await activeViewContext.insert(() => ({ lastReportedRect: undefined }));
        },
        async onQuit() {
            // Closed first, so a page gets to write its final state before the flush.
            await closeView();
            // Flushed before the reset: it reads the sessions from the context, and `get` on a
            // reset context waits forever.
            await flushPersistentSessions();
            inAppBrowserContext.reset();
            activeViewContext.reset();
        },
    };
};
