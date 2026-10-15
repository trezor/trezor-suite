import { type WebContents } from 'electron';

import { type InAppBrowserHostEvent } from '@suite/desktop-app-api';
import { safeParseUrl } from '@trezor/utils';

import { type MainWindowProxy } from '../../../libs/main-window-proxy';
import { activeViewContext } from '../context';

/**
 * Whether `url` is on one of the allowed origins. Synchronous on purpose: the navigation guards
 * call `preventDefault()` on the strength of this answer, and a `preventDefault()` behind an
 * unsettled await no longer blocks anything.
 */
export const isNavigationToAllowedOrigin = (url: string, allowedOrigins: Set<string>) => {
    const origin = safeParseUrl(url)?.origin;

    return origin !== undefined && allowedOrigins.has(origin);
};

// How long a closed page gets to go away before its session is emptied anyway. `destroyed`
// normally follows `close()` within milliseconds; the bound only keeps the queue of calls from
// waiting on a page that never reports it.
const CLOSED_PAGE_TIMEOUT_MS = 1000;

/**
 * Resolves once `webContents` has been destroyed, or after [CLOSED_PAGE_TIMEOUT_MS] at the latest.
 */
export const waitUntilDestroyed = (webContents: WebContents) =>
    new Promise<void>(resolve => {
        if (webContents.isDestroyed()) {
            resolve();

            return;
        }

        const timeout = setTimeout(resolve, CLOSED_PAGE_TIMEOUT_MS);

        webContents.once('destroyed', () => {
            clearTimeout(timeout);
            resolve();
        });
    });

export async function getActiveWebContents() {
    const { activeView } = await activeViewContext.get();

    if (!activeView || activeView.webContents.isDestroyed()) {
        return undefined;
    }

    return activeView.webContents;
}

export function sendEventToRenderer(
    mainWindowProxy: MainWindowProxy,
    event: InAppBrowserHostEvent,
) {
    mainWindowProxy.getInstance()?.webContents.send('in-app-browser/event', event);
}
