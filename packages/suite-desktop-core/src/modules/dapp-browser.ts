/**
 * dApp-browser host module (M1).
 *
 * Owns a single sandboxed `WebContentsView` that renders a catalog dApp origin
 * "below" the Suite-rendered top bar. A `WebContentsView` is a native layer
 * painted on top of the window's web contents and ignores DOM z-index (§2), so
 * the renderer reports the placeholder rect over IPC and this module positions
 * the view with `setBounds`. The view starts hidden and is revealed only once
 * the first bounds arrive, to avoid a full-window flash.
 *
 * Navigation is hard-locked to the catalog origin; in-view popups are denied
 * and external links are opened in the OS browser. No EIP-1193 provider is
 * injected yet — that (and its dedicated preload) lands in M2.
 */
import { WebContentsView, session, shell } from 'electron';

import { type DappCatalogEntry, getCatalogEntryById } from '@suite/dapp-browser';

import { ipcMain } from '../typed-electron';
import type { ModuleInit } from './module';

export const SERVICE_NAME = 'dapp-browser';

// Ephemeral session — no `persist:` prefix, so nothing the dApp stores survives
// a restart (§8). Isolated from the Suite renderer's default session.
const DAPP_SESSION_PARTITION = 'dapp-browser';

type ActiveDapp = {
    view: WebContentsView;
    entry: DappCatalogEntry;
};

let activeDapp: ActiveDapp | undefined;

/**
 * Consulted by the global `will-navigate` guard in `app.ts` so the dApp view may
 * navigate within its own allow-listed origin while every other web-contents
 * stays locked to https://trezor.io.
 */
export const isAllowedDappNavigation = (contents: Electron.WebContents, origin: string): boolean =>
    activeDapp?.view.webContents === contents && activeDapp.entry.origin === origin;

export const init: ModuleInit = ({ mainWindowProxy }) => {
    const { logger } = global;

    const closeDapp = () => {
        if (!activeDapp) {
            return;
        }

        const { view } = activeDapp;
        activeDapp = undefined;

        try {
            mainWindowProxy.getInstance()?.contentView.removeChildView(view);
        } catch (error) {
            logger.warn(SERVICE_NAME, `Failed to detach dApp view: ${error}`);
        }

        if (!view.webContents.isDestroyed()) {
            view.webContents.close();
        }
    };

    ipcMain.handle('dapp-browser/open', (_, { entryId }) => {
        const mainWindow = mainWindowProxy.getInstance();

        if (!mainWindow) {
            return { success: false, error: 'Main window unavailable' };
        }

        const entry = getCatalogEntryById(entryId);

        if (!entry) {
            return { success: false, error: `Unknown dApp: ${entryId}` };
        }

        // Only one dApp open at a time.
        closeDapp();

        const view = new WebContentsView({
            webPreferences: {
                session: session.fromPartition(DAPP_SESSION_PARTITION),
                contextIsolation: true,
                sandbox: true,
                nodeIntegration: false,
                webSecurity: true,
                // No preload in M1 — the EIP-1193 provider is injected in M2.
            },
        });

        // Lock navigation to the catalog origin (the global guard in app.ts
        // also defers to `isAllowedDappNavigation`).
        view.webContents.on('will-navigate', (event, url) => {
            if (new URL(url).origin !== entry.origin) {
                logger.warn(SERVICE_NAME, `Blocked dApp navigation to ${url}`);
                event.preventDefault();
            }
        });

        // Deny in-view popups; route external links to the OS browser.
        view.webContents.setWindowOpenHandler(({ url }) => {
            shell.openExternal(url);

            return { action: 'deny' };
        });

        mainWindow.contentView.addChildView(view);
        // Stay hidden until the renderer reports where to place the view.
        view.setVisible(false);

        activeDapp = { view, entry };

        view.webContents.loadURL(entry.url).catch(error => {
            logger.error(SERVICE_NAME, `Failed to load ${entry.url}: ${error}`);
        });
        logger.info(SERVICE_NAME, `Opened dApp ${entry.id} (${entry.url})`);

        return { success: true };
    });

    ipcMain.handle('dapp-browser/close', () => {
        closeDapp();
    });

    ipcMain.handle('dapp-browser/set-bounds', (_, bounds) => {
        if (!activeDapp) {
            return;
        }

        activeDapp.view.setBounds({
            x: Math.round(bounds.x),
            y: Math.round(bounds.y),
            width: Math.round(bounds.width),
            height: Math.round(bounds.height),
        });
        activeDapp.view.setVisible(true);
    });

    ipcMain.handle('dapp-browser/set-visible', (_, { visible }) => {
        activeDapp?.view.setVisible(visible);
    });

    // Tear down if the main window goes away.
    mainWindowProxy.on('destroy', closeDapp);
};
