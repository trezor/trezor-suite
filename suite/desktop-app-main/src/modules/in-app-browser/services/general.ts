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
