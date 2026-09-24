import { type BrowserWindow, type Session, type WebContentsView } from 'electron';

import { createContext } from '@trezor/utils';

import { type MainWindowProxy } from '../../../libs/main-window-proxy';
import { type Store } from '../../../libs/store';

type CssRect = {
    x: number;
    y: number;
    width: number;
    height: number;
};

type InAppBrowserContext = {
    mainWindowProxy: MainWindowProxy;
    store: Store;

    /**
     * Electron hands back the same `Session` for the same absolute path and ignores the options of
     * every later call, so identity is kept here rather than depending on that internal cache — and
     * anything installed on a session is installed once, at creation, instead of stacking per open.
     */
    sessions: Map<string, Session>;
};

/**
 * The context for the whole apps embedding module, managing the main window proxy and the store.
 */
export const inAppBrowserContext = createContext<InAppBrowserContext>();

type ActiveViewContext = {
    activeView: WebContentsView | undefined;

    /**
     * Which entry the live view belongs to, so a request to forget
     * an entry's data knows whether it has to take a page down first.
     */
    activeEntryId: string | undefined;

    /**
     * Entries whose data is being forgotten right now. Clearing is asynchronous and the catalog row
     * stays clickable, so without this an "Embed" landing mid-clear would open a page onto a
     * session that is still being emptied underneath it.
     */
    clearingEntryIds: Set<string>;

    /**
     * The view starts hidden and is revealed only once the renderer reports
     * the first bounds, to avoid a flash over the whole window.
     */
    lastReportedRect: CssRect | undefined;
    isVisibleRequested: boolean;

    allowedNavigationOrigins: Set<string>;
    allowedPopupOrigins: Set<string>;

    openPopups: Set<BrowserWindow>;
};

/**
 * The context for one of the currently selected dapp/website from the `suite-common/apps-embedding/src/catalog.ts`
 */
export const activeViewContext = createContext<ActiveViewContext>();

/**
 * Ids of the view's and its popups' `WebContents`, for which the global navigation lock in app.ts
 * defers to this module's own guards.
 * - A plain set rather than a context field: the lock has to answer synchronously, since a
 *   `preventDefault()` behind an unsettled await no longer blocks anything.
 * - Empty until a view opens, so the lock denies by default even when this module never initialised.
 */
export const inAppBrowserWebContentsIds = new Set<number>();
